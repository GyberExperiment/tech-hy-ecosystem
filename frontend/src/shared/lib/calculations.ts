/**
 * 🧮 ЕДИНАЯ БИБЛИОТЕКА РАСЧЕТОВ
 * 
 * Централизованные математические функции для всех виджетов
 * Устраняет дублирование кода и обеспечивает консистентность расчетов
 */

import { ethers } from 'ethers';
import { WIDGET_CONFIG, FORMAT_CONFIG } from '../config/widgets';
import { log } from './logger';

/**
 * 🎯 Types for calculations
 */
export interface PoolReserves {
  vcReserve: string;
  bnbReserve: string;
  isLoaded: boolean;
}

export interface LiquidityCalculation {
  vcAmount: string;
  bnbAmount: string;
  lpTokensToReceive: string;
  priceImpact: number;
  shareOfPool: number;
  isValid: boolean;
}

export interface VGRewardCalculation {
  expectedVG: string;
  lpTokensUsed: string;
  ratio: number;
  isValid: boolean;
}

export interface PortfolioValue {
  totalValue: number;
  breakdown: {
    vc: number;
    vg: number;
    bnb: number;
    lp: number;
  };
  formatted: string;
}

/**
 * 💱 PRICE CALCULATIONS
 */
export class PriceCalculations {
  /**
   * Calculate BNB amount needed for given VC amount based on pool reserves
   */
  static calculateBNBFromVC(vcAmount: string, poolReserves: PoolReserves): string {
    if (!poolReserves.isLoaded || !vcAmount || parseFloat(vcAmount) <= 0) {
      return '';
    }

    try {
      const vcValue = parseFloat(vcAmount);
      const vcReserve = parseFloat(poolReserves.vcReserve);
      const bnbReserve = parseFloat(poolReserves.bnbReserve);

      // Validate reserves
      if (isNaN(vcValue) || vcReserve <= 0 || bnbReserve <= 0) {
        return '';
      }

      // Calculate ratio: BNB per VC
      const ratio = bnbReserve / vcReserve;
      const calculatedBnb = vcValue * ratio;

      // Safety checks
      if (!isFinite(calculatedBnb) || calculatedBnb < 0) {
        return '';
      }

      return calculatedBnb.toFixed(6);
    } catch (error) {
      log.warn('Failed to calculate BNB from VC', { vcAmount, poolReserves }, error as Error);
      return '';
    }
  }

  /**
   * Calculate VC amount for given BNB amount based on pool reserves
   */
  static calculateVCFromBNB(bnbAmount: string, poolReserves: PoolReserves): string {
    if (!poolReserves.isLoaded || !bnbAmount || parseFloat(bnbAmount) <= 0) {
      return '';
    }

    try {
      const bnbValue = parseFloat(bnbAmount);
      const vcReserve = parseFloat(poolReserves.vcReserve);
      const bnbReserve = parseFloat(poolReserves.bnbReserve);

      if (isNaN(bnbValue) || vcReserve <= 0 || bnbReserve <= 0) {
        return '';
      }

      // Calculate ratio: VC per BNB
      const ratio = vcReserve / bnbReserve;
      const calculatedVC = bnbValue * ratio;

      if (!isFinite(calculatedVC) || calculatedVC < 0) {
        return '';
      }

      return calculatedVC.toFixed(4);
    } catch (error) {
      log.warn('Failed to calculate VC from BNB', { bnbAmount, poolReserves }, error as Error);
      return '';
    }
  }

  /**
   * Calculate price impact for a trade
   */
  static calculatePriceImpact(
    inputAmount: string, 
    inputReserve: string, 
    outputReserve: string
  ): number {
    try {
      const input = parseFloat(inputAmount);
      const reserveIn = parseFloat(inputReserve);
      const reserveOut = parseFloat(outputReserve);

      if (input <= 0 || reserveIn <= 0 || reserveOut <= 0) {
        return 0;
      }

      // Price before trade
      const priceBefore = reserveOut / reserveIn;
      
      // Price after trade (with constant product formula)
      const inputWithFee = input * 0.9975; // 0.25% fee
      const newReserveIn = reserveIn + inputWithFee;
      const newReserveOut = (reserveIn * reserveOut) / newReserveIn;
      const priceAfter = newReserveOut / newReserveIn;

      // Calculate impact
      const impact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
      
      return Math.min(impact, 100); // Cap at 100%
    } catch (error) {
      log.warn('Failed to calculate price impact', { inputAmount, inputReserve, outputReserve }, error as Error);
      return 0;
    }
  }
}

/**
 * 🏊 LIQUIDITY CALCULATIONS
 */
