import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO } from '../constants/contracts';
import { toast } from 'react-hot-toast';
import { log } from '../utils/logger';
import { rpcService } from '../services/rpcService';

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

// ✅ Убираем дублированную FALLBACK_RPC_URLS - используем rpcService
// const FALLBACK_RPC_URLS = getAllRpcEndpoints();

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

  // ✅ УБИРАЕМ дублированную tryMultipleRpc функцию - используем rpcService.withFallback()
  // const tryMultipleRpc = async <T,>(operation: (provider: ethers.JsonRpcProvider) => Promise<T>): Promise<T> => {
  //   let lastError: Error | null = null;
  //   
  //   for (let i = 0; i < FALLBACK_RPC_URLS.length; i++) {
  //     const rpcUrl = FALLBACK_RPC_URLS[i];
  //     try {
  //       log.debug('useTokenData: Trying RPC endpoint', {
  //         component: 'useTokenData',
  //         function: 'tryMultipleRpc',
  //         rpcUrl
  //       });
  //       
  //       // ✅ ДОБАВЛЯЕМ DELAY между попытками для rate limiting protection
  //       if (i > 0) {
  //         await new Promise(resolve => setTimeout(resolve, 2000 * i)); // 2s, 4s, 6s delays
  //       }
  //       
  //       const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
  //       const result = await withTimeout(operation(rpcProvider), 15000);
  //       log.info('useTokenData: RPC endpoint success', {
  //         component: 'useTokenData',
  //         function: 'tryMultipleRpc',
  //         rpcUrl
  //       });
  //       return result;
  //     } catch (error: any) {
  //       log.warn('useTokenData: RPC endpoint failed', {
  //         component: 'useTokenData',
  //         function: 'tryMultipleRpc',
  //         rpcUrl,
  //         error: error.message
  //       });
  //       lastError = error;
  //       
  //       // ✅ Больше delay после 429 ошибок
  //       if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
  //         log.info('Rate limited, waiting 5 seconds before next RPC', {
  //           component: 'useTokenData',
  //           function: 'tryMultipleRpc',
  //           rpcUrl
  //         });
  //         await new Promise(resolve => setTimeout(resolve, 5000));
  //       }
  //       continue;
  //     }
  //   }
  //   
  //   throw lastError || new Error('All RPC endpoints failed');
  // };

  const fetchTokenData = useCallback(async (showRefreshToast: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Cache check - не запрашиваем чаще чем раз в 30 секунд для rate limiting protection
    const now = Date.now();
    if (!showRefreshToast && now - lastFetchTime < 30000) {
      log.debug('useTokenData: Skipping fetch - cached data is fresh', {
        component: 'useTokenData',
        function: 'fetchTokenData',
        timeSinceLastFetch: now - lastFetchTime
      });
      return;
    }
    
    if (!account || !isConnected || !isCorrectNetwork) {
      log.debug('useTokenData: Skipping fetch', {
        component: 'useTokenData',
        function: 'fetchTokenData',
        account: account ? 'connected' : 'not connected',
        isConnected,
        isCorrectNetwork
      });
      return;
    }
    
    log.info('useTokenData: Starting token data fetch for account:', account);
    
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
        log.debug('useTokenData: Fetching BNB balance', {
          component: 'useTokenData',
          function: 'fetchTokenData',
          address: account
        });
        const balance = await rpcService.withFallback(async (provider) => {
          return await provider.getBalance(account);
        });
        newBalances.BNB = ethers.formatEther(balance);
        log.info('useTokenData: BNB balance fetched:', {
          component: 'useTokenData',
          function: 'fetchTokenData',
          address: account,
          balance: newBalances.BNB
        });
      } catch (error: any) {
        log.error('useTokenData: Error fetching BNB balance:', {
          component: 'useTokenData',
          function: 'fetchTokenData',
          address: account
        }, error);
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
          log.debug('useTokenData: Fetching token data', {
            component: 'useTokenData',
            function: 'fetchTokenData',
            address: account,
            tokenSymbol: tokenInfo.symbol,
            tokenAddress: tokenInfo.address
          });
          
          const [balance, decimals, totalSupply] = await rpcService.withFallback(async (provider) => {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, provider);
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
          
          log.info('useTokenData: Token balance fetched', {
            component: 'useTokenData',
            function: 'fetchTokenData',
            address: account,
            tokenSymbol: tokenInfo.symbol,
            balance: formattedBalance
          });
        } catch (error) {
          log.error('useTokenData: Error fetching token data', {
            component: 'useTokenData',
            function: 'fetchTokenData',
            address: account,
            tokenSymbol: tokenInfo.symbol,
            tokenAddress: tokenInfo.address
          }, error);
          
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
        
        log.info('useTokenData: Updated balances', {
          component: 'useTokenData',
          function: 'fetchTokenData',
          address: account,
          tokenCount: tokenData.length,
          balances: Object.keys(newBalances)
        });
        log.info('useTokenData: Updated tokens:', tokenData.length, 'tokens');
        
        if (showRefreshToast) {
          toast.success('Данные токенов обновлены!', { id: 'refresh-tokens' });
        }
      }
    } catch (error) {
      log.error('useTokenData: Error fetching token data', {
        component: 'useTokenData',
        function: 'fetchTokenData',
        address: account
      }, error as Error);
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

// Re-export types for better TypeScript compatibility
export type { TokenData, TokenBalances }; 