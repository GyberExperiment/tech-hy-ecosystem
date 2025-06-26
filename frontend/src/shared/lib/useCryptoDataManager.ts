/**
 * 🚀 Centralized Crypto Data Manager
 * 
 * Объединяет и расширяет useTokenData + usePoolInfo + дополнительные данные
 * Устраняет дублирование между виджетами и оптимизирует RPC запросы
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ethers } from 'ethers';
import { useTokenData } from '../../entities/Token/model/useTokenData';
import { usePoolInfo } from '../../entities/Staking/model/usePoolInfo';
import { useWeb3 } from './Web3Context';
import { CONTRACTS } from '../config/contracts';
import { rpcService } from '../api/rpcService';
import { log } from './logger';

export interface ExtendedPoolData {
  // Из usePoolInfo
  vcReserve: string;
  bnbReserve: string;
  price: string;
  isLoaded: boolean;
  
  // ✅ Реальные данные для StakingStats (из LP_LOCKER контракта)
  totalLockedLP: string;
  totalVGIssued: string;
  totalVGDeposited: string;
  availableVG: string;
  lpToVgRatio: string;
  lpDivisor: string;
  
  // Мета-данные
  lastUpdated: number;
  error: string | null;
}

export interface CryptoDataManagerReturn {
  // Token data (из useTokenData)
  balances: {
    VC: string;
    VG: string;
    VGVotes: string;
    LP: string;
    BNB: string;
  };
  tokens: any[];
  tokensLoading: boolean;
  tokensRefreshing: boolean;
  
  // Pool data (расширенный usePoolInfo + StakingStats)
  poolData: ExtendedPoolData;
  poolLoading: boolean;
  stakingStatsLoading: boolean;
  
  // Unified actions
  refreshAll: () => void;
  refreshTokens: () => void;
  refreshPool: () => void;
  refreshStakingStats: () => void;
  
  // Utility functions
  formatBalance: (balance: string) => string;
  
  // Contract safety checks
  contractsReady: {
    vcContract: boolean;
    vgContract: boolean;
    lpLockerContract: boolean;
    lpContract: boolean;
  };
  
  // Computed values
  hasAnyBalance: boolean;
  isSystemReady: boolean;
}

// ✅ Contract ABIs для загрузки pool данных
const LPLOCKER_ABI = [
  "function getPoolInfo() view returns (uint256 totalLocked, uint256 totalIssued, uint256 totalDeposited, uint256 availableVG)",
  "function config() view returns (address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint16 maxSlippageBps, uint16 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited)"
];

// ✅ Global cache для staking stats
const stakingStatsCache = new Map<string, { data: any; timestamp: number }>();
const STAKING_STATS_CACHE_DURATION = 120000; // 2 minutes

/**
 * Централизованный хук для всех crypto данных
 * Объединяет useTokenData, usePoolInfo и дополнительную логику
 */