export class LiquidityCalculations {
  /**
   * Calculate optimal liquidity amounts and LP tokens to receive
   */
  static calculateLiquidity(
    vcInput: string,
    bnbInput: string,
    poolReserves: PoolReserves,
    totalLPSupply: string = '0'
  ): LiquidityCalculation {
    const result: LiquidityCalculation = {
      vcAmount: '0',
      bnbAmount: '0',
      lpTokensToReceive: '0',
      priceImpact: 0,
      shareOfPool: 0,
      isValid: false,
    };

    if (!poolReserves.isLoaded || !vcInput || !bnbInput) {
      return result;
    }

    try {
      const vcAmount = parseFloat(vcInput);
      const bnbAmount = parseFloat(bnbInput);
      const vcReserve = parseFloat(poolReserves.vcReserve);
      const bnbReserve = parseFloat(poolReserves.bnbReserve);
      const totalSupply = parseFloat(totalLPSupply);

      if (vcAmount <= 0 || bnbAmount <= 0) {
        return result;
      }

      let finalVcAmount = vcAmount;
      let finalBnbAmount = bnbAmount;
      let lpTokens = 0;

      if (vcReserve === 0 || bnbReserve === 0) {
        // First liquidity provision
        lpTokens = Math.sqrt(vcAmount * bnbAmount);
        result.shareOfPool = 100;
      } else {
        // Calculate optimal amounts based on current pool ratio
        const currentRatio = bnbReserve / vcReserve;
        const requiredBnbForVc = vcAmount * currentRatio;
        const requiredVcForBnb = bnbAmount / currentRatio;

        if (requiredBnbForVc > bnbAmount) {
          // BNB is limiting factor
          finalVcAmount = requiredVcForBnb;
          finalBnbAmount = bnbAmount;
        } else {
          // VC is limiting factor
          finalVcAmount = vcAmount;
          finalBnbAmount = requiredBnbForVc;
        }

        // Calculate LP tokens based on proportion
        const vcProportion = finalVcAmount / vcReserve;
        const bnbProportion = finalBnbAmount / bnbReserve;
        const proportion = Math.min(vcProportion, bnbProportion);
        
        lpTokens = proportion * totalSupply;
        result.shareOfPool = (lpTokens / (totalSupply + lpTokens)) * 100;
      }

      // Calculate price impact
      result.priceImpact = Math.abs((finalVcAmount / vcReserve) * 100);

      result.vcAmount = finalVcAmount.toFixed(6);
      result.bnbAmount = finalBnbAmount.toFixed(6);
      result.lpTokensToReceive = lpTokens.toFixed(6);
      result.isValid = true;

      return result;
    } catch (error) {
      log.error('Failed to calculate liquidity', { vcInput, bnbInput, poolReserves }, error as Error);
      return result;
    }
  }

  /**
   * Calculate tokens received when removing liquidity
   */
  static calculateRemoveLiquidity(
    lpAmount: string,
    poolReserves: PoolReserves,
    totalLPSupply: string
  ): { vcAmount: string; bnbAmount: string; isValid: boolean } {
    if (!poolReserves.isLoaded || !lpAmount || !totalLPSupply) {
      return { vcAmount: '0', bnbAmount: '0', isValid: false };
    }

    try {
      const lpTokens = parseFloat(lpAmount);
      const totalSupply = parseFloat(totalLPSupply);
      const vcReserve = parseFloat(poolReserves.vcReserve);
      const bnbReserve = parseFloat(poolReserves.bnbReserve);

      if (lpTokens <= 0 || totalSupply <= 0 || vcReserve <= 0 || bnbReserve <= 0) {
        return { vcAmount: '0', bnbAmount: '0', isValid: false };
      }

      const proportion = lpTokens / totalSupply;
      const vcAmount = vcReserve * proportion;
      const bnbAmount = bnbReserve * proportion;

      return {
        vcAmount: vcAmount.toFixed(6),
        bnbAmount: bnbAmount.toFixed(6),
        isValid: true,
      };
    } catch (error) {
      log.error('Failed to calculate remove liquidity', { lpAmount, poolReserves, totalLPSupply }, error as Error);
      return { vcAmount: '0', bnbAmount: '0', isValid: false };
    }
  }
}

/**
 * 🏆 VG REWARD CALCULATIONS
 */
