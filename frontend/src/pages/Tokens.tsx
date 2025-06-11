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

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'withBalance' && parseFloat(token.balance) > 0) ||
                         (filterType === 'governance' && (token.symbol === 'VG' || token.symbol === 'VGV'));
    
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalTokensWithBalance = tokens.filter(token => parseFloat(token.balance) > 0).length;
  const totalValueUSD = tokens.reduce((sum, token) => {
    // Mock USD values - in production you'd fetch real prices
    const mockPrices: Record<string, number> = { VC: 0.1, VG: 0.05, VGV: 0.05, LP: 1.0 };
    return sum + (parseFloat(token.balance) * (mockPrices[token.symbol] || 0));
  }, 0);

  const stats = [
    {
      title: 'Всего токенов',
      value: tokens.length.toString(),
      unit: 'типов',
      icon: Coins,
      color: 'text-blue-400',
    },
    {
      title: 'С балансом',
      value: totalTokensWithBalance.toString(),
      unit: 'токенов',
      icon: Activity,
      color: 'text-green-400',
    },
    {
      title: 'Общая стоимость',
      value: totalValueUSD.toFixed(2),
      unit: 'USD',
      icon: TrendingUp,
      color: 'text-purple-400',
    },
    {
      title: 'Активных разрешений',
      value: allowances.length.toString(),
      unit: 'approve',
      icon: Shield,
      color: 'text-yellow-400',
    },
  ];

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
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {t('tokens:title')}
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {t('tokens:subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-white">
                    {loading ? 'Загрузка...' : stat.value}
                  </p>
                  {stat.unit && (
                    <p className="text-sm text-gray-400">{stat.unit}</p>
                  )}
                </div>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск токенов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-field pl-10 pr-8 appearance-none"
            >
              <option value="all">Все токены</option>
              <option value="withBalance">С балансом</option>
              <option value="governance">Governance</option>
            </select>
          </div>
        </div>
        <button
          onClick={fetchTokenData}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Coins className="mr-3 text-blue-400" />
            Ваши токены ({filteredTokens.length})
          </h2>

          <div className="space-y-4">
            {filteredTokens.map((token) => (
              <div 
                key={token.symbol} 
                className={`card cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedToken?.symbol === token.symbol 
                    ? 'ring-2 ring-blue-500/50 bg-blue-500/10' 
                    : ''
                }`}
                onClick={() => setSelectedToken(token)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-xl`}>
                      {token.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{token.symbol}</h3>
                      <p className="text-sm text-gray-400">{token.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 font-mono">
                          {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(token.address);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                        <a
                          href={`${BSC_TESTNET.blockExplorer}/token/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {loading ? '...' : formatBalance(token.balance)}
                    </p>
                    <p className="text-sm text-gray-400">{token.symbol}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total: {formatBalance(token.totalSupply)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operations Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Settings className="mr-3 text-green-400" />
            Операции с токенами
          </h2>

          {selectedToken ? (
            <div className="card">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedToken.color} flex items-center justify-center text-xl`}>
                  {selectedToken.icon}
                </div>
                <div>
                  <h3 className="font-bold text-xl">{selectedToken.symbol}</h3>
                  <p className="text-gray-400">{selectedToken.name}</p>
                  <p className="text-sm text-gray-500">
                    Баланс: {formatBalance(selectedToken.balance)} {selectedToken.symbol}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6">
                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'transfer'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Перевод
                </button>
                <button
                  onClick={() => setActiveTab('approve')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'approve'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => setActiveTab('allowances')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'allowances'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Разрешения
                </button>
              </div>

              {/* Transfer Tab */}
              {activeTab === 'transfer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Адрес получателя</label>
                    <input
                      type="text"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="0x..."
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Количество
                      <button
                        onClick={setMaxAmount}
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        (MAX)
                      </button>
                    </label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.0"
                      className="input-field w-full"
                      step="any"
                    />
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

              {/* Approve Tab */}
              {activeTab === 'approve' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Адрес spender</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={approveTo}
                        onChange={(e) => setApproveTo(e.target.value)}
                        placeholder="0x..."
                        className="input-field w-full"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setApproveTo(CONTRACTS.LP_LOCKER)}
                          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                        >
                          LP Locker
                        </button>
                        <button
                          onClick={() => setApproveTo(CONTRACTS.VG_TOKEN_VOTES)}
                          className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded"
                        >
                          VG Votes
                        </button>
                        <button
                          onClick={() => setApproveTo(CONTRACTS.PANCAKE_ROUTER)}
                          className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded"
                        >
                          PancakeSwap
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Количество
                      <button
                        onClick={setMaxAmount}
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        (MAX)
                      </button>
                    </label>
                    <input
                      type="number"
                      value={approveAmount}
                      onChange={(e) => setApproveAmount(e.target.value)}
                      placeholder="0.0"
                      className="input-field w-full"
                      step="any"
                    />
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

              {/* Allowances Tab */}
              {activeTab === 'allowances' && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">
                    Активные разрешения для {selectedToken.symbol}
                  </div>
                  {allowances.filter(a => a.token === selectedToken.symbol).length > 0 ? (
                    <div className="space-y-3">
                      {allowances
                        .filter(a => a.token === selectedToken.symbol)
                        .map((allowance, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{allowance.spenderName}</p>
                                <p className="text-xs text-gray-400 font-mono">
                                  {`${allowance.spender.slice(0, 6)}...${allowance.spender.slice(-4)}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatBalance(allowance.amount)}</p>
                                <p className="text-xs text-gray-400">{allowance.token}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Нет активных разрешений</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-xl font-bold mb-2">Выберите токен</h3>
              <p className="text-gray-400">
                Выберите токен из списка слева для выполнения операций
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Zap className="mr-3 text-yellow-400" />
          Быстрые действия
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2">LP Locking</h3>
            <p className="text-gray-400 mb-4">Заблокируйте LP токены и получите VG награды</p>
            <a href="/staking" className="btn-primary inline-block">
              Перейти к LP Locking
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2">Governance</h3>
            <p className="text-gray-400 mb-4">Участвуйте в управлении экосистемой</p>
            <a href="/governance" className="btn-primary inline-block">
              Перейти к Governance
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2">Analytics</h3>
            <p className="text-gray-400 mb-4">Просмотрите статистику и аналитику</p>
            <a href="/" className="btn-primary inline-block">
              Перейти к Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Token Allowances Overview */}
      {allowances.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Shield className="mr-3 text-yellow-400" />
            Обзор разрешений ({allowances.length})
          </h2>
          
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allowances.map((allowance, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg">{allowance.token}</p>
                      <p className="text-sm text-gray-400">{allowance.spenderName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatBalance(allowance.amount)}</p>
                      <p className="text-xs text-gray-400">разрешено</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-mono">
                      {`${allowance.spender.slice(0, 6)}...${allowance.spender.slice(-4)}`}
                    </span>
                    <a
                      href={`${BSC_TESTNET.blockExplorer}/address/${allowance.spender}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default Tokens; 