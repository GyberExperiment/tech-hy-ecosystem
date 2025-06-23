import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO } from '../../../shared/config/contracts';
import { toast } from 'react-hot-toast';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';

// ✅ Глобальный event emitter для синхронизации обновлений балансов
class TokenBalanceEventEmitter {
  private listeners: Set<() => void> = new Set();
  
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  emit() {
    this.listeners.forEach(callback => callback());
  }
}

const globalBalanceEmitter = new TokenBalanceEventEmitter();

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
  allowance?: string;
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
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialFetchRef = useRef(true);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
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

  // ✅ ИСПРАВЛЕНИЕ: Убираем lastFetchTime из зависимостей чтобы избежать цикла
  const fetchTokenData = useCallback(async (showRefreshToast: boolean = false, force: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // ✅ ИСПРАВЛЕНИЕ: Более строгая проверка кеша для предотвращения спама запросов
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    // Не делаем запросы чаще чем раз в 10 секунд, кроме принудительных обновлений
    if (!force && !showRefreshToast && timeSinceLastFetch < 10000) {
      log.debug('useTokenData: Skipping fetch - cached data is fresh', {
        component: 'useTokenData',
        function: 'fetchTokenData',
        timeSinceLastFetch,
        force,
        showRefreshToast
      });
      return;
    }
    
    if (!account || !isConnected || !isCorrectNetwork) {
      log.debug('useTokenData: Skipping fetch - not ready', {
        component: 'useTokenData',
        function: 'fetchTokenData',
        account: !!account,
        isConnected,
        isCorrectNetwork
      });
      return;
    }
    
    log.info('useTokenData: Starting token data fetch', {
      component: 'useTokenData',
      function: 'fetchTokenData', 
      address: account,
      force,
      showRefreshToast,
      timeSinceLastFetch
    });
    
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
        log.info('useTokenData: BNB balance fetched', {
          component: 'useTokenData',
          function: 'fetchTokenData',
          address: account,
          balance: newBalances.BNB
        });
      } catch (error: any) {
        log.error('useTokenData: Error fetching BNB balance', {
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
          
          // ✅ Используем getReadOnlyContract() для избежания MetaMask RPC rate limiting
          const contract = await rpcService.getReadOnlyContract(tokenInfo.address, ERC20_ABI);
          
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
        
        log.info('useTokenData: Successfully updated token data', {
          component: 'useTokenData',
          function: 'fetchTokenData',
          address: account,
          tokenCount: tokenData.length
        });
        
        if (showRefreshToast) {
          toast.success('Данные токенов обновлены!', { id: 'refresh-tokens' });
        }

        // ✅ ИСПРАВЛЕНИЕ: Уведомляем другие компоненты только при первом успешном обновлении
        // чтобы избежать циклических обновлений
        if (isInitialFetchRef.current || showRefreshToast) {
          isInitialFetchRef.current = false;
          // Задержка чтобы избежать немедленных циклических обновлений
          setTimeout(() => {
            if (isMountedRef.current) {
        globalBalanceEmitter.emit();
            }
          }, 500);
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
  }, [account, isConnected, isCorrectNetwork]); // ✅ Убираем lastFetchTime из зависимостей

  // ✅ ИСПРАВЛЕНИЕ: Подписываемся на глобальные обновления балансов с дебаунсом
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    
    const unsubscribe = globalBalanceEmitter.subscribe(() => {
      // Дебаунс для предотвращения слишком частых обновлений
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (account && isConnected && isCorrectNetwork && isMountedRef.current) {
          log.info('useTokenData: Received global balance update event (debounced)', {
            component: 'useTokenData',
            account
          });
          fetchTokenData(false, false); // Фоновое обновление без принуждения
        }
      }, 2000); // 2 секунды дебаунс
    });

    return () => {
      unsubscribe();
      clearTimeout(debounceTimeout);
    };
  }, [account, isConnected, isCorrectNetwork, fetchTokenData]);

  // ✅ ИСПРАВЛЕНИЕ: Убираем fetchTokenData из зависимостей useEffect для предотвращения цикла
  useEffect(() => {
    // Дебаунс для предотвращения слишком частых инициализаций
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    if (isConnected && isCorrectNetwork && account) {
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          fetchTokenData(false, true); // Первоначальная загрузка с force=true
        }
      }, 500); // 500ms задержка для предотвращения спама
    }
  }, [account, isConnected, isCorrectNetwork]); // ✅ Убираем fetchTokenData из зависимостей

  const refreshData = useCallback(() => {
    fetchTokenData(true, true); // Принудительное обновление с toast
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

  // ✅ Функция для принудительного глобального обновления всех компонентов
  const triggerGlobalRefresh = useCallback(() => {
    log.info('useTokenData: Triggering global balance refresh for all components', {
      component: 'useTokenData',
      account
    });
    // Немедленное обновление с задержкой для распространения
    setTimeout(() => {
    globalBalanceEmitter.emit();
    }, 100);
  }, [account]);

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
    hasAnyBalance: tokens.some(token => parseFloat(token.balance) > 0),
    triggerGlobalRefresh
  };
};

// Re-export types for better TypeScript compatibility
export type { TokenData, TokenBalances }; 