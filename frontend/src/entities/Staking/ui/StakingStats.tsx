import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { ethers } from 'ethers';
import { TrendingUp, Users, Clock, DollarSign, Zap, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CONTRACTS } from '../../../shared/config/contracts';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';

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

const CardSkeleton = () => (
  <div className="card animate-pulse">
    <div className="h-6 bg-slate-700 rounded mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-8 bg-slate-700 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// CSS стили для обрезки текста
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Refs для cleanup и предотвращения множественных запросов
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fetchInProgressRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Основная функция загрузки данных
  const fetchPoolStats = useCallback(async (isRefresh = false) => {
    // Предотвращение множественных запросов
    if (fetchInProgressRef.current) {
      log.debug('Fetch already in progress, skipping', {
        component: 'StakingStats',
        function: 'fetchPoolStats',
        account,
        isRefresh
      });
      return;
    }
    
    // Проверка кэша - загружаем не чаще чем раз в 120 секунд
    const now = Date.now();
    if (!isRefresh && now - lastFetchTime < 120000) {
      log.debug('Skipping fetch - cached data is fresh', {
        component: 'StakingStats',
        function: 'fetchPoolStats',
        account,
        timeSinceLastFetch: now - lastFetchTime
      });
      return;
    }
    
    if (!account || !isConnected || !isCorrectNetwork) {
      log.debug('Skipping fetch - not ready', {
        component: 'StakingStats',
        function: 'fetchPoolStats',
        account,
        isConnected,
        isCorrectNetwork
      });
      // Сброс состояний при отключении
      if (!account || !isConnected) {
        setInitialLoading(false);
        setRefreshing(false);
        fetchInProgressRef.current = false;
      }
      return;
    }

    // Устанавливаем флаг загрузки
    fetchInProgressRef.current = true;

    log.info('Starting pool stats fetch', {
      component: 'StakingStats',
      function: 'fetchPoolStats',
      account,
      isRefresh
    });
    
    // Устанавливаем состояния загрузки
    if (!poolData) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    
    // Отменяем предыдущие запросы
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Создаем новый контроллер прерывания
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
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

      // Pool info from LPLocker
      const poolInfo = await rpcService.withFallback(async (rpcProvider) => {
        const lpLockerContract = new ethers.Contract(LP_LOCKER_ADDRESS, LPLOCKER_ABI, rpcProvider);
        return await (lpLockerContract.getPoolInfo as any)();
      });
      
      log.info('Pool info retrieved', {
        component: 'StakingStats',
        function: 'fetchPoolStats',
        totalLocked: ethers.formatEther(poolInfo[0] || 0),
        totalIssued: ethers.formatEther(poolInfo[1] || 0),
        availableVG: ethers.formatEther(poolInfo[3] || 0)
      });

      // Статические значения конфигурации
      const config = {
        lpToVgRatio: 10,
        lpDivisor: '1000000000000000000000' // 1e21
      };

      // VC balance
      const userVCBalance = await rpcService.withFallback(async (rpcProvider) => {
        const vcContract = new ethers.Contract(VC_TOKEN_ADDRESS, ERC20_ABI, rpcProvider);
        const vcBalance = await (vcContract.balanceOf as any)(account);
        return ethers.formatEther(vcBalance);
      });

      // BNB balance
      const userBNBBalance = await rpcService.withFallback(async (rpcProvider) => {
        const bnbBalance = await rpcProvider.getBalance(account);
        return ethers.formatEther(bnbBalance);
      });

      log.info('Balances retrieved', {
        component: 'StakingStats',
        function: 'fetchPoolStats',
        userVCBalance,
        userBNBBalance
      });

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

      // Обновляем состояние только если компонент еще mounted
      if (isMountedRef.current && !signal.aborted) {
        setPoolData(newPoolData);
        setLastFetchTime(now);
        log.info('Pool data updated successfully', {
          component: 'StakingStats',
          function: 'fetchPoolStats',
          newPoolData
        });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        log.debug('Pool stats fetch aborted', {
          component: 'StakingStats',
          function: 'fetchPoolStats',
          account
        });
        return;
      }
      log.error('Failed to fetch pool stats', {
        component: 'StakingStats',
        function: 'fetchPoolStats',
        account
      }, error);
      
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
      // Сбрасываем флаг загрузки
      fetchInProgressRef.current = false;
    }
  }, [account, isConnected, isCorrectNetwork, lpLockerContract, vcContract, provider, poolData]);

  // Effect для автоматической загрузки данных
  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      // Initial fetch с небольшой задержкой
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current && !fetchInProgressRef.current) {
          fetchPoolStats(false);
        }
      }, 500);
      
      // Регулярное обновление каждые 120 секунд
      const interval = setInterval(() => {
        if (isMountedRef.current && !fetchInProgressRef.current) {
          fetchPoolStats(true);
        }
      }, 120000);
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    } else {
      // Сброс состояний при отключении
      setInitialLoading(false);
      setRefreshing(false);
      fetchInProgressRef.current = false;
    }
  }, [account, isConnected, isCorrectNetwork, fetchPoolStats]);

  // Функция форматирования чисел
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

  // Простая функция refresh с debouncing
  const handleRefresh = () => {
    if (!refreshing && !fetchInProgressRef.current) {
      fetchPoolStats(true);
    }
  };

  if (!isConnected) {
    return (
      <div className="card text-center text-gray-400">
        <TrendingUp className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2 text-slate-100">Статистика экосистемы</h3>
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
        <h3 className="text-lg font-semibold mb-2 text-slate-100">Ошибка загрузки</h3>
        <button onClick={() => fetchPoolStats(true)} className="btn-primary mt-4">
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
      <style>{lineClampStyles}</style>
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold flex items-center text-slate-100">
            <TrendingUp className="mr-3 text-blue-400" />
            Статистика экосистемы
          </h3>
            {refreshing && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-sm">{t('common:labels.refreshing')}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || fetchInProgressRef.current}
            className="btn-secondary p-2 disabled:opacity-50"
          >
            <RefreshCw className={`${(refreshing || fetchInProgressRef.current) ? 'animate-spin' : ''}`} size={16} />
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            // Определяем цветовую схему для каждой карточки
            const colorSchemes = {
              0: { // LP токены
                gradient: 'from-blue-500/20 via-cyan-500/10 to-blue-500/20',
                bg: 'from-blue-500/10 via-cyan-500/5 to-blue-500/8',
                border: 'border-blue-400/20 hover:border-blue-400/40',
                iconBg: 'from-blue-500/20 to-cyan-600/20',
                iconColor: 'text-blue-400',
                badge: 'text-blue-300/80 bg-blue-500/10'
              },
              1: { // VG награды
                gradient: 'from-yellow-500/20 via-orange-500/10 to-yellow-500/20',
                bg: 'from-yellow-500/10 via-orange-500/5 to-yellow-500/8',
                border: 'border-yellow-400/20 hover:border-yellow-400/40',
                iconBg: 'from-yellow-500/20 to-orange-600/20',
                iconColor: 'text-yellow-400',
                badge: 'text-yellow-300/80 bg-yellow-500/10'
              },
              2: { // Доступно VG
                gradient: 'from-green-500/20 via-emerald-500/10 to-green-500/20',
                bg: 'from-green-500/10 via-emerald-500/5 to-green-500/8',
                border: 'border-green-400/20 hover:border-green-400/40',
                iconBg: 'from-green-500/20 to-emerald-600/20',
                iconColor: 'text-green-400',
                badge: 'text-green-300/80 bg-green-500/10'
              },
              3: { // Соотношение
                gradient: 'from-purple-500/20 via-pink-500/10 to-purple-500/20',
                bg: 'from-purple-500/10 via-pink-500/5 to-purple-500/8',
                border: 'border-purple-400/20 hover:border-purple-400/40',
                iconBg: 'from-purple-500/20 to-pink-600/20',
                iconColor: 'text-purple-400',
                badge: 'text-purple-300/80 bg-purple-500/10'
              }
            };

            const scheme = colorSchemes[index as keyof typeof colorSchemes];

            return (
            <div 
              key={index} 
                className="relative group aspect-square"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${scheme.gradient} rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300`}></div>
                <div className={`relative h-full backdrop-blur-xl bg-gradient-to-br ${scheme.bg} border ${scheme.border} rounded-2xl p-4 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1 flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${scheme.iconBg} shadow-lg`}>
                      <stat.icon className={`w-4 h-4 ${scheme.iconColor}`} />
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${scheme.badge}`}>
                      {stat.unit}
                    </div>
              </div>
                  
                  <div className="flex-1 flex flex-col justify-center text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-gray-200/80 leading-tight line-clamp-2">
                {stat.title}
                    </h3>
                    <div className={`text-xs ${scheme.iconColor}/70 leading-tight line-clamp-1`}>
                      {index === 0 && 'Навсегда заблокировано'}
                      {index === 1 && 'Выдано пользователям'}
                      {index === 2 && parseFloat(poolData.availableVG) > 1000 ? 'Высокая доступность' : 'Ограниченная'}
                      {index === 3 && 'Мгновенный обмен'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* VC баланс */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-blue-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/8 border border-blue-400/20 rounded-2xl p-6 hover:border-blue-400/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 shadow-lg">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-xs font-medium text-blue-300/80 bg-blue-500/10 px-2 py-1 rounded-full">
                  VC
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-blue-200/80">Ваш VC баланс</h3>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(poolData.userVCBalance)}
                </div>
                <div className="text-sm text-blue-400/70">
                  доступно для обмена
                </div>
              </div>
            </div>
          </div>

          {/* BNB баланс */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/10 to-yellow-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-yellow-500/8 border border-yellow-400/20 rounded-2xl p-6 hover:border-yellow-400/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 shadow-lg">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-xs font-medium text-yellow-300/80 bg-yellow-500/10 px-2 py-1 rounded-full">
                  BNB
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-yellow-200/80">Ваш BNB баланс</h3>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(poolData.userBNBBalance)}
                </div>
                <div className="text-sm text-yellow-400/70">
                  доступно для обмена
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Potential Rewards Calculator */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-blue-500/8 to-purple-500/15 rounded-3xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-cyan-500/8 via-blue-500/5 to-purple-500/8 border border-cyan-400/20 rounded-3xl p-8 hover:border-cyan-400/30 transition-all duration-300">
            <h4 className="text-xl font-bold mb-6 flex items-center text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 shadow-lg mr-3">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
            Калькулятор потенциальных VG наград
          </h4>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {exampleRewards.map((example, index) => (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/10 to-emerald-500/20 rounded-2xl blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-500/8 border border-emerald-400/20 rounded-2xl p-6 text-center hover:border-emerald-400/40 transition-all duration-300 group-hover:scale-105">
                    <div className="text-sm text-emerald-200/80 mb-3">
                  {example.vc} VC + {example.bnb} BNB
                </div>
                    <div className="text-2xl font-bold text-yellow-400 mb-2">
                  ≈ {formatNumber(example.vg)} VG
                </div>
                    <div className="text-xs text-emerald-400/70">
                  мгновенная награда
                    </div>
                </div>
              </div>
            ))}
          </div>
          
            <div className="mt-8 text-center">
              <div className="text-sm text-cyan-200/80 mb-4 p-4 backdrop-blur-xl bg-slate-800/30 rounded-xl border border-slate-600/30">
              Формула: LP = (VC × BNB) / {formatNumber(poolData.lpDivisor)}, VG = LP × {poolData.lpToVgRatio}
            </div>
              <a 
                href="/staking" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Zap className="w-4 h-4 mr-2" />
              Earn VG
            </a>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Статус системы */}
          <div className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${parseFloat(poolData.availableVG) > 0 ? 'from-green-500/20 via-emerald-500/10 to-green-500/20' : 'from-red-500/20 via-orange-500/10 to-red-500/20'} rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300`}></div>
            <div className={`relative backdrop-blur-xl bg-gradient-to-br ${parseFloat(poolData.availableVG) > 0 ? 'from-green-500/10 via-emerald-500/5 to-green-500/8 border-green-400/20 hover:border-green-400/40' : 'from-red-500/10 via-orange-500/5 to-red-500/8 border-red-400/20 hover:border-red-400/40'} border rounded-2xl p-6 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${parseFloat(poolData.availableVG) > 0 ? 'from-green-500/20 to-emerald-600/20' : 'from-red-500/20 to-orange-600/20'} shadow-lg`}>
                  <Clock className={`w-5 h-5 ${parseFloat(poolData.availableVG) > 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${parseFloat(poolData.availableVG) > 0 ? 'text-green-300/80 bg-green-500/10' : 'text-red-300/80 bg-red-500/10'}`}>
                  {parseFloat(poolData.availableVG) > 0 ? 'Active' : 'Limited'}
                </div>
            </div>
              
              <div className="space-y-2">
                <h3 className={`text-sm font-medium ${parseFloat(poolData.availableVG) > 0 ? 'text-green-200/80' : 'text-red-200/80'}`}>Статус системы</h3>
                <div className={`text-2xl font-bold ${parseFloat(poolData.availableVG) > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(poolData.availableVG) > 0 ? 'Активна' : 'Недостаточно VG'}
            </div>
                <div className={`text-sm ${parseFloat(poolData.availableVG) > 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {parseFloat(poolData.availableVG) > 0 
                ? 'Готова к выдаче наград' 
                : 'Требуется пополнение хранилища'}
            </div>
          </div>
            </div>
          </div>

          {/* LP токены навсегда заблокированы */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-indigo-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-indigo-500/8 border border-indigo-400/20 rounded-2xl p-6 hover:border-indigo-400/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 shadow-lg">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-xs font-medium text-indigo-300/80 bg-indigo-500/10 px-2 py-1 rounded-full">
                  Total
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-indigo-200/80">LP токены навсегда заблокированы</h3>
                <div className="text-2xl font-bold text-white">
              {formatNumber(poolData.totalLockedLP)}
            </div>
                <div className="text-sm text-indigo-400/70">
                  Участие в экосистеме
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingStats; 