export const useCryptoDataManager = (): CryptoDataManagerReturn => {
  // Используем существующие хуки
  const {
    balances,
    tokens,
    loading: tokensLoading,
    refreshing: tokensRefreshing,
    refreshData: refreshTokens,
    formatBalance,
    hasAnyBalance,
    triggerGlobalRefresh
  } = useTokenData();
  
  const {
    poolInfo,
    loading: poolLoading,
    error: poolError,
    refreshPoolInfo: refreshPool,
    lastUpdated
  } = usePoolInfo();
  
  const {
    account,
    isConnected,
    isCorrectNetwork,
    vcContract,
    vgContract,
    lpLockerContract,
    lpContract
  } = useWeb3();

  // ✅ State для реальных staking stats данных
  const [stakingStats, setStakingStats] = useState({
    totalLockedLP: '0',
    totalVGIssued: '0',
    totalVGDeposited: '0',
    availableVG: '0',
    lpToVgRatio: '10',
    lpDivisor: '1000000000000000000000'
  });
  const [stakingStatsLoading, setStakingStatsLoading] = useState(false);
  const [stakingStatsError, setStakingStatsError] = useState<string | null>(null);
  
  // Refs для управления загрузкой
  const stakingStatsFetchInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Contract safety checks
  const contractsReady = useMemo(() => ({
    vcContract: !!vcContract,
    vgContract: !!vgContract,
    lpLockerContract: !!lpLockerContract,
    lpContract: !!lpContract
  }), [vcContract, vgContract, lpLockerContract, lpContract]);

  // ✅ Функция загрузки реальных staking статистики
  const loadStakingStats = useCallback(async (forceRefresh = false): Promise<void> => {
    if (stakingStatsFetchInProgress.current) {
      log.debug('Staking stats fetch already in progress, skipping', {
        component: 'useCryptoDataManager',
        function: 'loadStakingStats'
      });
      return;
    }

    if (!account || !isConnected || !isCorrectNetwork) {
      log.debug('Skipping staking stats fetch - not ready', {
        component: 'useCryptoDataManager',
        function: 'loadStakingStats',
        account: !!account,
        isConnected,
        isCorrectNetwork
      });
      return;
    }

    // Check cache
    const cacheKey = `staking-stats-${account}`;
    const cached = stakingStatsCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < STAKING_STATS_CACHE_DURATION) {
      log.debug('Using cached staking stats', {
        component: 'useCryptoDataManager',
        function: 'loadStakingStats',
        timeSinceLastFetch: Date.now() - cached.timestamp
      });
      setStakingStats(cached.data);
      return;
    }

    stakingStatsFetchInProgress.current = true;
    setStakingStatsLoading(true);
    setStakingStatsError(null);

    log.info('Loading staking stats from LP_LOCKER contract', {
      component: 'useCryptoDataManager',
      function: 'loadStakingStats',
      account
    });

    try {
      // ✅ Загружаем pool info from LPLocker контракта
      const poolInfo = await rpcService.withFallback(async (rpcProvider) => {
        const lpLockerContract = new ethers.Contract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI, rpcProvider);
        return await (lpLockerContract as any).getPoolInfo();
      });

      log.info('Pool info retrieved from LPLocker', {
        component: 'useCryptoDataManager',
        function: 'loadStakingStats',
        totalLocked: ethers.formatEther(poolInfo[0] || 0),
        totalIssued: ethers.formatEther(poolInfo[1] || 0),
        totalDeposited: ethers.formatEther(poolInfo[2] || 0),
        availableVG: ethers.formatEther(poolInfo[3] || 0)
      });

      // ✅ Статические значения конфигурации (как в StakingStats)
      const config = {
        lpToVgRatio: 10,
        lpDivisor: '1000000000000000000000' // 1e21
      };

      const newStakingStats = {
        totalLockedLP: ethers.formatEther(poolInfo[0] || 0),
        totalVGIssued: ethers.formatEther(poolInfo[1] || 0),
        totalVGDeposited: ethers.formatEther(poolInfo[2] || 0),
        availableVG: ethers.formatEther(poolInfo[3] || 0),
        lpToVgRatio: config.lpToVgRatio.toString(),
        lpDivisor: config.lpDivisor
      };

      if (mountedRef.current) {
        setStakingStats(newStakingStats);
        const timestamp = Date.now();
        
        // Cache the result
        stakingStatsCache.set(cacheKey, { data: newStakingStats, timestamp });
        
        log.info('Staking stats updated successfully', {
          component: 'useCryptoDataManager',
          function: 'loadStakingStats',
          newStakingStats
        });
      }

    } catch (error: any) {
      log.error('Failed to load staking stats', {
        component: 'useCryptoDataManager',
        function: 'loadStakingStats',
        account
      }, error);
      
      if (mountedRef.current) {
        setStakingStatsError(error.message || 'Failed to load staking stats');
        
        // ✅ Используем fallback значения при ошибке
        const fallbackStats = {
          totalLockedLP: '0',
          totalVGIssued: '0',
          totalVGDeposited: '0',
          availableVG: '0',
          lpToVgRatio: '10',
          lpDivisor: '1000000000000000000000'
        };
        
        setStakingStats(fallbackStats);
      }
    } finally {
      if (mountedRef.current) {
        setStakingStatsLoading(false);
      }
      stakingStatsFetchInProgress.current = false;
    }
  }, [account, isConnected, isCorrectNetwork]);

  // ✅ Auto-load staking stats when wallet connects
  useEffect(() => {
    if (isConnected && isCorrectNetwork && account) {
      // Initial load with delay
      const timeoutId = setTimeout(() => {
        if (mountedRef.current && !stakingStatsFetchInProgress.current) {
          loadStakingStats(false);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [account, isConnected, isCorrectNetwork, loadStakingStats]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Extended pool data с реальными данными
  const poolData = useMemo((): ExtendedPoolData => {
    return {
      // Базовые данные из usePoolInfo
      vcReserve: poolInfo.vcReserve,
      bnbReserve: poolInfo.bnbReserve,
      price: poolInfo.price,
      isLoaded: poolInfo.isLoaded,
      
      // ✅ Реальные данные из LP_LOCKER контракта
      totalLockedLP: stakingStats.totalLockedLP,
      totalVGIssued: stakingStats.totalVGIssued,
      totalVGDeposited: stakingStats.totalVGDeposited,
      availableVG: stakingStats.availableVG,
      lpToVgRatio: stakingStats.lpToVgRatio,
      lpDivisor: stakingStats.lpDivisor,
      
      // Мета-данные
      lastUpdated,
      error: poolError || stakingStatsError
    };
  }, [poolInfo, stakingStats, lastUpdated, poolError, stakingStatsError]);

  // System readiness check
  const isSystemReady = useMemo(() => {
    return isConnected && 
           isCorrectNetwork && 
           !!account && 
           contractsReady.vcContract && 
           contractsReady.lpLockerContract;
  }, [isConnected, isCorrectNetwork, account, contractsReady]);

  // ✅ Refresh function для staking stats
  const refreshStakingStats = useCallback(() => {
    loadStakingStats(true);
  }, [loadStakingStats]);

  // Unified refresh function
  const refreshAll = useCallback(() => {
    log.info('CryptoDataManager: Triggering global refresh', {
      component: 'useCryptoDataManager',
      account
    });
    
    // Запускаем обновление токенов
    refreshTokens();
    
    // Запускаем обновление pool данных
    refreshPool();
    
    // ✅ Запускаем обновление staking stats
    refreshStakingStats();
    
    // Триггерим глобальное обновление для других компонентов
    triggerGlobalRefresh();
  }, [refreshTokens, refreshPool, refreshStakingStats, triggerGlobalRefresh, account]);

  return {
    // Token data
    balances,
    tokens,
    tokensLoading,
    tokensRefreshing,
    
    // Pool data (с реальными staking stats)
    poolData,
    poolLoading,
    stakingStatsLoading,
    
    // Actions
    refreshAll,
    refreshTokens,
    refreshPool,
    refreshStakingStats,
    
    // Utilities
    formatBalance,
    contractsReady,
    
    // Computed
    hasAnyBalance,
    isSystemReady
  };
};

/**
 * Hook для получения extended staking статистики
 * Дополняет CryptoDataManager специфичными данными для StakingStats
 */
export const useStakingStats = () => {
  const baseData = useCryptoDataManager();
  
  return {
    ...baseData,
    // Дополнительные computed значения для StakingStats
    calculatePotentialVG: useCallback((vcAmount: number, bnbAmount: number): number => {
      if (!baseData.poolData.lpDivisor || !baseData.poolData.lpToVgRatio) return 0;
      
      const lpDivisor = parseFloat(baseData.poolData.lpDivisor);
      const lpToVgRatio = parseFloat(baseData.poolData.lpToVgRatio);
      const expectedLP = (vcAmount * bnbAmount) / lpDivisor;
      return expectedLP * lpToVgRatio;
    }, [baseData.poolData.lpDivisor, baseData.poolData.lpToVgRatio])
  };
};

/**
 * Utility function для безопасной работы с контрактами
 * Предотвращает TypeScript ошибки "possibly undefined"
 */
export const withContractSafety = <T,>(
  contract: T | null | undefined,
  operation: (contract: T) => Promise<any>,
  fallbackValue?: any
) => {
  if (!contract) {
    log.warn('Contract not available, using fallback', {
      component: 'withContractSafety',
      hasFallback: !!fallbackValue
    });
    return Promise.resolve(fallbackValue || null);
  }
  
  return operation(contract);
};