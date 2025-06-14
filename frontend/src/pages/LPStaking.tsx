import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../constants/contracts';
import EarnVGWidget from '../components/EarnVGWidget';
import VGConverter from '../components/VGConverter';
import LPPoolManager from '../components/LPPoolManager';
import TransactionHistory from '../components/TransactionHistory';
import { ContractStatus } from '../components/ContractStatus';
import { 
  Rocket, 
  Gift, 
  Vote, 
  Lock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Users,
  Shield,
  BarChart3,
  Coins,
  ExternalLink,
  RefreshCw,
  Zap,
  Target,
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

// Fallback RPC providers для надёжности
const FALLBACK_RPC_URLS = [
  'https://bsc-testnet-rpc.publicnode.com',
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://bsc-testnet.public.blastapi.io',
  'https://endpoints.omniatech.io/v1/bsc/testnet/public'
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

const LPLOCKER_ABI = [
  "function getPoolInfo() view returns (uint256, uint256, uint256, uint256)",
  "function config() view returns (address, address, address, address, address, address, uint256, uint256, uint256, uint256, uint16, uint16, bool, uint256, uint8, uint256, uint256, uint256)",
  "function totalUsers() view returns (uint256)",
  "function userInfo(address) view returns (uint256, uint256, uint256)",
  "event VGTokensEarned(address indexed user, uint256 vcAmount, uint256 bnbAmount, uint256 lpAmount, uint256 vgAmount, uint256 timestamp)",
  "event LPTokensLocked(address indexed user, uint256 lpAmount, uint256 vgAmount, uint256 timestamp)"
];

interface LPLockerStats {
  totalLockedLp: string;
  totalVgIssued: string;
  totalVgDeposited: string;
  availableVG: string;
  lpToVgRatio: string;
  totalUsers: string;
  activeUsers: string;
}

interface UserBalances {
  VC: string;
  VG: string;
  VGVotes: string;
  LP: string;
  BNB: string;
}

// Utility functions
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

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

const tryMultipleRpc = async <T,>(operation: (provider: ethers.JsonRpcProvider) => Promise<T>): Promise<T> => {
  let lastError: Error | null = null;
  
  for (const rpcUrl of FALLBACK_RPC_URLS) {
    try {
      console.log(`LPStaking: Trying RPC ${rpcUrl}...`);
      const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
      const result = await withTimeout(operation(rpcProvider), 15000);
      console.log(`LPStaking: RPC success with ${rpcUrl}`);
      return result;
    } catch (error: any) {
      console.warn(`LPStaking: RPC failed for ${rpcUrl}:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  throw lastError || new Error('All RPC endpoints failed');
};

const LPLocking: React.FC = () => {
  const { t } = useTranslation(['locking', 'common']);
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    provider,
    signer
  } = useWeb3();

  const [balances, setBalances] = useState<UserBalances>({
    VC: '0',
    VG: '0',
    VGVotes: '0',
    LP: '0',
    BNB: '0'
  });
  
  const [lpLockerStats, setLpLockerStats] = useState<LPLockerStats>({
    totalLockedLp: '0',
    totalVgIssued: '0',
    totalVgDeposited: '0',
    availableVG: '0',
    lpToVgRatio: '10',
    totalUsers: '0',
    activeUsers: '0'
  });
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchBalances = useCallback(async (showRefreshToast: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Cache check - не запрашиваем чаще чем раз в 10 секунд
    const now = Date.now();
    if (!showRefreshToast && now - lastFetchTime < 10000) {
      console.log('LPStaking: Skipping fetch - cached data is fresh');
      return;
    }
    
    if (!account || !isConnected || !isCorrectNetwork) {
      console.log('LPStaking: Skipping fetch', { account, isConnected, isCorrectNetwork });
      return;
    }
    
    console.log('LPStaking: Starting balance fetch for account:', account);
    
    if (showRefreshToast) {
      setRefreshing(true);
      toast.loading('Обновление данных...', { id: 'refresh-balances' });
    } else {
    setLoading(true);
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      const newBalances: UserBalances = {
        VC: '0',
        VG: '0',
        VGVotes: '0',
        LP: '0',
        BNB: '0'
      };

      // BNB balance
      try {
        console.log('LPStaking: Fetching BNB balance...');
        const balance = await tryMultipleRpc(async (rpcProvider) => {
          return await rpcProvider.getBalance(account);
        });
        newBalances.BNB = ethers.formatEther(balance);
        console.log('LPStaking: BNB balance fetched:', newBalances.BNB);
      } catch (error: any) {
        console.error('LPStaking: Error fetching BNB balance:', error.message);
        newBalances.BNB = '0';
      }

      // Token contracts info
      const tokenContracts = [
        { symbol: 'VC', address: CONTRACTS.VC_TOKEN },
        { symbol: 'VG', address: CONTRACTS.VG_TOKEN },
        { symbol: 'VGVotes', address: CONTRACTS.VG_TOKEN_VOTES },
        { symbol: 'LP', address: CONTRACTS.LP_TOKEN }
      ];

      // Fetch all token balances
      for (const tokenInfo of tokenContracts) {
        try {
          console.log(`LPStaking: Fetching ${tokenInfo.symbol} balance...`);
          
          const balance = await tryMultipleRpc(async (rpcProvider) => {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, rpcProvider);
            return await contract.balanceOf(account);
          });

          const decimals = await tryMultipleRpc(async (rpcProvider) => {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, rpcProvider);
            return await contract.decimals();
          });

          const formattedBalance = ethers.formatUnits(balance, decimals);
          newBalances[tokenInfo.symbol as keyof UserBalances] = formattedBalance;
          
          console.log(`LPStaking: ${tokenInfo.symbol} balance:`, formattedBalance);
        } catch (error) {
          console.error(`LPStaking: Error fetching ${tokenInfo.symbol} balance:`, error);
          newBalances[tokenInfo.symbol as keyof UserBalances] = '0';
        }
      }

      // Update state only if component is still mounted
      if (isMountedRef.current) {
        setBalances(newBalances);
        setLastFetchTime(now);
        
        console.log('LPStaking: Updated balances:', newBalances);
        
        if (showRefreshToast) {
          toast.success('Данные обновлены!', { id: 'refresh-balances' });
        }
      }
    } catch (error) {
      console.error('LPStaking: Error fetching balances:', error);
      const errorMessage = 'Ошибка загрузки балансов';
      
      if (showRefreshToast) {
        toast.error(errorMessage, { id: 'refresh-balances' });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
      setLoading(false);
        setRefreshing(false);
      }
    }
  }, [account, isConnected, isCorrectNetwork, lastFetchTime]);

  const fetchLPLockerStats = useCallback(async () => {
    if (!account || !isConnected || !isCorrectNetwork) return;

    try {
      console.log('LPStaking: Fetching LP Locker stats...');
      
      const stats = await tryMultipleRpc(async (rpcProvider) => {
        const lpLockerContract = new ethers.Contract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI, rpcProvider);
        
        const [poolInfo, config, totalUsers] = await Promise.all([
          lpLockerContract.getPoolInfo(),
          lpLockerContract.config(),
          lpLockerContract.totalUsers().catch(() => 0n) // Fallback if function doesn't exist
        ]);
        
        return {
          poolInfo,
          config,
          totalUsers
        };
      });

      // Fetch active users from events (last 30 days)
      let activeUsersCount = '0';
      try {
        const currentBlock = await tryMultipleRpc(async (rpcProvider) => {
          return await rpcProvider.getBlockNumber();
        });
        
        const blocksPerDay = 28800; // ~28800 blocks per day on BSC (3 sec per block)
        const fromBlock = Math.max(0, currentBlock - (30 * blocksPerDay)); // 30 days ago
        
        const uniqueUsers = await tryMultipleRpc(async (rpcProvider) => {
          const lpLockerContract = new ethers.Contract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI, rpcProvider);
          
          const [vgEvents, lpEvents] = await Promise.all([
            lpLockerContract.queryFilter(
              lpLockerContract.filters.VGTokensEarned(),
              fromBlock
            ).catch(() => []),
            lpLockerContract.queryFilter(
              lpLockerContract.filters.LPTokensLocked(),
              fromBlock
            ).catch(() => [])
          ]);
          
          const users = new Set<string>();
          
          [...vgEvents, ...lpEvents].forEach(event => {
        if (event.args?.user) {
              users.add(event.args.user.toLowerCase());
            }
          });
          
          return users.size;
        });
        
        activeUsersCount = uniqueUsers.toString();
      } catch (error) {
        console.warn('LPStaking: Error fetching active users:', error);
      }

      if (isMountedRef.current) {
        setLpLockerStats({
          totalLockedLp: ethers.formatEther(stats.poolInfo[0] || 0n),
          totalVgIssued: ethers.formatEther(stats.poolInfo[1] || 0n),
          totalVgDeposited: ethers.formatEther(stats.poolInfo[2] || 0n),
          availableVG: ethers.formatEther(stats.poolInfo[3] || 0n),
          lpToVgRatio: stats.config[7]?.toString() || '10',
          totalUsers: stats.totalUsers.toString(),
          activeUsers: activeUsersCount
        });
        
        console.log('LPStaking: LP Locker stats updated');
      }
    } catch (error) {
      console.error('LPStaking: Error fetching LP locker stats:', error);
      // Keep existing stats on error
    }
  }, [account, isConnected, isCorrectNetwork]);

  // Auto-fetch on mount and account change
  useEffect(() => {
    if (isConnected && isCorrectNetwork && account) {
      fetchBalances();
      fetchLPLockerStats();
    }
  }, [account, isConnected, isCorrectNetwork, fetchBalances, fetchLPLockerStats]);

  const refreshData = useCallback(() => {
    fetchBalances(true);
    fetchLPLockerStats();
  }, [fetchBalances, fetchLPLockerStats]);

  const formatBalance = useCallback((balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  }, []);

  const stats = [
    {
      title: 'Ваши VG токены',
      value: formatBalance(balances.VG),
      unit: 'VG',
      icon: Gift,
      color: 'text-yellow-400',
      description: 'Награды за блокировку LP'
    },
    {
      title: 'Voting Power',
      value: formatBalance(balances.VGVotes),
      unit: 'VGV',
      icon: Vote,
      color: 'text-purple-400',
      description: 'Сила голоса в DAO'
    },
    {
      title: 'LP токены',
      value: formatBalance(balances.LP),
      unit: 'LP',
      icon: Rocket,
      color: 'text-green-400',
      description: 'Доступно для блокировки'
    },
    {
      title: 'VC токены',
      value: formatBalance(balances.VC),
      unit: 'VC',
      icon: Coins,
      color: 'text-blue-400',
      description: 'Для создания LP'
    }
  ];

  const ecosystemStats = [
    {
      title: 'Всего заблокировано LP',
      value: formatBalance(lpLockerStats.totalLockedLp),
      unit: 'LP',
      icon: Lock,
      color: 'text-red-400',
      description: 'Навсегда заблокированные LP токены'
    },
    {
      title: 'VG токенов выдано',
      value: formatBalance(lpLockerStats.totalVgIssued),
      unit: 'VG',
      icon: Gift,
      color: 'text-yellow-400',
      description: 'Общие награды пользователям'
    },
    {
      title: 'Активных пользователей',
      value: lpLockerStats.activeUsers,
      unit: 'за 30 дней',
      icon: Users,
      color: 'text-green-400',
      description: 'Уникальные пользователи'
    },
    {
      title: 'Доступно VG наград',
      value: formatBalance(lpLockerStats.availableVG),
      unit: 'VG',
      icon: Target,
      color: 'text-blue-400',
      description: 'В vault для новых наград'
    }
  ];

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('locking:title')}
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('locking:subtitle')}
          </p>
          <div className="text-lg text-gray-300">
            {t('common:messages.connectWallet')}
          </div>
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
          <Rocket className="w-8 h-8 text-green-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            {t('locking:title')}
        </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {t('locking:subtitle')}
        </p>
        {refreshing && (
          <div className="flex items-center justify-center space-x-2 text-blue-400">
            <Loader2 className="animate-spin h-4 w-4" />
            <span className="text-sm">{t('common:labels.refreshing')}</span>
          </div>
        )}
        <button
          onClick={refreshData}
          disabled={loading || refreshing}
          className="btn-secondary p-2"
          title="Обновить данные"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Your Stats */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <BarChart3 className="mr-3 text-blue-400" />
          Ваши активы
        </h2>
        
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <div className="flex items-baseline space-x-2">
                    <div className="text-2xl font-bold text-slate-100">
                      {loading ? (
                        <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
                      ) : (
                        stat.value
                      )}
                    </div>
                    {stat.unit && (
                      <p className="text-sm text-gray-400">{stat.unit}</p>
                    )}
          </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
        </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
        </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ecosystem Stats */}
                <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Shield className="mr-3 text-purple-400" />
          Статистика экосистемы
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ecosystemStats.map((stat, index) => (
            <div key={index} className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <div className="flex items-baseline space-x-2">
                    <div className="text-2xl font-bold text-slate-100">
                      {loading ? (
                        <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
                      ) : (
                        stat.value
                      )}
                    </div>
                    {stat.unit && (
                      <p className="text-sm text-gray-400">{stat.unit}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
            </div>
          ))}
          </div>
        </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earn VG Widget */}
      <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
            <Zap className="mr-3 text-yellow-400" />
            Получить VG токены
          </h2>
          <EarnVGWidget />
              </div>

        {/* VG Converter */}
                <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
            <Vote className="mr-3 text-purple-400" />
            Governance токены
        </h2>
          <VGConverter />
            </div>
          </div>

      {/* LP Pool Manager */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Activity className="mr-3 text-green-400" />
          Управление ликвидностью
        </h2>
        <LPPoolManager />
      </div>

      {/* How it Works */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Info className="mr-3 text-blue-400" />
          Как это работает
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-100">1. Создайте LP</h3>
            <p className="text-gray-400 text-sm">
              Добавьте VC + BNB в пул ликвидности PancakeSwap или используйте готовые LP токены
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-100">2. Заблокируйте навсегда</h3>
            <p className="text-gray-400 text-sm">
              LP токены блокируются навсегда в контракте - это обеспечивает постоянную ликвидность
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-100">3. Получите VG</h3>
            <p className="text-gray-400 text-sm">
              Мгновенно получите VG токены как награду. Используйте их для governance или конвертируйте в VGVotes
            </p>
          </div>
        </div>
      </div>

      {/* Contract Information */}
          <div className="card">
        <h3 className="text-xl font-bold mb-4 text-slate-100">Информация о контрактах</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-slate-200">LP Locker</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.LP_LOCKER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.LP_LOCKER.slice(0, 6)}...${CONTRACTS.LP_LOCKER.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-slate-200">LP Token (VC/BNB)</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.LP_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.LP_TOKEN.slice(0, 6)}...${CONTRACTS.LP_TOKEN.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-slate-200">VG Token</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.VG_TOKEN.slice(0, 6)}...${CONTRACTS.VG_TOKEN.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-slate-200">VG Votes</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN_VOTES}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.VG_TOKEN_VOTES.slice(0, 6)}...${CONTRACTS.VG_TOKEN_VOTES.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default LPLocking; 