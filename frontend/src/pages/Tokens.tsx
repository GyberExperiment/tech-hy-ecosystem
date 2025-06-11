import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../constants/contracts';
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
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import TransactionHistory from '../components/TransactionHistory';

interface TokenData {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  totalSupply: string;
  contract: any;
  icon: React.ReactNode;
  color: string;
}

interface TokenAllowance {
  spender: string;
  spenderName: string;
  amount: string;
  token: string;
}

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
    provider 
  } = useWeb3();

  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [allowances, setAllowances] = useState<TokenAllowance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveTo, setApproveTo] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'transfer' | 'approve' | 'allowances'>('transfer');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'withBalance' | 'governance'>('all');

  const tokenCards = [
    {
      symbol: 'VC',
      name: TOKEN_INFO.VC.name,
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      balance: '0',
      address: CONTRACTS.VC_TOKEN,
      contract: vcContract,
    },
    {
      symbol: 'VG',
      name: TOKEN_INFO.VG.name,
      icon: <Gift className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      balance: '0',
      address: CONTRACTS.VG_TOKEN,
      contract: vgContract,
    },
    {
      symbol: 'VGV',
      name: TOKEN_INFO.VG_VOTES.name,
      icon: <Vote className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      balance: '0',
      address: CONTRACTS.VG_TOKEN_VOTES,
      contract: vgVotesContract,
    },
    {
      symbol: 'LP',
      name: TOKEN_INFO.LP.name,
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      balance: '0',
      address: CONTRACTS.LP_TOKEN,
      contract: lpContract,
    },
  ];

  const fetchTokenData = async () => {
    if (!account || !isCorrectNetwork) return;
    
    setLoading(true);
    try {
      const tokenData: TokenData[] = [];

      for (const tokenInfo of tokenCards) {
        if (!tokenInfo.contract) continue;

        try {
          const [balance, decimals, totalSupply] = await Promise.all([
            tokenInfo.contract.balanceOf(account),
            tokenInfo.contract.decimals(),
            tokenInfo.contract.totalSupply(),
          ]);

          tokenData.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            balance: ethers.formatUnits(balance, decimals),
            decimals: Number(decimals),
            totalSupply: ethers.formatUnits(totalSupply, decimals),
            contract: tokenInfo.contract,
            icon: tokenInfo.icon,
            color: tokenInfo.color,
          });
        } catch (error) {
          console.error(`Error fetching ${tokenInfo.symbol} data:`, error);
        }
      }

      setTokens(tokenData);
    } catch (error) {
      console.error('Error fetching token data:', error);
      toast.error('Ошибка загрузки данных токенов');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowances = async () => {
    if (!account || !isCorrectNetwork) return;
    
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
            const allowance = await token.contract.allowance(account, spender.address);
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
            console.error(`Error fetching allowance for ${token.symbol} -> ${spender.name}:`, error);
          }
        }
      }

      setAllowances(allowanceData);
    } catch (error) {
      console.error('Error fetching allowances:', error);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchTokenData();
    }
  }, [account, isConnected, isCorrectNetwork]);

  useEffect(() => {
    if (tokens.length > 0) {
      fetchAllowances();
    }
  }, [tokens]);

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

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Адрес скопирован!');
  };

  const handleTransfer = async () => {
    if (!selectedToken || !transferTo || !transferAmount) {
      toast.error('Заполните все поля');
      return;
    }

    if (!ethers.isAddress(transferTo)) {
      toast.error('Некорректный адрес');
      return;
    }

    try {
      const amount = ethers.parseUnits(transferAmount, selectedToken.decimals);
      
      toast.loading('Отправка транзакции...', { id: 'transfer' });
      
      const tx = await selectedToken.contract.transfer(transferTo, amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'transfer' });
      
      await tx.wait();
      
      toast.success('Перевод выполнен успешно!', { id: 'transfer' });
      
      // Обновляем балансы
      fetchTokenData();
      
      // Очищаем форму
      setTransferTo('');
      setTransferAmount('');
      
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(`Ошибка перевода: ${error.message}`, { id: 'transfer' });
    }
  };

  const handleApprove = async () => {
    if (!selectedToken || !approveTo || !approveAmount) {
      toast.error('Заполните все поля');
      return;
    }

    if (!ethers.isAddress(approveTo)) {
      toast.error('Некорректный адрес');
      return;
    }

    try {
      const amount = ethers.parseUnits(approveAmount, selectedToken.decimals);
      
      toast.loading('Отправка транзакции...', { id: 'approve' });
      
      const tx = await selectedToken.contract.approve(approveTo, amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'approve' });
      
      await tx.wait();
      
      toast.success('Approve выполнен успешно!', { id: 'approve' });
      
      // Обновляем allowances
      fetchAllowances();
      
      // Очищаем форму
      setApproveTo('');
      setApproveAmount('');
      
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(`Ошибка approve: ${error.message}`, { id: 'approve' });
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

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-responsive">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-responsive-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('common:messages.connectWallet')}
          </h2>
          <p className="text-responsive-base text-gray-400 mb-8">
            Подключите кошелек для управления токенами
          </p>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in px-responsive">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-responsive-xl font-bold mb-4 text-red-400">
            Неправильная сеть
          </h2>
          <p className="text-responsive-base text-gray-400 mb-8">
            {t('common:messages.wrongNetwork')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-responsive px-responsive">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Coins className="w-8 h-8 text-blue-400" />
          <h1 className="text-responsive-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('tokens:title')}
          </h1>
        </div>
        <p className="text-responsive-base text-gray-300 max-w-2xl mx-auto">
          {t('tokens:subtitle')}
        </p>
      </div>

      {/* Token Statistics */}
      <div>
        <h2 className="text-responsive-lg font-bold mb-6 flex items-center">
          <BarChart3 className="mr-3 text-blue-400" />
          Статистика токенов
        </h2>
        
        <div className="grid-responsive-1-2-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs text-gray-400">Всего токенов</p>
                <p className="text-responsive-lg font-bold text-white">{tokens.length}</p>
              </div>
              <Coins className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs text-gray-400">С балансом</p>
                <p className="text-responsive-lg font-bold text-white">
                  {tokens.filter(token => parseFloat(token.balance) > 0).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs text-gray-400">USD стоимость</p>
                <p className="text-responsive-lg font-bold text-white">$0.00</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs text-gray-400">Активных разрешений</p>
                <p className="text-responsive-lg font-bold text-white">{allowances.length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

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
              onClick={fetchTokenData}
              disabled={loading}
              className="btn-secondary p-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-responsive-lg font-bold flex items-center">
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
                        <h3 className="font-bold text-white text-responsive-base">{token.name}</h3>
                        <div className="flex items-center space-x-2">
                          <p className="text-responsive-xs text-gray-400">{token.symbol}</p>
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
                            href={`${BSC_TESTNET.blockExplorer}/token/${token.address}`}
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
                      <p className="font-bold text-white text-responsive-base">
                        {formatBalance(token.balance)}
                      </p>
                      <p className="text-responsive-xs text-gray-400">
                        {token.symbol}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-responsive-xs">
                      <div>
                        <p className="text-gray-400">Total Supply</p>
                        <p className="text-white font-medium">{formatBalance(token.totalSupply)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Decimals</p>
                        <p className="text-white font-medium">{token.decimals}</p>
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
          <h2 className="text-responsive-lg font-bold flex items-center">
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
                  <h3 className="font-bold text-white text-responsive-base">{selectedToken.name}</h3>
                  <p className="text-responsive-xs text-gray-400">{selectedToken.symbol}</p>
                  <p className="text-responsive-lg font-bold text-white mt-2">
                    {formatBalance(selectedToken.balance)} {selectedToken.symbol}
                  </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className={`flex-1 py-2 px-3 rounded-md text-responsive-xs font-medium transition-all ${
                      activeTab === 'transfer'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => setActiveTab('approve')}
                    className={`flex-1 py-2 px-3 rounded-md text-responsive-xs font-medium transition-all ${
                      activeTab === 'approve'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setActiveTab('allowances')}
                    className={`flex-1 py-2 px-3 rounded-md text-responsive-xs font-medium transition-all ${
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
                      <label className="block text-responsive-xs font-medium mb-2">
                        Адрес получателя
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="0x..."
                          className="input-field w-full address-display"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setTransferTo(CONTRACTS.LP_LOCKER)}
                            className="btn-secondary text-responsive-xs py-1 px-2"
                          >
                            LP Locker
                          </button>
                          <button
                            onClick={() => setTransferTo(CONTRACTS.VG_TOKEN_VOTES)}
                            className="btn-secondary text-responsive-xs py-1 px-2"
                          >
                            VG Votes
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-responsive-xs font-medium mb-2">
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
                          className="btn-secondary text-responsive-xs px-3"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleTransfer}
                      disabled={!transferTo || !transferAmount}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Отправить</span>
                    </button>
                  </div>
                )}

                {activeTab === 'approve' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-responsive-xs font-medium mb-2">
                        Spender адрес
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={approveTo}
                          onChange={(e) => setApproveTo(e.target.value)}
                          placeholder="0x..."
                          className="input-field w-full address-display"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setApproveTo(CONTRACTS.LP_LOCKER)}
                            className="btn-secondary text-responsive-xs py-1 px-2"
                          >
                            LP Locker
                          </button>
                          <button
                            onClick={() => setApproveTo(CONTRACTS.PANCAKE_ROUTER)}
                            className="btn-secondary text-responsive-xs py-1 px-2"
                          >
                            PancakeSwap
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-responsive-xs font-medium mb-2">
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
                          className="btn-secondary text-responsive-xs px-3"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleApprove}
                      disabled={!approveTo || !approveAmount}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                )}

                {activeTab === 'allowances' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Активные Allowances</h4>
                    {allowances.filter(allowance => allowance.token === selectedToken.symbol).length > 0 ? (
                      <div className="space-y-3">
                        {allowances
                          .filter(allowance => allowance.token === selectedToken.symbol)
                          .map((allowance, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-white text-responsive-xs">{allowance.spenderName}</p>
                                  <p className="text-gray-400 text-xs address-display">{allowance.spender}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-white text-responsive-xs">
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
              <h3 className="text-responsive-base font-bold mb-2">Выберите токен</h3>
              <p className="text-gray-400 text-responsive-xs">
                Выберите токен из списка для выполнения операций
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-responsive-lg font-bold mb-6 flex items-center">
          <Zap className="mr-3 text-yellow-400" />
          Быстрые действия
        </h2>
        
        <div className="grid-responsive-1-2-3">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-responsive-base font-bold mb-2">LP Locking</h3>
            <p className="text-gray-400 text-responsive-xs mb-4">Заблокируйте LP токены и получите VG</p>
            <a href="/staking" className="btn-primary inline-block">
              Перейти к LP Locking
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-responsive-base font-bold mb-2">Governance</h3>
            <p className="text-gray-400 text-responsive-xs mb-4">Участвуйте в голосовании и управлении</p>
            <a href="/governance" className="btn-primary inline-block">
              Перейти к Governance
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-responsive-base font-bold mb-2">Analytics</h3>
            <p className="text-gray-400 text-responsive-xs mb-4">Статистика и аналитика экосистемы</p>
            <a href="/" className="btn-primary inline-block">
              Перейти к Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      <div>
        <h2 className="text-responsive-lg font-bold mb-6 flex items-center">
          <Shield className="mr-3 text-blue-400" />
          Информация о контрактах
        </h2>
        
        <div className="card">
          <div className="grid-responsive-1-2 text-responsive-xs">
            {tokens.map((token) => (
              <div key={token.symbol} className="flex justify-between items-center p-3 rounded bg-white/5">
                <span className="font-medium">{token.name}</span>
                <a
                  href={`${BSC_TESTNET.blockExplorer}/token/${token.address}`}
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