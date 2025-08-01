import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useWeb3 } from '../shared/lib/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, BSC_TESTNET } from '../shared/config/contracts';
import EarnVGWidget from '../widgets/StakingDashboard/ui/EarnVGWidget';
import VGConverter from '../entities/Token/ui/VGConverter';
import LPPoolManager from '../widgets/StakingDashboard/ui/LPPoolManager';
import TransactionHistory from '../entities/Transaction/ui/TransactionHistory';
import { ContractStatus } from '../shared/lib/ContractStatus';
import PageConnectionPrompt from '../shared/ui/PageConnectionPrompt';
import { 
  Rocket, 
  Gift, 
  Vote, 
  Lock,
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
  Loader2,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { log } from '../shared/lib/logger';
import { rpcService } from '../shared/api/rpcService';

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

const LPLocking: React.FC = () => {

  const { 
    account, 
    isConnected, 
    isCorrectNetwork
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
      log.debug('LPStaking: Skipping fetch - cached data is fresh', {
        component: 'LPStaking',
        function: 'fetchBalances',
        timeSinceLastFetch: now - lastFetchTime
      });
      return;
    }
    
    if (!account || !isConnected || !isCorrectNetwork) {
      log.debug('LPStaking: Skipping fetch', {
        component: 'LPStaking',
        function: 'fetchBalances',
        account: account ? 'connected' : 'not connected',
        isConnected,
        isCorrectNetwork
      });
      return;
    }
    
    log.info('LPStaking: Starting balance fetch for account', {
      component: 'LPStaking',
      function: 'fetchBalances',
      address: account
    });
    
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
        log.debug('LPStaking: Fetching BNB balance', {
          component: 'LPStaking',
          function: 'fetchBalances',
          address: account
        });
        
        const balance = await rpcService.withFallback(async (rpcProvider) => {
          return await rpcProvider.getBalance(account);
        });
        newBalances.BNB = ethers.formatEther(balance);
        log.info('LPStaking: BNB balance fetched', {
          component: 'LPStaking',
          function: 'fetchBalances',
          address: account,
          balance: newBalances.BNB
        });
      } catch (error: any) {
        log.error('LPStaking: Error fetching BNB balance', {
          component: 'LPStaking',
          function: 'fetchBalances',
          address: account
        }, error);
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
          log.debug('LPStaking: Fetching token balance', {
            component: 'LPStaking',
            function: 'fetchBalances',
            address: account,
            tokenSymbol: tokenInfo.symbol,
            tokenAddress: tokenInfo.address
          });
          
          const balance = await rpcService.withFallback(async (rpcProvider) => {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, rpcProvider);
            return await (contract as any).balanceOf(account);
          });

          const decimals = await rpcService.withFallback(async (rpcProvider) => {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, rpcProvider);
            return await (contract as any).decimals();
          });

          const formattedBalance = ethers.formatUnits(balance, decimals);
          newBalances[tokenInfo.symbol as keyof UserBalances] = formattedBalance;
          
          log.info('LPStaking: Token balance fetched', {
            component: 'LPStaking',
            function: 'fetchBalances',
            address: account,
            tokenSymbol: tokenInfo.symbol,
            balance: formattedBalance
          });
        } catch (error) {
          log.error('LPStaking: Error fetching token balance', {
            component: 'LPStaking',
            function: 'fetchBalances',
            address: account,
            tokenSymbol: tokenInfo.symbol,
            tokenAddress: tokenInfo.address
          }, error);
          newBalances[tokenInfo.symbol as keyof UserBalances] = '0';
        }
      }

      // Update state only if component is still mounted
      if (isMountedRef.current) {
        setBalances(newBalances);
        setLastFetchTime(now);
        
        log.info('LPStaking: Updated balances', {
          component: 'LPStaking',
          function: 'fetchBalances',
          address: account,
          balances: Object.keys(newBalances)
        });
        
        if (showRefreshToast) {
          toast.success('Данные обновлены!', { id: 'refresh-balances' });
        }
      }
    } catch (error) {
      log.error('LPStaking: Error fetching balances', {
        component: 'LPStaking',
        function: 'fetchBalances',
        address: account
      }, error as Error);
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
      log.info('LPStaking: Fetching LP Locker stats', {
        component: 'LPStaking',
        function: 'fetchLPLockerStats'
      });
      
      const stats = await rpcService.withFallback(async (rpcProvider) => {
        const lpLockerContract = new ethers.Contract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI, rpcProvider);
        
        const [poolInfo, totalUsers] = await Promise.all([
          (lpLockerContract as any).getPoolInfo(),
          (lpLockerContract as any).totalUsers().catch(() => 0n) // Fallback if function doesn't exist
        ]);
        
        // Используем статические значения конфигурации вместо дублированного config() вызова
        // чтобы избежать конфликта с EarnVGWidget
        const config = {
          lpToVgRatio: '10' // Статическое значение по умолчанию
        };
        
        return {
          poolInfo,
          config,
          totalUsers
        };
      });

      // Fetch active users from events (last 30 days)
      let activeUsersCount = '0';
      try {
        const currentBlock = await rpcService.withFallback(async (rpcProvider) => {
          return await rpcProvider.getBlockNumber();
        });
        
        const blocksPerDay = 28800; // ~28800 blocks per day on BSC (3 sec per block)
        const fromBlock = Math.max(0, currentBlock - (30 * blocksPerDay)); // 30 days ago
        
        const uniqueUsers = await rpcService.withFallback(async (rpcProvider) => {
          const lpLockerContract = new ethers.Contract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI, rpcProvider);
          
          const [vgEvents, lpEvents] = await Promise.all([
            lpLockerContract.queryFilter(
              lpLockerContract.filters.VGTokensEarned?.() || 'VGTokensEarned',
              fromBlock
            ).catch(() => []),
            lpLockerContract.queryFilter(
              lpLockerContract.filters.LPTokensLocked?.() || 'LPTokensLocked',
              fromBlock
            ).catch(() => [])
          ]);
          
          const users = new Set<string>();
          
          [...vgEvents, ...lpEvents].forEach((event: any) => {
            if (event.args?.user) {
              users.add(event.args.user.toLowerCase());
            }
          });
          
          return users.size;
        });
        
        activeUsersCount = uniqueUsers.toString();
      } catch (error) {
        log.warn('LPStaking: Error fetching active users', {
          component: 'LPStaking',
          function: 'fetchLPLockerStats'
        }, error as Error);
      }

      if (isMountedRef.current) {
        setLpLockerStats({
          totalLockedLp: ethers.formatEther(stats.poolInfo[0] || 0n),
          totalVgIssued: ethers.formatEther(stats.poolInfo[1] || 0n),
          totalVgDeposited: ethers.formatEther(stats.poolInfo[2] || 0n),
          availableVG: ethers.formatEther(stats.poolInfo[3] || 0n),
          lpToVgRatio: stats.config.lpToVgRatio?.toString() || '10',
          totalUsers: stats.totalUsers.toString(),
          activeUsers: activeUsersCount
        });
        
        log.info('LPStaking: LP Locker stats updated', {
          component: 'LPStaking',
          function: 'fetchLPLockerStats',
          stats: {
            totalLocked: stats.poolInfo[0] || 0n,
            totalIssued: stats.poolInfo[1] || 0n,
            activeUsers: activeUsersCount
          }
        });
      }
    } catch (error) {
      log.error('LPStaking: Error fetching LP locker stats', {
        component: 'LPStaking',
        function: 'fetchLPLockerStats'
      }, error as Error);
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
      <PageConnectionPrompt
        title={t('locking:title')}
        subtitle={t('locking:subtitle')}
        icon={Rocket}
        iconColor="text-green-400"
        titleGradient="from-green-400 to-blue-500"
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
      />
    );
  }

  if (!isCorrectNetwork) {
    return (
      <PageConnectionPrompt
        title={t('locking:title')}
        subtitle={t('locking:subtitle')}
        icon={Rocket}
        iconColor="text-green-400"
        titleGradient="from-green-400 to-blue-500"
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-6 md:space-y-8 px-4 md:px-8 lg:px-12">
      {/* Contract Status */}
      <ContractStatus />

      {/* Header */}
      <div className="text-center space-y-3 md:space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Rocket className="w-7 h-7 md:w-8 md:h-8 text-green-400" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            {t('locking:title')}
        </h1>
        </div>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
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
          className="btn-secondary p-2 tablet-button"
          title="Обновить данные"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Your Stats */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-slate-100">
          <BarChart3 className="mr-3 text-blue-400" />
          Ваша статистика
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card text-center tablet-compact animate-enhanced-card-chaos-1">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 rounded-xl bg-blue-500/20">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">{stat.title}</h3>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  <span className={stat.color}>{stat.value}</span>
                  <span className="text-gray-400 text-sm md:text-base ml-1">{stat.unit}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ecosystem Stats */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-slate-100">
          <TrendingUp className="mr-3 text-green-400" />
          Статистика экосистемы
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {ecosystemStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card text-center tablet-compact animate-enhanced-card-chaos-2">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 rounded-xl bg-green-500/20">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">{stat.title}</h3>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  <span className={stat.color}>{stat.value}</span>
                  <span className="text-gray-400 text-sm md:text-base ml-1">{stat.unit}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Earn VG Widget */}
      <div>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-slate-100">
            <Zap className="mr-3 text-yellow-400" />
            Получить VG токены
          </h2>
          <EarnVGWidget />
              </div>

        {/* VG Converter */}
                <div>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-slate-100">
            <Vote className="mr-3 text-purple-400" />
            Governance токены
        </h2>
          <VGConverter />
            </div>
          </div>

      {/* LP Pool Manager */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-slate-100">
          <Activity className="mr-3 text-green-400" />
          Управление ликвидностью
        </h2>
        <LPPoolManager />
      </div>

      {/* How it Works */}
      <div className="card tablet-compact animate-enhanced-widget-chaos-3">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-slate-100">
          <Info className="mr-3 text-blue-400" />
          Как это работает
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold mb-2 text-slate-100">1. Создайте LP</h3>
            <p className="text-gray-400 text-sm">
              Добавьте VC + BNB в пул ликвидности PancakeSwap или используйте готовые LP токены
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold mb-2 text-slate-100">2. Заблокируйте навсегда</h3>
            <p className="text-gray-400 text-sm">
              LP токены блокируются навсегда в контракте - это обеспечивает постоянную ликвидность
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold mb-2 text-slate-100">3. Получите VG</h3>
            <p className="text-gray-400 text-sm">
              Получите VG токены мгновенно (соотношение 10:1) для участия в управлении экосистемой
            </p>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="card tablet-compact animate-enhanced-widget-chaos-4">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-slate-100">
          <Shield className="mr-3 text-green-400" />
          Адреса контрактов
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
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