export class VGRewardCalculations {
  /**
   * Calculate VG rewards for LP creation and burn
   */
  static calculateVGRewardForLP(
    vcAmount: string,
    bnbAmount: string,
    mode: 'create' | 'burn' = 'create'
  ): VGRewardCalculation {
    const result: VGRewardCalculation = {
      expectedVG: '0',
      lpTokensUsed: '0',
      ratio: WIDGET_CONFIG.LP_STAKING.DEFAULT_LP_TO_VG_RATIO,
      isValid: false,
    };

    if (!vcAmount || !bnbAmount) {
      return result;
    }

    try {
      const vcValue = parseFloat(vcAmount);
      const bnbValue = parseFloat(bnbAmount);

      if (vcValue <= 0 || bnbValue <= 0) {
        return result;
      }

      let lpAmount: number;

      if (mode === 'create') {
        // For LP creation: LP = sqrt(VC * BNB) / LP_DIVISOR
        const lpDivisor = WIDGET_CONFIG.LP_STAKING.LP_DIVISOR;
        lpAmount = Math.sqrt(vcValue * bnbValue) / lpDivisor;
      } else {
        // For LP burn: LP amount is the input
        lpAmount = vcValue; // In burn mode, vcAmount represents LP amount
      }

      const vgReward = lpAmount * result.ratio;

      result.expectedVG = vgReward.toFixed(2);
      result.lpTokensUsed = lpAmount.toFixed(6);
      result.isValid = true;

      return result;
    } catch (error) {
      log.error('Failed to calculate VG reward', { vcAmount, bnbAmount, mode }, error as Error);
      return result;
    }
  }

  /**
   * Calculate VG rewards for direct LP token burn
   */
  static calculateVGRewardForLPBurn(lpAmount: string): VGRewardCalculation {
    const result: VGRewardCalculation = {
      expectedVG: '0',
      lpTokensUsed: lpAmount,
      ratio: WIDGET_CONFIG.LP_STAKING.DEFAULT_LP_TO_VG_RATIO,
      isValid: false,
    };

    if (!lpAmount) {
      return result;
    }

    try {
      const lpValue = parseFloat(lpAmount);

      if (lpValue <= 0) {
        return result;
      }

      const vgReward = lpValue * result.ratio;

      result.expectedVG = vgReward.toFixed(2);
      result.isValid = true;

      return result;
    } catch (error) {
      log.error('Failed to calculate VG reward for LP burn', { lpAmount }, error as Error);
      return result;
    }
  }
}

/**
 * 💼 PORTFOLIO CALCULATIONS
 */
export class PortfolioCalculations {
  /**
   * Calculate total portfolio value in USD
   */
  static calculatePortfolioValue(
    balances: {
      VC: string;
      VG: string;
      BNB: string;
      LP: string;
    },
    prices: {
      vc: number;
      vg: number;
      bnb: number;
      lp: number;
    }
  ): PortfolioValue {
    try {
      const vcValue = parseFloat(balances.VC || '0') * prices.vc;
      const vgValue = parseFloat(balances.VG || '0') * prices.vg;
      const bnbValue = parseFloat(balances.BNB || '0') * prices.bnb;
      const lpValue = parseFloat(balances.LP || '0') * prices.lp;

      const totalValue = vcValue + vgValue + bnbValue + lpValue;

      return {
        totalValue,
        breakdown: {
          vc: vcValue,
          vg: vgValue,
          bnb: bnbValue,
          lp: lpValue,
        },
        formatted: FormatUtils.formatCurrency(totalValue),
      };
    } catch (error) {
      log.error('Failed to calculate portfolio value', { balances, prices }, error as Error);
      return {
        totalValue: 0,
        breakdown: { vc: 0, vg: 0, bnb: 0, lp: 0 },
        formatted: '$0.00',
      };
    }
  }

  /**
   * Calculate percentage change between two values
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
}

/**
 * 🎨 FORMAT UTILITIES
 */
export class FormatUtils {
  /**
   * Format number as currency
   */
  static formatCurrency(value: number): string {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '< $0.01';
    
    if (value >= FORMAT_CONFIG.large_numbers.thousand) {
      return FormatUtils.formatLargeNumber(value, '$');
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      ...FORMAT_CONFIG.currency,
    }).format(value);
  }

  /**
   * Format number with appropriate suffix (K, M, B)
   */
  static formatLargeNumber(value: number, prefix: string = ''): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (abs >= 1e12) {
      return `${sign}${prefix}${(abs / 1e12).toFixed(1)}${FORMAT_CONFIG.large_numbers.trillion}`;
    }
    if (abs >= 1e9) {
      return `${sign}${prefix}${(abs / 1e9).toFixed(1)}${FORMAT_CONFIG.large_numbers.billion}`;
    }
    if (abs >= 1e6) {
      return `${sign}${prefix}${(abs / 1e6).toFixed(1)}${FORMAT_CONFIG.large_numbers.million}`;
    }
    if (abs >= 1e3) {
      return `${sign}${prefix}${(abs / 1e3).toFixed(1)}${FORMAT_CONFIG.large_numbers.thousand}`;
    }
    
