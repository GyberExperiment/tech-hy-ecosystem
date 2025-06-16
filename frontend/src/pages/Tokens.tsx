import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_CONFIG } from '../constants/contracts';
import { 
  Send, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  AlertTriangle, 
  Lock,
  CreditCard,
  Gift,
  Vote,
  Rocket,
  Coins,
  Search,
  Filter,
  BarChart3,
  Shield,
  Activity,
  TrendingUp,
  Users,
  Eye,
  Settings,
  Zap,
  Clock,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import TransactionHistory from '../components/TransactionHistory';
import { ContractStatus } from '../components/ContractStatus';
import TokenStats from '../components/TokenStats';
import { useTokenData } from '../hooks/useTokenData';
import type { TokenData } from '../hooks/useTokenData';
import { log } from '../utils/logger';

interface TokenAllowance {
  spender: string;
  spenderName: string;
  amount: string;
  token: string;
}

// Fallback RPC providers для надёжности
const FALLBACK_PROVIDERS = [
  'https://bsc-testnet-rpc.publicnode.com',
  'https://bsc-testnet.blockpi.network/v1/rpc/public',
  'https://bsc-testnet.public.blastapi.io',
];

const createFallbackProvider = () => {
  try {
    return new ethers.JsonRpcProvider(FALLBACK_PROVIDERS[0]);
  } catch (error) {
    log.error('Failed to create fallback provider', {
      component: 'Tokens',
      function: 'createFallbackProvider',
      provider: FALLBACK_PROVIDERS[0]
    }, error as Error);
    return null;
  }
};

// Utility function для retry логики
const withRetry = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

// Utility function для timeout
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
};

