/**
 * 🧮 ЕДИНЫЙ ХУК ДЛЯ РАСЧЕТОВ
 * 
 * Унифицированный интерфейс для всех математических операций в виджетах
 * Использует централизованную библиотеку расчетов
 */

import { useCallback, useMemo } from 'react';
import { 
  PriceCalculations,
  LiquidityCalculations, 
  VGRewardCalculations,
  PortfolioCalculations,
  FormatUtils,
  ValidationUtils,
  Web3Utils,
  type PoolReserves,
  type LiquidityCalculation,
  type VGRewardCalculation,
  type PortfolioValue
} from '../lib/calculations';
import { usePoolInfo } from '../../entities/Staking/model/usePoolInfo';
import { useTokenData } from '../../entities/Token/model/useTokenData';

/**
 * 💱 Pool calculations hook
 */
export const usePoolCalculations = () => {
  const { poolInfo } = usePoolInfo();

  const calculateBNBFromVC = useCallback((vcAmount: string): string => {
    return PriceCalculations.calculateBNBFromVC(vcAmount, poolInfo);
  }, [poolInfo]);

  const calculateVCFromBNB = useCallback((bnbAmount: string): string => {
    return PriceCalculations.calculateVCFromBNB(bnbAmount, poolInfo);
  }, [poolInfo]);

  const calculatePriceImpact = useCallback((inputAmount: string, isVCInput: boolean = true): number => {
    if (!poolInfo.isLoaded) return 0;
    
    const inputReserve = isVCInput ? poolInfo.vcReserve : poolInfo.bnbReserve;
    const outputReserve = isVCInput ? poolInfo.bnbReserve : poolInfo.vcReserve;
    
    return PriceCalculations.calculatePriceImpact(inputAmount, inputReserve, outputReserve);
  }, [poolInfo]);

  return {
    calculateBNBFromVC,
    calculateVCFromBNB,
    calculatePriceImpact,
    poolInfo,
  };
};

/**
 * 🏊 Liquidity calculations hook
 */
export const useLiquidityCalculations = () => {
  const { poolInfo } = usePoolInfo();

  const calculateLiquidity = useCallback((
    vcInput: string,
    bnbInput: string,
    totalLPSupply: string = '0'
  ): LiquidityCalculation => {
    return LiquidityCalculations.calculateLiquidity(vcInput, bnbInput, poolInfo, totalLPSupply);
  }, [poolInfo]);

  const calculateRemoveLiquidity = useCallback((
    lpAmount: string,
    totalLPSupply: string
  ): { vcAmount: string; bnbAmount: string; isValid: boolean } => {
    return LiquidityCalculations.calculateRemoveLiquidity(lpAmount, poolInfo, totalLPSupply);
  }, [poolInfo]);

  return {
    calculateLiquidity,
    calculateRemoveLiquidity,
    poolInfo,
  };
};

/**
 * 🏆 VG reward calculations hook
 */
export const useVGRewardCalculations = () => {
  const calculateVGRewardForLP = useCallback((
    vcAmount: string,
    bnbAmount: string,
    mode: 'create' | 'burn' = 'create'
  ): VGRewardCalculation => {
    return VGRewardCalculations.calculateVGRewardForLP(vcAmount, bnbAmount, mode);
  }, []);

  const calculateVGRewardForLPBurn = useCallback((lpAmount: string): VGRewardCalculation => {
    return VGRewardCalculations.calculateVGRewardForLPBurn(lpAmount);
  }, []);

  return {
    calculateVGRewardForLP,
    calculateVGRewardForLPBurn,
  };
};

/**
 * 💼 Portfolio calculations hook
 */
export const usePortfolioCalculations = () => {
  const { balances } = useTokenData();

  const calculatePortfolioValue = useCallback((
    prices: {
      vc: number;
      vg: number;
      bnb: number;
      lp: number;
    }
  ): PortfolioValue => {
    return PortfolioCalculations.calculatePortfolioValue(balances, prices);
  }, [balances]);

  const calculatePercentageChange = useCallback((current: number, previous: number): number => {
    return PortfolioCalculations.calculatePercentageChange(current, previous);
  }, []);

  return {
    calculatePortfolioValue,
    calculatePercentageChange,
    balances,
  };
};

/**
 * 🎨 Format utilities hook
 */
export const useFormatUtils = () => {
  const formatCurrency = useCallback((value: number): string => {
    return FormatUtils.formatCurrency(value);
  }, []);

  const formatTokenAmount = useCallback((value: string | number, decimals: number = 4): string => {
    return FormatUtils.formatTokenAmount(value, decimals);
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    return FormatUtils.formatPercentage(value);
  }, []);

  const formatAddress = useCallback((address: string): string => {
    return FormatUtils.formatAddress(address);
  }, []);

  const formatHash = useCallback((hash: string): string => {
    return FormatUtils.formatHash(hash);
  }, []);

  const formatLargeNumber = useCallback((value: number, prefix: string = ''): string => {
    return FormatUtils.formatLargeNumber(value, prefix);
  }, []);

  return {
    formatCurrency,
    formatTokenAmount,
    formatPercentage,
    formatAddress,
    formatHash,
    formatLargeNumber,
  };
};

/**
 * 🛡️ Validation utilities hook
 */
export const useValidationUtils = () => {
  const sanitizeInput = useCallback((input: string): string => {
    return ValidationUtils.sanitizeNumericInput(input);
  }, []);

  const validateTokenAmount = useCallback((amount: string, max?: number) => {
    return ValidationUtils.validateTokenAmount(amount, max);
  }, []);

  const validateSlippage = useCallback((slippage: number) => {
    return ValidationUtils.validateSlippage(slippage);
  }, []);

  return {
    sanitizeInput,
    validateTokenAmount,
    validateSlippage,
  };
};

/**
 * 🔧 Web3 utilities hook
 */
export const useWeb3Utils = () => {
  const safeParseEther = useCallback((value: string): bigint => {
    return Web3Utils.safeParseEther(value);
  }, []);

  const safeFormatEther = useCallback((value: bigint): string => {
    return Web3Utils.safeFormatEther(value);
  }, []);

  const calculateGasWithBuffer = useCallback((estimatedGas: bigint): bigint => {
    return Web3Utils.calculateGasWithBuffer(estimatedGas);
  }, []);

  return {
    safeParseEther,
    safeFormatEther,
    calculateGasWithBuffer,
  };
};

/**
 * 🎯 УНИВЕРСАЛЬНЫЙ ХУК - объединяет все расчеты
 */
export const useCalculations = () => {
  const poolCalculations = usePoolCalculations();
  const liquidityCalculations = useLiquidityCalculations();
  const vgRewardCalculations = useVGRewardCalculations();
  const portfolioCalculations = usePortfolioCalculations();
  const formatUtils = useFormatUtils();
  const validationUtils = useValidationUtils();
  const web3Utils = useWeb3Utils();

  // Memoized combined interface
  return useMemo(() => ({
    // Pool calculations
    ...poolCalculations,
    
    // Liquidity calculations
    ...liquidityCalculations,
    
    // VG reward calculations
    ...vgRewardCalculations,
    
    // Portfolio calculations
    ...portfolioCalculations,
    
    // Format utilities
    ...formatUtils,
    
    // Validation utilities
    ...validationUtils,
    
    // Web3 utilities
    ...web3Utils,
  }), [
    poolCalculations,
    liquidityCalculations,
    vgRewardCalculations,
    portfolioCalculations,
    formatUtils,
    validationUtils,
    web3Utils,
  ]);
}; 