    return `${sign}${prefix}${abs.toFixed(2)}`;
  }

  /**
   * Format token amount
   */
  static formatTokenAmount(value: string | number, decimals: number = 4): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num) || num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      ...FORMAT_CONFIG.percentage,
    }).format(value / 100);
  }

  /**
   * Format address (short form)
   */
  static formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format hash (short form)
   */
  static formatHash(hash: string): string {
    if (!hash || hash.length < 12) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  }
}

/**
 * 🛡️ VALIDATION UTILITIES
 */
export class ValidationUtils {
  /**
   * Validate and sanitize numeric input
   */
  static sanitizeNumericInput(input: string): string {
    return input
      .replace(WIDGET_CONFIG.SECURITY.INPUT_SANITIZATION_REGEX, '')
      .slice(0, WIDGET_CONFIG.SECURITY.MAX_INPUT_LENGTH);
  }

  /**
   * Validate token amount
   */
  static validateTokenAmount(amount: string, max?: number): { isValid: boolean; error?: string } {
    const sanitized = ValidationUtils.sanitizeNumericInput(amount);
    const num = parseFloat(sanitized);

    if (isNaN(num) || num <= 0) {
      return { isValid: false, error: 'Please enter a valid amount' };
    }

    if (max && num > max) {
      return { isValid: false, error: `Amount cannot exceed ${max}` };
    }

    if (num > WIDGET_CONFIG.SECURITY.MAX_TRANSACTION_VALUE) {
      return { isValid: false, error: 'Amount too large' };
    }

    return { isValid: true };
  }

  /**
   * Check if slippage is within acceptable range
   */
  static validateSlippage(slippage: number): { isValid: boolean; error?: string } {
    if (slippage < 0 || slippage > 50) {
      return { isValid: false, error: 'Slippage must be between 0% and 50%' };
    }

    if (slippage > 5) {
      return { isValid: true, error: 'High slippage warning: Consider reducing slippage' };
    }

    return { isValid: true };
  }
}

/**
 * 🔧 WEB3 UTILITIES
 */
export class Web3Utils {
  /**
   * Safe parse ether with validation
   */
  static safeParseEther(value: string): bigint {
    try {
      const sanitized = ValidationUtils.sanitizeNumericInput(value);
      if (!sanitized || parseFloat(sanitized) <= 0) {
        throw new Error('Invalid amount');
      }
      return ethers.parseEther(sanitized);
    } catch (error) {
      log.error('Failed to parse ether', { value }, error as Error);
      throw new Error('Invalid amount format');
    }
  }

  /**
   * Safe format ether with fallback
   */
  static safeFormatEther(value: bigint): string {
    try {
      return ethers.formatEther(value);
    } catch (error) {
      log.error('Failed to format ether', { value }, error as Error);
      return '0';
    }
  }

  /**
   * Calculate gas limit with buffer
   */
  static calculateGasWithBuffer(estimatedGas: bigint): bigint {
    const buffer = BigInt(Math.floor(WIDGET_CONFIG.LP_STAKING.GAS_BUFFER_MULTIPLIER * 100));
    return (estimatedGas * buffer) / 100n;
  }
}

/**
 * 📊 ANALYTICS UTILITIES
 */
export class AnalyticsCalculations {
  /**
   * Calculate APY for staking
   */
  static calculateAPY(rewardRate: number, stakingPeriod: number): number {
    if (rewardRate <= 0 || stakingPeriod <= 0) return 0;
    
    const dailyRate = rewardRate / stakingPeriod;
    return ((1 + dailyRate) ** 365 - 1) * 100;
  }

  /**
   * Calculate TVL (Total Value Locked)
   */
  static calculateTVL(
    lpTokens: string,
    lpTokenPrice: number,
    additionalAssets: Array<{ amount: string; price: number }> = []
  ): number {
    const lpValue = parseFloat(lpTokens) * lpTokenPrice;
    const additionalValue = additionalAssets.reduce(
      (sum, asset) => sum + (parseFloat(asset.amount) * asset.price),
      0
    );
    
    return lpValue + additionalValue;
  }
}

/**
 * 🎯 Export all calculation classes
 */
export {
  PriceCalculations,
  LiquidityCalculations,
  VGRewardCalculations,
  PortfolioCalculations,
  FormatUtils,
  ValidationUtils,
  Web3Utils,
  AnalyticsCalculations,
}; 