import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useContracts } from '../../../shared/hooks/useContracts';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';

interface PoolInfo {
  vcReserve: string;
  bnbReserve: string;
  price: string;
  isLoaded: boolean;
}

interface UsePoolInfoReturn {
  poolInfo: PoolInfo;
  loading: boolean;
  error: string | null;
  refreshPoolInfo: () => Promise<void>;
  lastUpdated: number;
}

const PAIR_ABI = [
  "function getReserves() view returns (uint112, uint112, uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)"
];

// Global cache for pool info
const poolInfoCache = new Map<string, { data: PoolInfo; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes

export const usePoolInfo = (): UsePoolInfoReturn => {
  // ✅ Dynamic contracts based on current network
  const { contracts } = useContracts();
  
  const [poolInfo, setPoolInfo] = useState<PoolInfo>({
    vcReserve: '0',
    bnbReserve: '0',
    price: '0',
    isLoaded: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load pool info with caching
  const loadPoolInfo = useCallback(async (forceRefresh = false): Promise<void> => {
    if (loadingRef.current) {
      log.debug('usePoolInfo: Already loading, skipping', {
        component: 'usePoolInfo',
        function: 'loadPoolInfo'
      });
      return;
    }

    // Check cache
    const cacheKey = 'pool-info';
    const cached = poolInfoCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      log.debug('usePoolInfo: Using cached pool info', {
        component: 'usePoolInfo',
        function: 'loadPoolInfo',
        timeSinceLastFetch: Date.now() - cached.timestamp
      });
      setPoolInfo(cached.data);
      setLastUpdated(cached.timestamp);
      return;
    }

    log.info('usePoolInfo: Loading pool info', {
      component: 'usePoolInfo',
      function: 'loadPoolInfo'
    });
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await rpcService.withFallback(async (provider) => {
        const lpPairContract = new ethers.Contract(
          contracts.LP_TOKEN, 
          PAIR_ABI, 
          provider
        );

        const [reserves, token0] = await Promise.all([
          lpPairContract.getReserves?.() || Promise.resolve([0n, 0n, 0]),
          lpPairContract.token0?.() || Promise.resolve(contracts.VC_TOKEN)
        ]);

        const isVCToken0 = token0.toLowerCase() === contracts.VC_TOKEN.toLowerCase();
        const vcReserve = isVCToken0 ? reserves[0] : reserves[1];
        const bnbReserve = isVCToken0 ? reserves[1] : reserves[0];

        const price = vcReserve > 0n ? (Number(bnbReserve) / Number(vcReserve)) : 0;

        return {
          vcReserve: ethers.formatEther(vcReserve),
          bnbReserve: ethers.formatEther(bnbReserve),
          price: price.toFixed(8),
          isLoaded: true
        };
      });

      // Update state and cache
      if (mountedRef.current) {
        setPoolInfo(result);
        const timestamp = Date.now();
        setLastUpdated(timestamp);
        
        // Cache the result
        poolInfoCache.set(cacheKey, { data: result, timestamp });
        
        log.info('usePoolInfo: Pool info loaded successfully', {
          component: 'usePoolInfo',
          function: 'loadPoolInfo',
          result: {
            vcReserve: result.vcReserve,
            bnbReserve: result.bnbReserve,
            price: result.price,
            isLoaded: result.isLoaded
          }
        });
      }
    } catch (error: any) {
      log.error('usePoolInfo: Error loading pool info', {
        component: 'usePoolInfo',
        function: 'loadPoolInfo'
      }, error as Error);
      
      if (mountedRef.current) {
        setError(error.message || 'Failed to load pool info');
        
        // Return fallback with error state
        const fallbackResult = {
          vcReserve: '1000', // Fallback ratio for calculation
          bnbReserve: '10',  // 1 VC = 0.01 BNB fallback
          price: '0.01',
          isLoaded: false
        };
        
        setPoolInfo(fallbackResult);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, []);

  // Refresh function for manual updates
  const refreshPoolInfo = useCallback(async (): Promise<void> => {
    await loadPoolInfo(true);
  }, [loadPoolInfo]);

  // Auto-load on mount
  useEffect(() => {
    loadPoolInfo();
  }, [loadPoolInfo]);

  return {
    poolInfo,
    loading,
    error,
    refreshPoolInfo,
    lastUpdated
  };
}; 