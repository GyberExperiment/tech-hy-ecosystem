import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO } from '../constants/contracts';
import { toast } from 'react-hot-toast';

export interface TokenData {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  totalSupply: string;
  contract: any;
  icon?: React.ReactNode;
  color?: string;
}

export interface TokenBalances {
  VC: string;
  VG: string;
  VGVotes: string;
  LP: string;
  BNB: string;
}

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
  "function transfer(address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

export const useTokenData = () => {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    provider 
  } = useWeb3();

  const [balances, setBalances] = useState<TokenBalances>({
    VC: '0',
    VG: '0',
    VGVotes: '0',
    LP: '0',
    BNB: '0'
  });
  
  const [tokens, setTokens] = useState<TokenData[]>([]);
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

  // Helper functions
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  };

  const tryMultipleRpc = async <T,>(operation: (provider: ethers.JsonRpcProvider) => Promise<T>): Promise<T> => {
    let lastError: Error | null = null;
    
    for (const rpcUrl of FALLBACK_RPC_URLS) {
      try {
        console.log(`useTokenData: Trying RPC ${rpcUrl}...`);
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        const result = await withTimeout(operation(rpcProvider), 15000);
        console.log(`useTokenData: RPC success with ${rpcUrl}`);
        return result;
      } catch (error: any) {
        console.warn(`useTokenData: RPC failed for ${rpcUrl}:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  };

  const fetchTokenData = useCallback(async (showRefreshToast: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Cache check - не запрашиваем чаще чем раз в 10 секунд
    const now = Date.now();
    if (!showRefreshToast && now - lastFetchTime < 10000) {
      console.log('useTokenData: Skipping fetch - cached data is fresh');
      return;
    }
    
    if (!account || !isConnected || !isCorrectNetwork) {
      console.log('useTokenData: Skipping fetch', { account, isConnected, isCorrectNetwork });
      return;
    }
    
    console.log('useTokenData: Starting token data fetch for account:', account);
    
    if (showRefreshToast) {
      setRefreshing(true);
      toast.loading('Обновление данных токенов...', { id: 'refresh-tokens' });
    } else {
      setLoading(true);
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      const newBalances: TokenBalances = {
        VC: '0',
        VG: '0',
        VGVotes: '0',
        LP: '0',
        BNB: '0'
      };
      
      const tokenData: TokenData[] = [];

      // BNB balance
      try {
        console.log('useTokenData: Fetching BNB balance...');
        const balance = await tryMultipleRpc(async (rpcProvider) => {
          return await rpcProvider.getBalance(account);
        });
        newBalances.BNB = ethers.formatEther(balance);
        console.log('useTokenData: BNB balance fetched:', newBalances.BNB);
      } catch (error: any) {
        console.error('useTokenData: Error fetching BNB balance:', error.message);
        newBalances.BNB = '0';
      }

      // Token contracts info
      const tokenContracts = [
        { 
          symbol: 'VC', 
          name: TOKEN_INFO.VC.name, 
          address: CONTRACTS.VC_TOKEN,
          color: 'from-blue-500 to-cyan-500'
        },
        { 
          symbol: 'VG', 
          name: TOKEN_INFO.VG.name, 
          address: CONTRACTS.VG_TOKEN,
          color: 'from-yellow-500 to-orange-500'
        },
        { 
          symbol: 'VGVotes', 
          name: TOKEN_INFO.VG_VOTES.name, 
          address: CONTRACTS.VG_TOKEN_VOTES,
          color: 'from-purple-500 to-pink-500'
        },
        { 
          symbol: 'LP', 
          name: TOKEN_INFO.LP.name, 
          address: CONTRACTS.LP_TOKEN,
          color: 'from-green-500 to-emerald-500'
        }
      ];

      // Fetch all token data
      for (const tokenInfo of tokenContracts) {
        try {
          console.log(`useTokenData: Fetching ${tokenInfo.symbol} data...`);
          
          const [balance, decimals, totalSupply] = await tryMultipleRpc(async (rpcProvider) => {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, rpcProvider);
            return await Promise.all([
              contract.balanceOf(account),
              contract.decimals(),
              contract.totalSupply()
            ]);
          });

          const formattedBalance = ethers.formatUnits(balance, decimals);
          const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals);
          
          // Update balances object
          newBalances[tokenInfo.symbol as keyof TokenBalances] = formattedBalance;
          
          // Create contract instance for transactions
          const fallbackProvider = new ethers.JsonRpcProvider(FALLBACK_RPC_URLS[0]);
          const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, fallbackProvider);
          
          tokenData.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            balance: formattedBalance,
            decimals: Number(decimals),
            totalSupply: formattedTotalSupply,
            contract: contract,
            color: tokenInfo.color
          });
          
          console.log(`useTokenData: ${tokenInfo.symbol} balance:`, formattedBalance);
        } catch (error) {
          console.error(`useTokenData: Error fetching ${tokenInfo.symbol} data:`, error);
          
          // Add token with zero values as fallback
          newBalances[tokenInfo.symbol as keyof TokenBalances] = '0';
          tokenData.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            balance: '0',
            decimals: 18,
            totalSupply: '0',
            contract: null,
            color: tokenInfo.color
          });
        }
      }

      // Update state only if component is still mounted
      if (isMountedRef.current) {
        setBalances(newBalances);
        setTokens(tokenData);
        setLastFetchTime(now);
        
        console.log('useTokenData: Updated balances:', newBalances);
        console.log('useTokenData: Updated tokens:', tokenData.length, 'tokens');
        
        if (showRefreshToast) {
          toast.success('Данные токенов обновлены!', { id: 'refresh-tokens' });
        }
      }
    } catch (error) {
      console.error('useTokenData: Error fetching token data:', error);
      const errorMessage = 'Ошибка загрузки данных токенов';
      
      if (showRefreshToast) {
        toast.error(errorMessage, { id: 'refresh-tokens' });
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

  // Auto-fetch on mount and account change
  useEffect(() => {
    if (isConnected && isCorrectNetwork && account) {
      fetchTokenData();
    }
  }, [account, isConnected, isCorrectNetwork, fetchTokenData]);

  const refreshData = useCallback(() => {
    fetchTokenData(true);
  }, [fetchTokenData]);

  const formatBalance = useCallback((balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  }, []);

  return {
    balances,
    tokens,
    loading,
    refreshing,
    fetchTokenData,
    refreshData,
    formatBalance,
    // Computed values
    tokensWithBalance: tokens.filter(token => parseFloat(token.balance) > 0),
    totalTokens: tokens.length,
    hasAnyBalance: tokens.some(token => parseFloat(token.balance) > 0)
  };
}; 