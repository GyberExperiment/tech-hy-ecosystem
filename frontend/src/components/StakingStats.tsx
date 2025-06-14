import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { TrendingUp, Users, Clock, DollarSign, RefreshCw, Zap } from 'lucide-react';
import { CardSkeleton } from './LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import { CONTRACTS } from '../constants/contracts';

interface PoolData {
  totalLockedLP: string;
  totalVGIssued: string;
  totalVGDeposited: string;
  availableVG: string;
  userVCBalance: string;
  userBNBBalance: string;
  lpToVgRatio: string;
  lpDivisor: string;
}

const StakingStats: React.FC = () => {
  const { t } = useTranslation(['common']);
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    lpLockerContract, 
    vcContract,
    provider 
  } = useWeb3();

  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // Первая загрузка
  const [refreshing, setRefreshing] = useState(false); // Обновление данных
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Refs для cleanup и cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup function
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchPoolStats = useCallback(async (isRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Cache check - не запрашиваем чаще чем раз в 10 секунд
    const now = Date.now();
    if (!isRefresh && now - lastFetchTime < 10000) {
      console.log('StakingStats: Skipping fetch - cached data is fresh');
      return;
    }
    
    if (!account || !isConnected || !isCorrectNetwork) {
      console.log('StakingStats: Skipping fetch - not ready');
      return;
    }

    console.log('StakingStats: Starting pool stats fetch for account:', account);
    
    // Set loading states
    if (!poolData) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Create fallback provider with multiple RPC endpoints
      const fallbackRpcUrls = [
        'https://bsc-testnet-rpc.publicnode.com',
        'https://data-seed-prebsc-1-s1.binance.org:8545',
        'https://data-seed-prebsc-2-s1.binance.org:8545',
        'https://bsc-testnet.public.blastapi.io',
        'https://endpoints.omniatech.io/v1/bsc/testnet/public'
      ];
      
      const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrls[0]);
      const activeProvider = provider || fallbackProvider;

      // Helper function for timeout
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      // Helper function to try multiple RPC endpoints
      const tryMultipleRpc = async <T,>(operation: (provider: ethers.JsonRpcProvider) => Promise<T>): Promise<T> => {
        let lastError: Error | null = null;
        
        for (const rpcUrl of fallbackRpcUrls) {
          try {
            console.log(`StakingStats: Trying RPC ${rpcUrl}...`);
            const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
            const result = await withTimeout(operation(rpcProvider), 15000);
            console.log(`StakingStats: RPC success with ${rpcUrl}`);
            return result;
          } catch (error: any) {
            console.warn(`StakingStats: RPC failed for ${rpcUrl}:`, error.message);
            lastError = error;
            continue;
          }
        }
        
        throw lastError || new Error('All RPC endpoints failed');
      };

      // Contract ABIs
      const LPLOCKER_ABI = [
        "function getPoolInfo() view returns (uint256 totalLocked, uint256 totalIssued, uint256 totalDeposited, uint256 availableVG)",
        "function config() view returns (address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint16 maxSlippageBps, uint16 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited)"
      ];
      
      const ERC20_ABI = [
        "function balanceOf(address) view returns (uint256)"
      ];

      // Contract addresses
      const LP_LOCKER_ADDRESS = CONTRACTS.LP_LOCKER;
      const VC_TOKEN_ADDRESS = CONTRACTS.VC_TOKEN;

      // Fetch data with multiple RPC fallback
      let poolInfo = [0, 0, 0, 0];
      let config = { lpToVgRatio: 10, lpDivisor: 1000000 };
      let userVCBalance = '0';
      let userBNBBalance = '0';

      // Skip Web3Context contracts - use direct RPC calls for reliability
      console.log('StakingStats: Using direct RPC calls for reliability');
      
      try {
        // Pool info from LPLocker
        poolInfo = await tryMultipleRpc(async (rpcProvider) => {
          const lpLockerContract = new ethers.Contract(LP_LOCKER_ADDRESS, LPLOCKER_ABI, rpcProvider);
          return await (lpLockerContract.getPoolInfo as any)();
        });
        console.log('StakingStats: Pool info (direct RPC):', poolInfo);
      } catch (error: any) {
        console.warn('StakingStats: Pool info failed:', error.message);
      }

      try {
        // Config from LPLocker
        const configData = await tryMultipleRpc(async (rpcProvider) => {
          const lpLockerContract = new ethers.Contract(LP_LOCKER_ADDRESS, LPLOCKER_ABI, rpcProvider);
          return await (lpLockerContract.config as any)();
        });
        config = { 
          lpToVgRatio: configData[7]?.toString() || '10', // lpToVgRatio на позиции 7
          lpDivisor: configData[6]?.toString() || '1000000' // lpDivisor на позиции 6
        };
        console.log('StakingStats: Config (direct RPC):', config);
      } catch (error: any) {
        console.warn('StakingStats: Config failed:', error.message);
      }

      try {
        // VC balance
        const vcBalance = await tryMultipleRpc(async (rpcProvider) => {
          const vcContract = new ethers.Contract(VC_TOKEN_ADDRESS, ERC20_ABI, rpcProvider);
          return await (vcContract.balanceOf as any)(account);
        });
        userVCBalance = ethers.formatEther(vcBalance);
        console.log('StakingStats: VC balance (direct RPC):', userVCBalance);
      } catch (error: any) {
        console.warn('StakingStats: VC balance failed:', error.message);
      }

      try {
        // BNB balance
        const bnbBalance = await tryMultipleRpc(async (rpcProvider) => {
          return await rpcProvider.getBalance(account);
        });
        userBNBBalance = ethers.formatEther(bnbBalance);
        console.log('StakingStats: BNB balance (direct RPC):', userBNBBalance);
      } catch (error: any) {
        console.warn('StakingStats: BNB balance failed:', error.message);
      }

      const newPoolData = {
        totalLockedLP: ethers.formatEther(poolInfo[0] || 0),
        totalVGIssued: ethers.formatEther(poolInfo[1] || 0),
        totalVGDeposited: ethers.formatEther(poolInfo[2] || 0),
        availableVG: ethers.formatEther(poolInfo[3] || 0),
        userVCBalance,
        userBNBBalance,
        lpToVgRatio: config.lpToVgRatio?.toString() || '10',
        lpDivisor: config.lpDivisor?.toString() || '1000000',
      };

      // Update state only if component is still mounted
      if (isMountedRef.current && !signal.aborted) {
        setPoolData(newPoolData);
        setLastFetchTime(now);
        console.log('StakingStats: Pool data updated:', newPoolData);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('StakingStats: Fetch aborted');
        return;
      }
      console.error('StakingStats: Error fetching pool stats:', error);
      
      // Устанавливаем данные по умолчанию при ошибке только если нет данных
      if (isMountedRef.current && !poolData) {
      setPoolData({
        totalLockedLP: '0',
        totalVGIssued: '0',
        totalVGDeposited: '0',
        availableVG: '0',
        userVCBalance: '0',
        userBNBBalance: '0',
        lpToVgRatio: '10',
        lpDivisor: '1000000',
      });
      }
    } finally {
      if (isMountedRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
        setLastFetchTime(Date.now());
      }
    }
  }, [account, isConnected, isCorrectNetwork, lpLockerContract, vcContract, provider, poolData, lastFetchTime]);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchPoolStats(false); // Initial fetch
      
      // Обновляем каждые 60 секунд
      const interval = setInterval(() => {
        fetchPoolStats(true); // Refresh fetch
      }, 60000);
      
      return () => clearInterval(interval);
    } else {
      // Reset loading states when not connected
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [account, isConnected, isCorrectNetwork, fetchPoolStats]);

  const formatNumber = (value: string | number, decimals: number = 2) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(decimals);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  // Расчет потенциальных VG за пример вложения
  const calculatePotentialVG = (vcAmount: number, bnbAmount: number): number => {
    if (!poolData) return 0;
    const lpDivisor = parseFloat(poolData.lpDivisor);
    const lpToVgRatio = parseFloat(poolData.lpToVgRatio);
    const expectedLP = (vcAmount * bnbAmount) / lpDivisor;
    return expectedLP * lpToVgRatio;
  };

  if (!isConnected) {
    return (
      <div className="card text-center text-gray-400">
        <TrendingUp className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">Статистика экосистемы</h3>
        <p>Подключите кошелёк для просмотра статистики</p>
      </div>
    );
  }

  if (initialLoading && !poolData) {
    return <CardSkeleton />;
  }

  if (!poolData) {
    return (
      <div className="card text-center text-gray-400">
        <TrendingUp className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
        <button onClick={fetchPoolStats} className="btn-primary mt-4">
          Попробовать снова
        </button>
      </div>
    );
  }

  const stats = [
    {
      title: 'Заблокировано LP токенов',
      value: formatNumber(poolData.totalLockedLP),
      unit: 'LP',
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Выдано VG наград',
      value: formatNumber(poolData.totalVGIssued),
      unit: 'VG',
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      title: 'Доступно VG в хранилище',
      value: formatNumber(poolData.availableVG),
      unit: 'VG',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
    },
    {
      title: 'Соотношение LP → VG',
      value: poolData.lpToVgRatio,
      unit: 'x',
      icon: RefreshCw,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  // Примеры потенциальных наград
  const exampleRewards = [
    { vc: 100, bnb: 0.1, vg: calculatePotentialVG(100, 0.1) },
    { vc: 1000, bnb: 1, vg: calculatePotentialVG(1000, 1) },
    { vc: 10000, bnb: 10, vg: calculatePotentialVG(10000, 10) },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold flex items-center">
            <TrendingUp className="mr-3 text-blue-400" />
            Статистика LP → VG экосистемы
          </h3>
            {refreshing && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-sm">{t('common:labels.refreshing')}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => fetchPoolStats(true)}
            disabled={refreshing}
            className="btn-secondary p-2"
          >
            <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${stat.bgColor} transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`${stat.color}`} size={20} />
                <span className="text-xs text-gray-400">{stat.unit}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {/* User Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="text-blue-400" size={16} />
              <span className="text-sm text-gray-400">Ваш VC баланс</span>
            </div>
            <div className="text-xl font-bold">{formatNumber(poolData.userVCBalance)} VC</div>
            <div className="text-xs text-gray-500">доступно для обмена</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="text-green-400" size={16} />
              <span className="text-sm text-gray-400">Ваш BNB баланс</span>
            </div>
            <div className="text-xl font-bold">{formatNumber(poolData.userBNBBalance)} BNB</div>
            <div className="text-xs text-gray-500">доступно для обмена</div>
          </div>
        </div>

        {/* Potential Rewards Calculator */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="mr-2 text-yellow-400" size={18} />
            Калькулятор потенциальных VG наград
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleRewards.map((example, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-400 mb-2">
                  {example.vc} VC + {example.bnb} BNB
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  ≈ {formatNumber(example.vg)} VG
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  мгновенная награда
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-400 mb-2">
              Формула: LP = (VC × BNB) / {formatNumber(poolData.lpDivisor)}, VG = LP × {poolData.lpToVgRatio}
            </div>
            <a href="/staking" className="btn-primary">
              Начать зарабатывать VG
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="text-green-400" size={16} />
              <span className="text-sm text-gray-400">Статус системы</span>
            </div>
            <div className="text-lg font-bold text-green-400">
              {parseFloat(poolData.availableVG) > 0 ? 'Активна' : 'Недостаточно VG'}
            </div>
            <div className="text-xs text-gray-500">
              {parseFloat(poolData.availableVG) > 0 
                ? 'Готова к выдаче наград' 
                : 'Требуется пополнение хранилища'}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="text-blue-400" size={16} />
              <span className="text-sm text-gray-400">LP токены навсегда заблокированы</span>
            </div>
            <div className="text-lg font-bold text-blue-400">
              {formatNumber(poolData.totalLockedLP)}
            </div>
            <div className="text-xs text-gray-500">
              нет возможности вывода (by design)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingStats; 