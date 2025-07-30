import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { ethers } from 'ethers';
import { TOKEN_INFO } from '../../../shared/config/contracts';
import { useContracts } from '../../../shared/hooks/useContracts';
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
  
  // ✅ Dynamic contracts based on current network
  const { contracts } = useContracts();

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
  const [isInitialized, setIsInitialized] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstFetch = useRef(true);

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

  // ✅ СТАБИЛЬНАЯ ФУНКЦИЯ загрузки без циклических dependencies
  const fetchTokenData = useCallback(async (showRefreshToast: boolean = false, force: boolean = false) => {
    // Блокируем множественные одновременные запросы
    if (abortControllerRef.current && !force) {
      log.debug('useTokenData: Aborting previous fetch', {
        component: 'useTokenData'
      });
      abortControllerRef.current.abort();
    }
    
    // ✅ Строгий кеш для предотвращения спама
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    if (!force && !showRefreshToast && timeSinceLastFetch < 15000) {
      log.debug('useTokenData: Skipping fetch - using cached data', {
        component: 'useTokenData',
        timeSinceLastFetch,
        cacheValidFor: 15000
      });
      return;
    }
    
    if (!account || !isConnected) {
      log.debug('useTokenData: Skipping fetch - wallet not ready', {
        component: 'useTokenData',
        account: !!account,
        isConnected
      });
      return;
    }
    
    log.info('useTokenData: Starting token data fetch', {
      component: 'useTokenData',
      address: account,
      force,
      showRefreshToast,
      timeSinceLastFetch
    });
    
    if (showRefreshToast) {
      setRefreshing(true);
      toast.loading('Обновление балансов...', { id: 'refresh-tokens' });
    } else {
      setLoading(true);
    }
    
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

      // ✅ BNB balance с улучшенным error handling
      try {
        log.debug('useTokenData: Fetching BNB balance', {
          component: 'useTokenData',
          address: account
        });
        
        const balance = await rpcService.withFallback(async (provider) => {
          return await provider.getBalance(account);
        });
        
        newBalances.BNB = ethers.formatEther(balance);
        
        log.info('useTokenData: BNB balance fetched successfully', {
          component: 'useTokenData',
          address: account,
          balance: newBalances.BNB
        });
      } catch (error: any) {
        log.error('useTokenData: Failed to fetch BNB balance, using fallback', {
          component: 'useTokenData',
          address: account,
          error: error.message
        });
        // ✅ Fallback: если есть provider, пробуем напрямую
        try {
          if (provider) {
            const balance = await provider.getBalance(account);
            newBalances.BNB = ethers.formatEther(balance);
            log.info('useTokenData: BNB balance fetched via direct provider', {
              component: 'useTokenData',
              balance: newBalances.BNB
            });
          }
        } catch (fallbackError) {
          log.error('useTokenData: All BNB balance methods failed', {
            component: 'useTokenData'
          });
          newBalances.BNB = '0';
        }
      }

      // ✅ Token contracts с улучшенной обработкой ошибок
      const tokenContracts = [
        { 
          symbol: 'VC', 
          name: TOKEN_INFO.SVC.name, 
          address: contracts.VC_TOKEN,
          color: 'from-blue-500 to-cyan-500'
        },
        { 
          symbol: 'VG', 
          name: TOKEN_INFO.SVG.name, 
          address: contracts.VG_TOKEN,
          color: 'from-yellow-500 to-orange-500'
        },
        { 
          symbol: 'VGVotes', 
          name: TOKEN_INFO.SVG_VOTES.name, 
          address: contracts.VG_TOKEN_VOTES,
          color: 'from-purple-500 to-pink-500'
        },
        { 
          symbol: 'LP', 
          name: TOKEN_INFO.LP.name, 
          address: contracts.LP_TOKEN,
          color: 'from-green-500 to-emerald-500'
        }
      ];

      // ✅ Последовательная загрузка токенов с индивидуальным error handling
      for (const tokenInfo of tokenContracts) {
        try {
          log.debug('useTokenData: Fetching token data', {
            component: 'useTokenData',
            tokenSymbol: tokenInfo.symbol,
            tokenAddress: tokenInfo.address
          });
          
          // ✅ Увеличенный timeout и улучшенная обработка
          const [balance, decimals, totalSupply] = await rpcService.withFallback(async (provider) => {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, provider);
            
            // Параллельные запросы с индивидуальными fallback
            const balancePromise = contract.balanceOf?.(account)?.catch(() => BigInt(0)) || Promise.resolve(BigInt(0));
            const decimalsPromise = contract.decimals?.()?.catch(() => BigInt(18)) || Promise.resolve(BigInt(18));
            const totalSupplyPromise = contract.totalSupply?.()?.catch(() => BigInt(0)) || Promise.resolve(BigInt(0));
            
            return await Promise.all([balancePromise, decimalsPromise, totalSupplyPromise]);
          });

          const formattedBalance = ethers.formatUnits(balance || BigInt(0), decimals || 18);
          const formattedTotalSupply = ethers.formatUnits(totalSupply || BigInt(0), decimals || 18);
          
          newBalances[tokenInfo.symbol as keyof TokenBalances] = formattedBalance;
          
          // ✅ Создаем read-only контракт
          let contract = null;
          try {
            contract = await rpcService.getReadOnlyContract(tokenInfo.address, ERC20_ABI);
          } catch (contractError) {
            log.warn('useTokenData: Failed to create read-only contract', {
              component: 'useTokenData',
              tokenSymbol: tokenInfo.symbol
            });
          }
          
          tokenData.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            balance: formattedBalance,
            decimals: Number(decimals || 18),
            totalSupply: formattedTotalSupply,
            contract: contract,
            color: tokenInfo.color
          });
          
          log.info('useTokenData: Token balance fetched successfully', {
            component: 'useTokenData',
            tokenSymbol: tokenInfo.symbol,
            balance: formattedBalance
          });
          
        } catch (error: any) {
          log.error('useTokenData: Failed to fetch token data, using fallback', {
            component: 'useTokenData',
            tokenSymbol: tokenInfo.symbol,
            tokenAddress: tokenInfo.address,
            error: error.message
          });
          
          // ✅ Fallback: добавляем токен с нулевыми значениями
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

      // ✅ Обновляем состояние только если компонент mounted
      if (isMountedRef.current) {
        setBalances(newBalances);
        setTokens(tokenData);
        setLastFetchTime(now);
        setIsInitialized(true);
        
        log.info('useTokenData: Successfully updated all token data', {
          component: 'useTokenData',
          address: account,
          balances: {
            BNB: newBalances.BNB,
            VC: newBalances.VC,
            VG: newBalances.VG,
            LP: newBalances.LP
          }
        });
        
        if (showRefreshToast) {
          toast.success('Балансы обновлены!', { id: 'refresh-tokens' });
        }

        // ✅ Уведомляем другие компоненты только при значимых изменениях
        if (isFirstFetch.current || showRefreshToast) {
          isFirstFetch.current = false;
          setTimeout(() => {
            if (isMountedRef.current) {
        globalBalanceEmitter.emit();
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      log.error('useTokenData: Critical error during token data fetch', {
        component: 'useTokenData',
        address: account,
        error: error.message,
        stack: error.stack,
        errorDetails: error
      });
      
      // Дополнительная диагностика
      console.error('🚨 USETOKEN DATA ERROR DETAILS:', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorType: error.constructor.name,
        fullError: error,
        balancesAtError: balances,
        account: account
      });
      
      if (showRefreshToast) {
        toast.error('Ошибка обновления балансов', { id: 'refresh-tokens' });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [account, isConnected]); // ✅ Минимальные dependencies

  // ✅ Инициализация только при смене account/connection
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    if (isConnected && account) {
      // Задержка для предотвращения множественных запросов при быстрых переключениях
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          log.info('useTokenData: Initializing token data fetch', {
            component: 'useTokenData',
            account
          });
          fetchTokenData(false, true);
        }
      }, 1000);
    } else {
      // Сбрасываем состояние при отключении
      setBalances({
        VC: '0',
        VG: '0',
        VGVotes: '0',
        LP: '0',
        BNB: '0'
      });
      setTokens([]);
      setIsInitialized(false);
    }
  }, [account, isConnected]); // ✅ Убираем fetchTokenData из dependencies

  // ✅ Подписка на глобальные обновления с дебаунсом
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    
    const unsubscribe = globalBalanceEmitter.subscribe(() => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (account && isConnected && isMountedRef.current && isInitialized) {
          log.debug('useTokenData: Global balance update triggered', {
            component: 'useTokenData',
            account
          });
          fetchTokenData(false, false);
        }
      }, 3000); // 3 секунды дебаунс
    });

    return () => {
      unsubscribe();
      clearTimeout(debounceTimeout);
    };
  }, [account, isConnected, isInitialized]); // ✅ Добавляем isInitialized

  const refreshData = useCallback(() => {
    log.info('useTokenData: Manual refresh requested', {
      component: 'useTokenData',
      account
    });
    fetchTokenData(true, true);
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

  const triggerGlobalRefresh = useCallback(() => {
    log.info('useTokenData: Triggering global refresh', {
      component: 'useTokenData',
      account
    });
    setTimeout(() => {
    globalBalanceEmitter.emit();
    }, 100);
  }, [account]);

  return {
    balances,
    tokens,
    loading,
    refreshing,
    isInitialized,
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

// Re-export types are already exported above 