const Tokens: React.FC = () => {
  const { t } = useTranslation(['tokens', 'common']);
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    vcContract, 
    vgContract, 
    vgVotesContract, 
    lpContract,
    provider,
    signer 
  } = useWeb3();

  // Use shared token data hook
  const { 
    tokens, 
    loading, 
    refreshing, 
    refreshData, 
    formatBalance 
  } = useTokenData();

  const [allowances, setAllowances] = useState<TokenAllowance[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveTo, setApproveTo] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'transfer' | 'approve' | 'allowances'>('transfer');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'withBalance' | 'governance'>('all');
  const [transactionLoading, setTransactionLoading] = useState(false);

  // Add icons to tokens from hook
  const tokensWithIcons = tokens.map(token => ({
    ...token,
    icon: getTokenIcon(token.symbol)
  }));

  function getTokenIcon(symbol: string) {
    switch (symbol) {
      case 'VC': return <CreditCard className="w-6 h-6" />;
      case 'VG': return <Gift className="w-6 h-6" />;
      case 'VGVotes': return <Vote className="w-6 h-6" />;
      case 'LP': return <Rocket className="w-6 h-6" />;
      default: return <Coins className="w-6 h-6" />;
    }
  }

  const fetchAllowances = async () => {
    if (!account || !isConnected || !isCorrectNetwork || tokens.length === 0) return;
    
    try {
      const allowanceData: TokenAllowance[] = [];
      const spenders = [
        { address: CONTRACTS.LP_LOCKER, name: 'LP Locker' },
        { address: CONTRACTS.VG_TOKEN_VOTES, name: 'VG Votes' },
        { address: CONTRACTS.PANCAKE_ROUTER, name: 'PancakeSwap Router' },
      ];

      for (const token of tokens) {
        if (!token.contract) continue;
        
        for (const spender of spenders) {
          try {
            const allowance = await withTimeout(
              withRetry(() => token.contract.allowance(account, spender.address)),
              5000
            );
            
            const allowanceFormatted = ethers.formatUnits(allowance, token.decimals);
            
            if (parseFloat(allowanceFormatted) > 0) {
              allowanceData.push({
                spender: spender.address,
                spenderName: spender.name,
                amount: allowanceFormatted,
                token: token.symbol,
              });
            }
          } catch (error) {
            log.warn('Failed to fetch token allowance', {
              component: 'Tokens',
              function: 'fetchAllowances',
              token: token.symbol,
              spender: spender.name,
              address: account
            }, error as Error);
          }
        }
      }

      setAllowances(allowanceData);
    } catch (error) {
      log.error('Failed to fetch all allowances', {
        component: 'Tokens',
        function: 'fetchAllowances',
        address: account
      }, error as Error);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchAllowances();
    }
  }, [account, isConnected, isCorrectNetwork]);

  // Filter tokens based on search and filter criteria
  const filteredTokens = tokens.filter(token => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    let matchesFilter = true;
    if (filterType === 'withBalance') {
      matchesFilter = parseFloat(token.balance) > 0;
    } else if (filterType === 'governance') {
      matchesFilter = token.symbol === 'VG' || token.symbol === 'VGV';
    }
    
    return matchesSearch && matchesFilter;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Адрес скопирован!');
  };

  const estimateGas = async (contract: any, method: string, args: any[]) => {
    try {
      const gasEstimate = await contract[method].estimateGas(...args);
      // Добавляем 20% буфер для безопасности
      return gasEstimate * 120n / 100n;
    } catch (error) {
      log.warn('Gas estimation failed, using fallback gas limit', {
        component: 'Tokens',
        function: 'estimateGas',
        method,
        fallbackGas: '100000'
      }, error as Error);
      return 100000n; // Fallback gas limit
    }
  };

  const handleTransfer = async () => {
    if (!selectedToken || !transferTo || !transferAmount || !signer) {
      toast.error('Заполните все поля');
      return;
    }

    if (!ethers.isAddress(transferTo)) {
      toast.error('Некорректный адрес');
      return;
    }

    if (!selectedToken.contract) {
      toast.error('Контракт токена недоступен');
      return;
    }

    setTransactionLoading(true);

    try {
      const amount = ethers.parseUnits(transferAmount, selectedToken.decimals);
      const contractWithSigner = selectedToken.contract.connect(signer);
      
      // Проверяем баланс
      const balance = await selectedToken.contract.balanceOf(account);
      if (balance < amount) {
        throw new Error('Недостаточно токенов для перевода');
      }
      
      // Оцениваем gas
      const gasLimit = await estimateGas(contractWithSigner, 'transfer', [transferTo, amount]);
      
      toast.loading('Отправка транзакции...', { id: 'transfer' });
      
      const tx = await contractWithSigner.transfer(transferTo, amount, {
        gasLimit,
        // MEV protection: добавляем случайный nonce offset
        nonce: await signer.getNonce() + Math.floor(Math.random() * 3)
      });
      
      toast.loading('Ожидание подтверждения...', { id: 'transfer' });
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        log.transaction('Token transfer successful', tx.hash, {
          token: selectedToken.symbol,
          amount: transferAmount,
          recipient: transferTo,
          sender: account
        });
        
        toast.success(`Перевод ${transferAmount} ${selectedToken.symbol} выполнен успешно!`, { id: 'transfer' });
        
        // Обновляем балансы
        await refreshData();
        
        // Очищаем форму
        setTransferTo('');
        setTransferAmount('');
      } else {
        throw new Error('Транзакция не удалась');
      }
      
    } catch (error: any) {
      log.error('Token transfer failed', {
        component: 'Tokens',
        function: 'handleTransfer',
        token: selectedToken?.symbol,
        amount: transferAmount,
        recipient: transferTo,
        sender: account,
        errorMessage: error.message
      }, error);
      
      let errorMessage = 'Ошибка перевода';
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Недостаточно BNB для оплаты gas';
      } else if (error.message?.includes('transfer amount exceeds balance')) {
        errorMessage = 'Недостаточно токенов для перевода';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Транзакция отклонена пользователем';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'transfer' });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedToken || !approveTo || !approveAmount || !signer) {
      toast.error('Заполните все поля');
      return;
    }

    if (!ethers.isAddress(approveTo)) {
      toast.error('Некорректный адрес');
      return;
    }

    if (!selectedToken.contract) {
      toast.error('Контракт токена недоступен');
      return;
    }

    setTransactionLoading(true);

    try {
      let amount: bigint;
      
      // Обрабатываем MAX значение
      if (approveAmount === ethers.MaxUint256.toString()) {
        amount = ethers.MaxUint256;
      } else {
        amount = ethers.parseUnits(approveAmount, selectedToken.decimals);
      }
      
      const contractWithSigner = selectedToken.contract.connect(signer);
      
      // Оцениваем gas
      const gasLimit = await estimateGas(contractWithSigner, 'approve', [approveTo, amount]);
      
      toast.loading('Отправка транзакции...', { id: 'approve' });
      
      const tx = await contractWithSigner.approve(approveTo, amount, {
        gasLimit,
        // MEV protection
        nonce: await signer.getNonce() + Math.floor(Math.random() * 3)
      });
      
      toast.loading('Ожидание подтверждения...', { id: 'approve' });
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        log.transaction('Token approval successful', tx.hash, {
          token: selectedToken.symbol,
          amount: approveAmount,
          spender: approveTo,
          owner: account
        });
        
        toast.success(`Approve для ${selectedToken.symbol} выполнен успешно!`, { id: 'approve' });
        
        // Обновляем allowances
        await fetchAllowances();
        
        // Очищаем форму
        setApproveTo('');
        setApproveAmount('');
      } else {
        throw new Error('Транзакция не удалась');
      }
      
    } catch (error: any) {
      log.error('Token approval failed', {
        component: 'Tokens',
        function: 'handleApprove',
        token: selectedToken?.symbol,
        amount: approveAmount,
        spender: approveTo,
        owner: account,
        errorMessage: error.message
      }, error);
      
      let errorMessage = 'Ошибка approve';
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Недостаточно BNB для оплаты gas';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Транзакция отклонена пользователем';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'approve' });
    } finally {
      setTransactionLoading(false);
    }
  };

  const setMaxAmount = () => {
    if (selectedToken) {
      if (activeTab === 'transfer') {
        setTransferAmount(selectedToken.balance);
      } else {
        setApproveAmount(selectedToken.balance);
      }
    }
  };

  const handleRefresh = () => {
    refreshData();
  };

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('common:messages.connectWallet')}
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Подключите кошелек для управления токенами
          </p>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-3xl font-bold mb-4 text-red-400">
            Неправильная сеть
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            {t('common:messages.wrongNetwork')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 px-4 md:px-8 lg:px-12">
      {/* Contract Status */}
      <ContractStatus />

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Coins className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('tokens:title')}
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {t('tokens:subtitle')}
        </p>
      </div>

      {/* Token Statistics - Reusable Component */}
      <TokenStats />

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по названию или символу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="input-field"
              >
                <option value="all">Все токены</option>
                <option value="withBalance">С балансом</option>
                <option value="governance">Governance токены</option>
              </select>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="btn-secondary p-2"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold flex items-center text-slate-100">
            <Coins className="mr-3 text-blue-400" />
            Ваши токены ({filteredTokens.length})
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-600 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTokens.map((token) => (
                <div 
                  key={token.symbol} 
                  className={`card cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    selectedToken?.symbol === token.symbol 
                      ? 'ring-2 ring-blue-500/50 bg-blue-500/10' 
                      : ''
                  }`}
                  onClick={() => setSelectedToken(token)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center`}>
                        {token.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-lg">{token.name}</h3>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-400">{token.symbol}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(token.address);
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={`${BSC_CONFIG.blockExplorer}/token/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-slate-100 text-lg">
                        {formatBalance(token.balance)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {token.symbol}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Total Supply</p>
                        <p className="text-slate-200 font-medium">{formatBalance(token.totalSupply)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Decimals</p>
                        <p className="text-slate-200 font-medium">{token.decimals}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center text-slate-100">
            <Settings className="mr-3 text-purple-400" />
            Действия с токенами
          </h2>

          {selectedToken ? (
            <div className="card">
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${selectedToken.color} flex items-center justify-center mx-auto mb-3`}>
                    {selectedToken.icon}
                  </div>
                  <h3 className="font-bold text-slate-100 text-lg">{selectedToken.name}</h3>
                  <p className="text-sm text-gray-400">{selectedToken.symbol}</p>
                  <p className="text-xl font-bold text-slate-100 mt-2">
                    {formatBalance(selectedToken.balance)} {selectedToken.symbol}
                  </p>
                  {!selectedToken.contract && (
                    <div className="mt-2 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-1">
                      Контракт недоступен
                    </div>
                  )}
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all text-slate-200 ${
                      activeTab === 'transfer'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => setActiveTab('approve')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all text-slate-200 ${
                      activeTab === 'approve'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setActiveTab('allowances')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all text-slate-200 ${
                      activeTab === 'allowances'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Allowances
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'transfer' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">
                        Адрес получателя
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="0x..."
                          className="input-field w-full font-mono text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setTransferTo(CONTRACTS.LP_LOCKER)}
                            className="btn-secondary text-xs py-1 px-2"
                          >
                            LP Locker
                          </button>
                          <button
                            onClick={() => setTransferTo(CONTRACTS.VG_TOKEN_VOTES)}
                            className="btn-secondary text-xs py-1 px-2"
                          >
                            VG Votes
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">
                        Количество
                        <span className="text-gray-400 ml-2">
                          (Доступно: {formatBalance(selectedToken.balance)})
                        </span>
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="0.0"
                          className="input-field flex-1"
                          step="any"
                        />
                        <button
                          onClick={setMaxAmount}
                          className="btn-secondary text-sm px-3"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleTransfer}
                      disabled={!transferTo || !transferAmount || !selectedToken.contract || transactionLoading}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {transactionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Отправка...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Отправить</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {activeTab === 'approve' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">
                        Spender адрес
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={approveTo}
                          onChange={(e) => setApproveTo(e.target.value)}
                          placeholder="0x..."
                          className="input-field w-full font-mono text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setApproveTo(CONTRACTS.LP_LOCKER)}
                            className="btn-secondary text-xs py-1 px-2"
                          >
                            LP Locker
                          </button>
                          <button
                            onClick={() => setApproveTo(CONTRACTS.PANCAKE_ROUTER)}
                            className="btn-secondary text-xs py-1 px-2"
                          >
                            PancakeSwap
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">
                        Количество для approve
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={approveAmount}
                          onChange={(e) => setApproveAmount(e.target.value)}
                          placeholder="0.0"
                          className="input-field flex-1"
                          step="any"
                        />
                        <button
                          onClick={() => setApproveAmount(ethers.MaxUint256.toString())}
                          className="btn-secondary text-xs px-3"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleApprove}
                      disabled={!approveTo || !approveAmount || !selectedToken.contract || transactionLoading}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {transactionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Подтверждение...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {activeTab === 'allowances' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-100">Активные Allowances</h4>
                    {allowances.filter(allowance => allowance.token === selectedToken.symbol).length > 0 ? (
                      <div className="space-y-3">
                        {allowances
                          .filter(allowance => allowance.token === selectedToken.symbol)
                          .map((allowance, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-slate-200 text-sm">{allowance.spenderName}</p>
                                  <p className="text-gray-400 text-xs font-mono">{allowance.spender}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-100 text-sm">
                                    {formatBalance(allowance.amount)}
                                  </p>
                                  <p className="text-gray-400 text-xs">{allowance.token}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Нет активных allowances</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-xl font-bold mb-2 text-slate-100">Выберите токен</h3>
              <p className="text-gray-400">
                Выберите токен из списка для выполнения операций
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Zap className="mr-3 text-yellow-400" />
          Быстрые действия
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">LP Locking</h3>
            <p className="text-gray-400 mb-4">Заблокируйте LP токены и получите VG</p>
            <a href="/staking" className="btn-primary inline-block">
              Перейти к LP Locking
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">Governance</h3>
            <p className="text-gray-400 mb-4">Участвуйте в голосовании и управлении</p>
            <a href="/governance" className="btn-primary inline-block">
              Перейти к Governance
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">Analytics</h3>
            <p className="text-gray-400 mb-4">Статистика и аналитика экосистемы</p>
            <a href="/" className="btn-primary inline-block">
              Перейти к Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Shield className="mr-3 text-blue-400" />
          Информация о контрактах
        </h2>
        
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {tokens.map((token) => (
              <div key={token.symbol} className="flex justify-between items-center p-3 rounded bg-white/5">
                <span className="font-medium text-slate-200">{token.name}</span>
                <a
                  href={`${BSC_CONFIG.blockExplorer}/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
                >
                  <span>{`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default Tokens; 