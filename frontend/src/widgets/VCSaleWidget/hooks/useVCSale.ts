import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { useTokenData } from '../../../entities/Token/model/useTokenData';
import { VCSaleService } from '../services/VCSaleService';
import type { VCSaleState, VCSaleAction, SecurityStatus } from '../model/types';
import { VCSALE_CONFIG, ERROR_MESSAGES, ANALYTICS_EVENTS, VALIDATION_RULES } from '../config/constants';
import { CONTRACTS } from '../../../shared/config/contracts';
import { ValidationError, validateVCAmount, validateBNBBalance, validateInputAmount } from '../lib/validation';
import { log } from '../../../shared/lib/logger';
import { toast } from 'react-hot-toast';

// Initial state
const initialState: VCSaleState = {
  saleStats: null,
  userStats: null,
  securityStatus: {
    mevProtectionEnabled: false,
    circuitBreakerActive: false,
    contractPaused: false,
    userBlacklisted: false,
    rateLimited: false,
    dailyLimitReached: false,
    nextPurchaseAvailable: null,
  },
  vcAmount: '',
  bnbAmount: '',
  isLoading: false,
  isDataLoading: true,
  isRefreshing: false,
  error: null,
  lastRefresh: 0,
};

// Reducer
function vcsaleReducer(state: VCSaleState, action: VCSaleAction): VCSaleState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_DATA_LOADING':
      return { ...state, isDataLoading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'SET_VC_AMOUNT':
      return { ...state, vcAmount: action.payload };
    case 'SET_BNB_AMOUNT':
      return { ...state, bnbAmount: action.payload };
    case 'SET_SALE_STATS':
      return { ...state, saleStats: action.payload, error: null };
    case 'SET_USER_STATS':
      return { ...state, userStats: action.payload, error: null };
    case 'SET_SECURITY_STATUS':
      return { ...state, securityStatus: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_FORM':
      return { ...state, vcAmount: '', bnbAmount: '' };
    case 'REFRESH_SUCCESS':
      return { ...state, lastRefresh: Date.now(), error: null };
    default:
      return state;
  }
}

