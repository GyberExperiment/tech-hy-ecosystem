import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../constants/contracts';

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

// Fallback RPC URLs
const FALLBACK_RPC_URLS = [
  'https://bsc-testnet-rpc.publicnode.com',
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://bsc-testnet.public.blastapi.io',
  'https://endpoints.omniatech.io/v1/bsc/testnet/public'
];

// Global cache for pool info
const poolInfoCache = new Map<string, { data: PoolInfo; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes

// Utility functions
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
};

const tryMultipleRpc = async <T,>(
  operation: (provider: ethers.JsonRpcProvider) => Promise<T>
): Promise<T> => {
  for (const rpcUrl of FALLBACK_RPC_URLS) {
    try {
      console.log(`usePoolInfo: Trying RPC ${rpcUrl}...`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const result = await withTimeout(operation(provider), 10000);
      console.log(`usePoolInfo: RPC success with ${rpcUrl}`);
      return result;
    } catch (error) {
      console.warn(`usePoolInfo: RPC ${rpcUrl} failed:`, error);
      continue;
    }
  }
  throw new Error('All RPC endpoints failed');
};

export const usePoolInfo = (): UsePoolInfoReturn => {
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
      console.log('usePoolInfo: Already loading, skipping');
      return;
    }

    // Check cache
    const cacheKey = 'pool-info';
    const cached = poolInfoCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('usePoolInfo: Using cached pool info');
      setPoolInfo(cached.data);
      setLastUpdated(cached.timestamp);
      return;
    }

    console.log('usePoolInfo: Loading pool info...');
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await tryMultipleRpc(async (rpcProvider) => {
        const lpPairContract = new ethers.Contract(
          CONTRACTS.LP_TOKEN, 
          PAIR_ABI, 
          rpcProvider
        );

        const [reserves, token0] = await Promise.all([
          lpPairContract.getReserves?.() || Promise.resolve([0n, 0n, 0]),
          lpPairContract.token0?.() || Promise.resolve(CONTRACTS.VC_TOKEN)
        ]);

        const isVCToken0 = token0.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase();
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
        
        console.log('usePoolInfo: Pool info loaded successfully:', result);
      }
    } catch (error: any) {
      console.error('usePoolInfo: Error loading pool info:', error);
      
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