import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../shared/config/contracts';
import { getAllRpcEndpoints } from '../shared/config/rpcEndpoints';
import PageConnectionPrompt from '../shared/ui/PageConnectionPrompt';
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
import TransactionHistory from '../entities/Transaction/ui/TransactionHistory';
// import { ContractStatus } from '../shared/lib/ContractStatus';
import TokenStats from '../entities/Token/ui/TokenStats';
import { useTokenData } from '../entities/Token/model/useTokenData';
import type { TokenData } from '../entities/Token/model/useTokenData';
import { log } from '../shared/lib/logger';

interface TokenAllowance {
  spender: string;
  spenderName: string;
  amount: string;
  token: string;
}

// ✅ Use centralized RPC configuration  
const FALLBACK_RPC_URLS = getAllRpcEndpoints();

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

  const { address } = useAccount();
  const chainId = useChainId();

  // Use shared token data hook with proper error handling
  const { 
    tokens, 
    balances,
    loading, 
    refreshing, 
    refreshData, 
    formatBalance,
    isInitialized,
    hasAnyBalance
  } = useTokenData();

  // Diagnostic logging
  React.useEffect(() => {
    console.log('🔍 Tokens Page Debug:', {
      isConnected: !!address,
      tokensCount: tokens.length,
      balances,
      loading,
      isInitialized,
      hasAnyBalance
    });
  }, [address, tokens, balances, loading, isInitialized, hasAnyBalance]);

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
      case 'BNB': return <Coins className="w-6 h-6 text-yellow-400" />;
      default: return <Coins className="w-6 h-6" />;
    }
  }

  const fetchAllowances = async () => {
    if (!address || !chainId || tokens.length === 0) return;
    
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
              withRetry(() => token.contract.allowance(address, spender.address)),
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
              address: address
            }, error as Error);
          }
        }
      }

      setAllowances(allowanceData);
    } catch (error) {
      log.error('Failed to fetch all allowances', {
        component: 'Tokens',
        function: 'fetchAllowances',
        address: address
      }, error as Error);
    }
  };

  useEffect(() => {
    if (address && chainId) {
      fetchAllowances();
    }
  }, [address, chainId]);

  // Filter tokens based on search and filter criteria + добавляем BNB
  const filteredTokens = React.useMemo(() => {
    let allTokens = [...tokens];
    
    // Добавляем BNB как токен если есть баланс или показываем все
    if (balances.BNB && (parseFloat(balances.BNB) > 0 || filterType === 'all')) {
      allTokens.unshift({
        symbol: 'BNB',
        name: 'BNB Smart Chain',
        address: 'native',
        balance: balances.BNB,
        decimals: 18,
        totalSupply: '0', // BNB не имеет фиксированного supply
        contract: null,
        color: 'from-yellow-500 to-orange-500'
      });
    }
    
    return allTokens.filter(token => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      let matchesFilter = true;
      if (filterType === 'withBalance') {
        matchesFilter = parseFloat(token.balance) > 0;
      } else if (filterType === 'governance') {
        matchesFilter = token.symbol === 'VG' || token.symbol === 'VGVotes';
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [tokens, balances.BNB, searchTerm, filterType]);

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
    if (!selectedToken || !transferTo || !transferAmount || !address) {
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
      const contractWithSigner = selectedToken.contract.connect(ethers.provider.getSigner());
      
      // Проверяем баланс
      const balance = await selectedToken.contract.balanceOf(address);
      if (balance < amount) {
        throw new Error('Недостаточно токенов для перевода');
      }
      
      // Оцениваем gas
      const gasLimit = await estimateGas(contractWithSigner, 'transfer', [transferTo, amount]);
      
      toast.loading('Отправка транзакции...', { id: 'transfer' });
      
      const tx = await contractWithSigner.transfer(transferTo, amount, {
        gasLimit,
        // MEV protection: добавляем случайный nonce offset
        nonce: await ethers.provider.getTransactionCount(address) + Math.floor(Math.random() * 3)
      });
      
      toast.loading('Ожидание подтверждения...', { id: 'transfer' });
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        log.transaction('Token transfer successful', tx.hash, {
          token: selectedToken.symbol,
          amount: transferAmount,
          recipient: transferTo,
          sender: address
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
        sender: address,
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
    if (!selectedToken || !approveTo || !approveAmount || !address) {
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
      
      const contractWithSigner = selectedToken.contract.connect(ethers.provider.getSigner());
      
      // Оцениваем gas
      const gasLimit = await estimateGas(contractWithSigner, 'approve', [approveTo, amount]);
      
      toast.loading('Отправка транзакции...', { id: 'approve' });
      
      const tx = await contractWithSigner.approve(approveTo, amount, {
        gasLimit,
        // MEV protection
        nonce: await ethers.provider.getTransactionCount(address) + Math.floor(Math.random() * 3)
      });
      
      toast.loading('Ожидание подтверждения...', { id: 'approve' });
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        log.transaction('Token approval successful', tx.hash, {
          token: selectedToken.symbol,
          amount: approveAmount,
          spender: approveTo,
          owner: address
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
        owner: address,
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

  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    if (refreshing || loading) {
      console.log('⏳ Refresh already in progress, skipping');
      return;
    }
    
    try {
      await refreshData();
      console.log('✅ Refresh completed successfully');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      toast.error('Ошибка обновления данных');
    }
  }, [refreshData, refreshing, loading]);

  if (!address) {
    return (
      <PageConnectionPrompt
        title="Token Management"
        subtitle="Connect wallet to manage tokens"
        icon={Coins}
        iconColor="text-blue-400"
        titleGradient="from-blue-400 to-purple-500"
        isConnected={!!address}
        isCorrectNetwork={chainId === BSC_TESTNET.chainId}
      />
    );
  }

  if (chainId !== BSC_TESTNET.chainId) {
    return (
      <PageConnectionPrompt
        title="Token Management"
        subtitle="Connect wallet to manage tokens"
        icon={Coins}
        iconColor="text-blue-400"
        titleGradient="from-blue-400 to-purple-500"
        isConnected={!!address}
        isCorrectNetwork={chainId === BSC_TESTNET.chainId}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Contract Status - DISABLED FOR PRODUCTION */}
      {/* <div className="mb-8">
        <ContractStatus />
      </div> */}

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center space-x-3">
          <Coins className="w-8 h-8 text-blue-400" />
          <h1 className="hero-title text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Token Management
          </h1>
        </div>
        <p className="hero-subtitle text-xl text-gray-300 max-w-2xl mx-auto">
          Manage your TECH HY Ecosystem tokens
        </p>
      </div>

      {/* Token Statistics - Reusable Component */}
      <div className="mb-8">
        <TokenStats />
      </div>

      {/* Search and Filter */}
      <div className="liquid-glass animate-enhanced-widget-chaos-1 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or symbol..."
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
                <option value="all">All tokens</option>
                <option value="withBalance">With balance</option>
                <option value="governance">Governance tokens</option>
              </select>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="btn-glass-blue p-2"
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
          <h2 className="section-title text-2xl font-bold flex items-center text-slate-100">
            <Coins className="mr-3 text-blue-400" />
            Your Tokens ({filteredTokens.length})
          </h2>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="liquid-glass p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/6"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="liquid-glass text-center py-12">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-xl font-bold mb-2 text-slate-100">Токены не найдены</h3>
              <p className="text-gray-400 mb-4">
                {tokens.length === 0 
                  ? 'Подключите кошелек для загрузки ваших токенов' 
                  : 'Попробуйте изменить критерии фильтрации'
                }
              </p>
              {tokens.length === 0 && (
                <div className="flex flex-col items-center gap-3">
                  <button 
                    onClick={() => refreshData()}
                    className="btn-glass-blue flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Обновить
                  </button>
                  <p className="text-sm text-gray-500">
                    Убедитесь что подключены к правильной сети (BSC)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTokens.map((token, index) => (
                <div 
                  key={`${token.symbol}-${token.address}`} 
                  className={`liquid-glass p-6 cursor-pointer transition-all duration-300 hover:border-blue-400/30 group ${
                    selectedToken?.symbol === token.symbol ? 'border-blue-400/50 bg-blue-400/5' : ''
                  }`}
                  onClick={() => setSelectedToken(token)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${token.color || 'from-gray-500/20 to-gray-600/20'} shadow-lg flex-shrink-0`}>
                        {getTokenIcon(token.symbol)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {token.symbol}
                        </h3>
                        <p className="text-gray-400 text-sm truncate">{token.name}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {token.address === 'native' ? 'Native Token' : `${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                          </p>
                          {token.address !== 'native' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(token.address);
                              }}
                              className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3 text-gray-400 hover:text-gray-200" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-slate-100">
                        {formatBalance(token.balance)}
                      </p>
                      <p className="text-gray-400 text-sm">{token.symbol}</p>
                      {parseFloat(token.balance) > 0 && (
                        <div className="flex items-center mt-1 text-green-400 text-xs">
                          <Activity className="w-3 h-3 mr-1" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <h2 className="section-title text-2xl font-bold flex items-center text-slate-100">
            <Settings className="mr-3 text-purple-400" />
            Token Actions
          </h2>

          {selectedToken ? (
            <div className="liquid-glass animate-enhanced-widget-chaos-2">
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${selectedToken.color} flex items-center justify-center mx-auto mb-3 animate-pulse`}>
                    {selectedToken.icon}
                  </div>
                  <h3 className="font-bold text-slate-100 text-lg">{selectedToken.name}</h3>
                  <p className="text-sm text-gray-400">{selectedToken.symbol}</p>
                  <p className="text-xl font-bold text-slate-100 mt-2">
                    {formatBalance(selectedToken.balance)} {selectedToken.symbol}
                  </p>
                  {!selectedToken.contract && (
                    <div className="mt-2 text-xs text-yellow-400 glass-accent border border-yellow-400/20 rounded px-2 py-1">
                      Контракт недоступен
                    </div>
                  )}
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 glass-ultra rounded-lg p-1 animate-enhanced-widget-chaos-3">
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'transfer'
                        ? 'btn-glass-blue text-white animate-pulse'
                        : 'text-gray-400 hover:text-white glass-subtle'
                    }`}
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => setActiveTab('approve')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'approve'
                        ? 'btn-glass-blue text-white animate-pulse'
                        : 'text-gray-400 hover:text-white glass-subtle'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setActiveTab('allowances')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'allowances'
                        ? 'btn-glass-blue text-white animate-pulse'
                        : 'text-gray-400 hover:text-white glass-subtle'
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
                            className="btn-glass-green text-xs py-1 px-2"
                          >
                            LP Locker
                          </button>
                          <button
                            onClick={() => setTransferTo(CONTRACTS.VG_TOKEN_VOTES)}
                            className="btn-glass-purple text-xs py-1 px-2"
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
                          className="btn-glass-orange text-sm px-3"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleTransfer}
                      disabled={!transferTo || !transferAmount || !selectedToken.contract || transactionLoading}
                      className="btn-glass-morphic w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 animate-pulse"
                    >
                      {transactionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send</span>
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
                            className="btn-glass-green text-xs py-1 px-2"
                          >
                            LP Locker
                          </button>
                          <button
                            onClick={() => setApproveTo(CONTRACTS.PANCAKE_ROUTER)}
                            className="btn-glass-blue text-xs py-1 px-2"
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
                          className="btn-glass-orange text-xs px-3"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleApprove}
                      disabled={!approveTo || !approveAmount || !selectedToken.contract || transactionLoading}
                      className="btn-glass-morphic w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 animate-pulse"
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
                            <div key={index} className="glass-ultra rounded-lg p-3 animate-enhanced-widget-chaos-4">
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
                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
                        <p>Нет активных allowances</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="liquid-glass text-center py-12 animate-enhanced-widget-chaos-5">
              <div className="text-4xl mb-4 animate-pulse">⚡</div>
              <h3 className="text-xl font-bold mb-2 text-slate-100">Token Actions</h3>
              <p className="text-gray-400 mb-6">
                Выберите токен из списка для выполнения операций
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-400/20">
                  <Send className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-300 font-medium">Transfer</p>
                  <p className="text-xs text-gray-400">Отправка токенов</p>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-400/20">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-300 font-medium">Approve</p>
                  <p className="text-xs text-gray-400">Разрешения</p>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-400/20">
                  <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-purple-300 font-medium">Allowances</p>
                  <p className="text-xs text-gray-400">Управление</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="section-title text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Zap className="mr-3 text-yellow-400" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LP Locking */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/8 border border-green-400/20 rounded-2xl p-6 text-center hover:border-green-400/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 shadow-lg mx-auto mb-4 w-fit">
                <Rocket className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-100">LP Locking</h3>
              <p className="text-gray-300 mb-4 text-sm">Заблокируйте LP токены и получите VG</p>
              <a href="/staking" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Перейти к LP Locking
              </a>
            </div>
          </div>
          
          {/* Governance */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/8 border border-purple-400/20 rounded-2xl p-6 text-center hover:border-purple-400/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 shadow-lg mx-auto mb-4 w-fit">
                <Vote className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-100">Governance</h3>
              <p className="text-gray-300 mb-4 text-sm">Участвуйте в голосовании и управлении</p>
              <a href="/governance" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Перейти к Governance
              </a>
            </div>
          </div>
          
          {/* Analytics */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-blue-500/8 border border-blue-400/20 rounded-2xl p-6 text-center hover:border-blue-400/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 shadow-lg mx-auto mb-4 w-fit">
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-100">Analytics</h3>
              <p className="text-gray-300 mb-4 text-sm">Статистика и аналитика экосистемы</p>
              <a href="/" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Перейти к Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      <div className="mb-8">
        <h2 className="section-title text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Shield className="mr-3 text-blue-400" />
          Информация о контрактах
        </h2>
        
        <div className="liquid-glass animate-enhanced-widget-chaos-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {tokens.map((token) => (
              <div key={token.symbol} className="flex justify-between items-center p-3 rounded glass-ultra">
                <span className="font-medium text-slate-200">{token.name}</span>
                <a
                  href={`${BSC_TESTNET.blockExplorer}/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1 transition-colors duration-300"
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
      <div className="mb-8">
        <TransactionHistory />
      </div>
    </div>
  );
};

export default Tokens; 