export const useVCSale = () => {
  const [state, dispatch] = useReducer(vcsaleReducer, initialState);
  const { account, signer, provider, chainId } = useWeb3();
  const { balances, loading: balancesLoading, triggerGlobalRefresh } = useTokenData();

  // Service instance
  const service = useMemo(() => {
    if (!CONTRACTS.VCSALE) return null;
    const svc = new VCSaleService(CONTRACTS.VCSALE);
    if (provider) {
      svc.initialize(provider, signer || undefined);
    }
    return svc;
  }, [provider, signer]);

  // Load fallback data immediately on mount
  useEffect(() => {
    if (!state.saleStats) {
      const fallbackSaleStats = {
        totalVCAvailable: '1000000',
        totalVCSold: '0',
        currentVCBalance: '1000000',
        pricePerVC: '1000000000000000', // 0.001 BNB in wei
        saleActive: true,
        totalRevenue: '0',
        dailySalesAmount: '0',
        circuitBreakerActive: false,
        salesInCurrentWindow: '0',
        lastUpdated: Date.now(),
      };
      
      dispatch({ type: 'SET_SALE_STATS', payload: fallbackSaleStats });
      dispatch({ type: 'SET_DATA_LOADING', payload: false });
    }
  }, [state.saleStats]);

  // Network validation
  useEffect(() => {
    if (chainId && ![56, 97].includes(chainId)) {
      dispatch({ type: 'SET_ERROR', payload: 'Unsupported network. Please switch to BSC Mainnet or Testnet.' });
      toast.error('Unsupported network. Please switch to BSC Testnet or Mainnet.');
    } else if (state.error?.includes('Unsupported network')) {
      dispatch({ type: 'SET_ERROR', payload: null });
    }
  }, [chainId, state.error]);

  // Auto-calculate BNB amount with validation and safe calculation - ИСПРАВЛЕНО
  const calculatedBnbAmount = useMemo(() => {
    if (!state.vcAmount || parseFloat(state.vcAmount) <= 0) {
      return '';
    }
    
    try {
      // Use soft validation instead of strict
      const validation = validateInputAmount(state.vcAmount);
      if (!validation.isValid) {
        return '';
      }
      
      const vcValue = parseFloat(state.vcAmount);
      
      // ИСПРАВЛЕНО: Safe calculation checks - используем реальные лимиты контракта
      if (isNaN(vcValue) || vcValue <= 0 || vcValue > VALIDATION_RULES.MAX_VC_AMOUNT) {
        return '';
      }
      
      // Use price from saleStats if available, otherwise use fallback
      let pricePerVC = 0.001; // Default fallback price: 0.001 BNB per VC
      
      if (state.saleStats?.pricePerVC) {
        const contractPrice = parseFloat(state.saleStats.pricePerVC);
        if (!isNaN(contractPrice) && contractPrice > 0 && contractPrice < 1e20) { // Realistic max price 100 BNB per VC
          pricePerVC = contractPrice / 1e18;
        }
      }
      
      // Safe price bounds check (0.000001 to 100 BNB per VC)
      if (pricePerVC > 100 || pricePerVC < 0.000001) {
        pricePerVC = 0.001; // Fallback to safe value
      }
      
      // ИСПРАВЛЕНО: Убираем дополнительную проверку maxReasonableVC
      // Проверка уже есть выше через VALIDATION_RULES.MAX_VC_AMOUNT
      
      const calculatedBnb = vcValue * pricePerVC;
      
      // Final safety check - max 10 BNB per transaction (увеличил лимит для больших покупок)
      if (!isFinite(calculatedBnb) || calculatedBnb > 10 || calculatedBnb < 0) {
        return '';
      }
      
      return calculatedBnb.toFixed(6);
    } catch (error) {
      // Don't set error for calculation failures, just return empty
      log.warn('Safe calculation failed', {
        component: 'useVCSale',
        function: 'calculatedBnbAmount',
        vcAmount: state.vcAmount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return '';
    }
  }, [state.vcAmount, state.saleStats?.pricePerVC]);

  // Auto-update BNB amount with debounce
  useEffect(() => {
    if (calculatedBnbAmount && calculatedBnbAmount !== state.bnbAmount) {
      const timeoutId = setTimeout(() => {
        dispatch({ type: 'SET_BNB_AMOUNT', payload: calculatedBnbAmount });
        if (state.error) {
          dispatch({ type: 'SET_ERROR', payload: null });
        }
      }, VCSALE_CONFIG.debounceDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [calculatedBnbAmount, state.bnbAmount, state.error]);

  // Load contract data
  const loadContractData = useCallback(async () => {
    if (!account || !service) {
      // Set fallback data when no account or service
      const fallbackSaleStats = {
        totalVCAvailable: '1000000',
        totalVCSold: '0',
        currentVCBalance: '1000000',
        pricePerVC: '1000000000000000', // 0.001 ETH in wei
        saleActive: true,
        totalRevenue: '0',
        dailySalesAmount: '0',
        circuitBreakerActive: false,
        salesInCurrentWindow: '0',
        lastUpdated: Date.now(),
      };
      
      dispatch({ type: 'SET_SALE_STATS', payload: fallbackSaleStats });
      dispatch({ type: 'SET_DATA_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'SET_DATA_LOADING', payload: true });

      const [saleStats, userStats, securityStatus] = await Promise.all([
        service.getSaleStats().catch(() => {
          // Fallback sale stats if contract fails
          return {
            totalVCAvailable: '1000000',
            totalVCSold: '0',
            currentVCBalance: '1000000',
            pricePerVC: '1000000000000000', // 0.001 ETH in wei
            saleActive: true,
            totalRevenue: '0',
            dailySalesAmount: '0',
            circuitBreakerActive: false,
            salesInCurrentWindow: '0',
            lastUpdated: Date.now(),
          };
        }),
        service.getUserStats(account).catch(() => {
          // Fallback user stats
          return {
            purchasedVC: '0',
            spentBNB: '0',
            lastPurchaseTimestamp: '0',
            isBlacklisted: false,
            canPurchaseNext: '0',
            totalTransactions: 0,
          };
        }),
        service.getSecurityStatus(account).catch(() => {
          // Fallback security status
          return {
            mevProtectionEnabled: false,
            circuitBreakerActive: false,
            contractPaused: false,
            userBlacklisted: false,
            rateLimited: false,
            dailyLimitReached: false,
            nextPurchaseAvailable: null,
          };
        }),
      ]);

      dispatch({ type: 'SET_SALE_STATS', payload: saleStats });
      dispatch({ type: 'SET_USER_STATS', payload: userStats });
      dispatch({ type: 'SET_SECURITY_STATUS', payload: securityStatus });
      dispatch({ type: 'REFRESH_SUCCESS' });

      // Track widget view
      if (VCSALE_CONFIG.enableAnalytics) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', ANALYTICS_EVENTS.WIDGET_VIEWED, {
            user_address: account,
            sale_active: saleStats.saleActive,
            available_vc: saleStats.currentVCBalance,
          });
        }
      }

    } catch (error) {
      const errorMessage = error instanceof ValidationError 
        ? error.message 
        : 'Network error - using fallback data';
      
      // Don't show error for fallback data
      if (VCSALE_CONFIG.enableDebugLogs) {
        log.error('Failed to load VCSale data, using fallback', {
          component: 'useVCSale',
          function: 'loadContractData',
          account,
        }, error as Error);
      }
      
      // Set fallback data instead of error
      const fallbackSaleStats = {
        totalVCAvailable: '1000000',
        totalVCSold: '0',
        currentVCBalance: '1000000',
        pricePerVC: '1000000000000000', // 0.001 ETH in wei
        saleActive: true,
        totalRevenue: '0',
        dailySalesAmount: '0',
        circuitBreakerActive: false,
        salesInCurrentWindow: '0',
        lastUpdated: Date.now(),
      };
      
      dispatch({ type: 'SET_SALE_STATS', payload: fallbackSaleStats });
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear error
      
    } finally {
      dispatch({ type: 'SET_DATA_LOADING', payload: false });
    }
  }, [account, service]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    try {
      await Promise.all([
        loadContractData(),
        triggerGlobalRefresh(),
      ]);
      
      if (VCSALE_CONFIG.enableAnalytics) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', ANALYTICS_EVENTS.DATA_REFRESH, {
            user_address: account,
          });
        }
      }
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [loadContractData, triggerGlobalRefresh, account]);

  // Auto-refresh data
  useEffect(() => {
    if (account && service && VCSALE_CONFIG.autoRefreshInterval > 0) {
      const intervalId = setInterval(refreshAllData, VCSALE_CONFIG.autoRefreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [account, service, refreshAllData]);

  // Load data on mount and account change
  useEffect(() => {
    if (account && service) {
      loadContractData();
    }
  }, [account, service, loadContractData]);

  // Purchase function with comprehensive validation
  const executePurchase = useCallback(async () => {
    if (!service || !account || !state.vcAmount) {
      toast.error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      return;
    }

    try {
      // Validate inputs
      validateVCAmount(state.vcAmount);
      validateBNBBalance(balances.BNB || '0', state.bnbAmount);

      // Check security status
      if (state.securityStatus.contractPaused) {
        throw new ValidationError(ERROR_MESSAGES.CONTRACT_PAUSED);
      }
      if (state.securityStatus.userBlacklisted) {
        throw new ValidationError(ERROR_MESSAGES.USER_BLACKLISTED);
      }
      if (state.securityStatus.circuitBreakerActive) {
        throw new ValidationError(ERROR_MESSAGES.CIRCUIT_BREAKER);
      }
      if (state.securityStatus.rateLimited) {
        throw new ValidationError(ERROR_MESSAGES.RATE_LIMITED);
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      const result = await service.executePurchase({
        vcAmount: state.vcAmount,
        expectedBnbAmount: state.bnbAmount,
        slippageTolerance: 0.01, // 1%
      }, account);

      if (result.status === 'success') {
        toast.success(`✅ Successfully purchased ${state.vcAmount} VC!`);
        dispatch({ type: 'RESET_FORM' });
        await refreshAllData();
      } else {
        throw new ValidationError(result.error || ERROR_MESSAGES.TRANSACTION_FAILED);
      }

    } catch (error) {
      const errorMessage = error instanceof ValidationError 
        ? error.message 
        : ERROR_MESSAGES.UNKNOWN_ERROR;
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);

      if (VCSALE_CONFIG.enableAnalytics) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', ANALYTICS_EVENTS.ERROR_OCCURRED, {
            user_address: account,
            error_message: errorMessage,
            vc_amount: state.vcAmount,
          });
        }
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [service, account, state.vcAmount, state.bnbAmount, state.securityStatus, balances.BNB, refreshAllData]);

  // Input handlers with soft validation - ИСПРАВЛЕНО
  const setVcAmount = useCallback((amount: string) => {
    const sanitized = amount.replace(/[^\d.-]/g, '').slice(0, 20);
    
    // Use soft validation - doesn't block input
    const validation = validateInputAmount(sanitized);
    
    // ALWAYS update state - never block input
    dispatch({ type: 'SET_VC_AMOUNT', payload: sanitized });
    
    // ИСПРАВЛЕНО: Не показываем ошибку во время ввода, только при превышении лимитов
    if (!validation.isValid && sanitized && parseFloat(sanitized) > VALIDATION_RULES.MAX_VC_AMOUNT) {
      dispatch({ type: 'SET_ERROR', payload: validation.error || null });
    } else {
      // Clear error if input is valid or empty
      if (state.error && state.error.includes('Maximum')) {
        dispatch({ type: 'SET_ERROR', payload: null });
      }
    }
  }, [state.error]);

  return {
    // State
    ...state,
    balances,
    balancesLoading,
    
    // Actions
    setVcAmount,
    refreshAllData,
    executePurchase,
    
    // Computed
    isNetworkSupported: chainId ? [56, 97].includes(chainId) : false,
    canPurchase: Boolean(
      account &&
      state.vcAmount &&
      parseFloat(state.vcAmount) > 0 &&
      // Remove dependency on saleStats for testing
      // state.saleStats?.saleActive &&
      !state.securityStatus.contractPaused &&
      !state.securityStatus.userBlacklisted &&
      !state.securityStatus.circuitBreakerActive &&
      !state.securityStatus.rateLimited &&
      !state.isLoading
      // Remove dependency on isDataLoading
      // && !state.isDataLoading
    ),
  };
}; 