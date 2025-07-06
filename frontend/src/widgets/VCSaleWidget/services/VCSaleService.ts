import { ethers } from 'ethers';
import { VCSALE_ABI, VCSALE_CONFIG, ERROR_MESSAGES, ANALYTICS_EVENTS } from '../config/constants';
import { SaleStats, UserStats, SecurityStatus, PurchaseParams, TransactionResult } from '../model/types';
import { ValidationError, validateNetwork, validateContractAddress, validateVCAmount, validateTransactionParams, rateLimiter, safeParseEther, safeFormatEther } from '../lib/validation';
import { rpcService } from '../../../shared/api/rpcService';
import { log } from '../../../shared/lib/logger';

export class VCSaleService {
  private contractAddress: string;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(contractAddress: string) {
    validateContractAddress(contractAddress);
    this.contractAddress = contractAddress;
  }

  // Initialize with provider and signer
  public initialize(provider: ethers.Provider, signer?: ethers.Signer): void {
    this.provider = provider;
    this.signer = signer || null;
  }

  // Security validation before any operation
  private async validateSecurity(userAddress?: string): Promise<void> {
    if (!this.provider) {
      throw new ValidationError('Provider not initialized', 'NO_PROVIDER');
    }

    // Validate network
    const network = await this.provider.getNetwork();
    validateNetwork(Number(network.chainId));

    // Rate limiting
    if (userAddress && rateLimiter.isRateLimited(userAddress)) {
      throw new ValidationError(ERROR_MESSAGES.RATE_LIMITED, 'RATE_LIMITED');
    }

    // Contract existence check
    const code = await this.provider.getCode(this.contractAddress);
    if (code === '0x') {
      throw new ValidationError('Contract not found at address', 'NO_CONTRACT');
    }
  }

  // Get sale statistics
  public async getSaleStats(): Promise<SaleStats> {
    await this.validateSecurity();

    try {
      const statsData = await rpcService.withFallback(async (provider) => {
        const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, provider);
        return await (contract as any).getSaleStats();
      });

      return {
        totalVCAvailable: safeFormatEther(statsData[0]),
        totalVCSold: safeFormatEther(statsData[1]),
        currentVCBalance: safeFormatEther(statsData[2]),
        pricePerVC: statsData[3].toString(),
        saleActive: statsData[4],
        totalRevenue: safeFormatEther(statsData[5]),
        dailySalesAmount: safeFormatEther(statsData[6]),
        circuitBreakerActive: statsData[7],
        salesInCurrentWindow: safeFormatEther(statsData[8]),
        lastUpdated: Date.now(),
      };
    } catch (error) {
      this.logError('getSaleStats', error);
      throw new ValidationError(ERROR_MESSAGES.NETWORK_ERROR, 'STATS_FETCH_ERROR');
    }
  }

  // Get user statistics
  public async getUserStats(userAddress: string): Promise<UserStats> {
    await this.validateSecurity(userAddress);

    try {
      const [userStatsData, totalTxs] = await Promise.all([
        rpcService.withFallback(async (provider) => {
          const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, provider);
          return await (contract as any).getUserStats(userAddress);
        }),
        this.getUserTransactionCount(userAddress)
      ]);

      return {
        purchasedVC: safeFormatEther(userStatsData[0]),
        spentBNB: safeFormatEther(userStatsData[1]),
        lastPurchaseTimestamp: userStatsData[2].toString(),
        isBlacklisted: userStatsData[3],
        canPurchaseNext: userStatsData[4].toString(),
        totalTransactions: totalTxs,
      };
    } catch (error) {
      this.logError('getUserStats', error);
      throw new ValidationError(ERROR_MESSAGES.NETWORK_ERROR, 'USER_STATS_ERROR');
    }
  }

  // Get security status
  public async getSecurityStatus(userAddress: string): Promise<SecurityStatus> {
    await this.validateSecurity(userAddress);

    try {
      const [securityConfig, isPaused, isBlacklisted, userStats] = await Promise.all([
        rpcService.withFallback(async (provider) => {
          const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, provider);
          return await (contract as any).securityConfig();
        }),
        rpcService.withFallback(async (provider) => {
          const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, provider);
          return await (contract as any).paused();
        }),
        rpcService.withFallback(async (provider) => {
          const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, provider);
          return await (contract as any).blacklistedUsers(userAddress);
        }),
        this.getUserStats(userAddress)
      ]);

      const now = Math.floor(Date.now() / 1000);
      const canPurchaseNext = parseInt(userStats.canPurchaseNext);
      const nextPurchaseAvailable = canPurchaseNext > now ? new Date(canPurchaseNext * 1000) : null;

      return {
        mevProtectionEnabled: securityConfig[0],
        circuitBreakerActive: securityConfig[3],
        contractPaused: isPaused,
        userBlacklisted: isBlacklisted,
        rateLimited: now < canPurchaseNext,
        dailyLimitReached: false, // Will be determined by canPurchase call
        nextPurchaseAvailable,
      };
    } catch (error) {
      this.logError('getSecurityStatus', error);
      throw new ValidationError(ERROR_MESSAGES.NETWORK_ERROR, 'SECURITY_STATUS_ERROR');
    }
  }

  // Calculate BNB amount for VC purchase
  public async calculateBNBAmount(vcAmount: string): Promise<string> {
    validateVCAmount(vcAmount);
    await this.validateSecurity();

    try {
      const vcAmountWei = safeParseEther(vcAmount);
      
      const bnbAmountWei = await rpcService.withFallback(async (provider) => {
        const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, provider);
        return await (contract as any).calculateBNBAmount(vcAmountWei);
      });

      return safeFormatEther(bnbAmountWei);
    } catch (error) {
      this.logError('calculateBNBAmount', error);
      throw new ValidationError('Failed to calculate BNB amount', 'CALCULATION_ERROR');
    }
  }

  // Check if purchase is possible
  public async canPurchase(userAddress: string, vcAmount: string): Promise<{ canPurchase: boolean; reason?: string }> {
    validateVCAmount(vcAmount);
    await this.validateSecurity(userAddress);

    try {
      const vcAmountWei = safeParseEther(vcAmount);
      
      const [canPurchase, reason] = await rpcService.withFallback(async (provider) => {
        const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, provider);
        return await (contract as any).canPurchase(userAddress, vcAmountWei);
      });

      return { canPurchase, reason: canPurchase ? undefined : reason };
    } catch (error) {
      this.logError('canPurchase', error);
      return { canPurchase: false, reason: 'Network error' };
    }
  }

  // Execute purchase transaction
  public async executePurchase(params: PurchaseParams, userAddress: string): Promise<TransactionResult> {
    if (!this.signer) {
      throw new ValidationError('Signer not available', 'NO_SIGNER');
    }

    await this.validateSecurity(userAddress);
    validateVCAmount(params.vcAmount);

    this.trackEvent(ANALYTICS_EVENTS.PURCHASE_INITIATED, {
      vcAmount: params.vcAmount,
      expectedBnbAmount: params.expectedBnbAmount,
      userAddress
    });

    try {
      const vcAmountWei = safeParseEther(params.vcAmount);
      const expectedBnbWei = safeParseEther(params.expectedBnbAmount);
      
      // Add slippage protection
      const bnbWithBuffer = expectedBnbWei + (expectedBnbWei * BigInt(Math.floor(params.slippageTolerance * 100)) / 10000n);

      // Validate transaction parameters
      validateTransactionParams({
        to: this.contractAddress,
        value: bnbWithBuffer,
        gasLimit: params.gasLimit,
      });

      const contract = new ethers.Contract(this.contractAddress, VCSALE_ABI, this.signer);

      // Estimate gas if not provided
      let gasLimit = params.gasLimit;
      if (!gasLimit) {
        try {
          const estimatedGas = await (contract as any).estimateGas.purchaseVC(vcAmountWei, {
            value: bnbWithBuffer
          });
          gasLimit = estimatedGas + (estimatedGas * BigInt(20) / 100n); // 20% buffer
        } catch (gasError) {
          if (VCSALE_CONFIG.enableDebugLogs) {
            log.warn('Gas estimation failed, using fallback', { error: gasError });
          }
          gasLimit = 500000n; // Fallback
        }
      }

      // Execute transaction
      const tx = await (contract as any).purchaseVC(vcAmountWei, {
        value: bnbWithBuffer,
        gasLimit
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      const result: TransactionResult = {
        hash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed',
        vcAmount: params.vcAmount,
        bnbAmount: safeFormatEther(bnbWithBuffer),
        gasUsed: receipt.gasUsed.toString(),
      };

      if (result.status === 'success') {
        this.trackEvent(ANALYTICS_EVENTS.PURCHASE_SUCCESS, {
          ...result,
          userAddress
        });
      } else {
        result.error = 'Transaction failed';
        this.trackEvent(ANALYTICS_EVENTS.PURCHASE_FAILED, {
          ...result,
          userAddress
        });
      }

      return result;

    } catch (error: any) {
      this.logError('executePurchase', error);
      
      const result: TransactionResult = {
        hash: '',
        status: 'failed',
        vcAmount: params.vcAmount,
        bnbAmount: params.expectedBnbAmount,
        gasUsed: '0',
        error: this.getErrorMessage(error),
      };

      this.trackEvent(ANALYTICS_EVENTS.PURCHASE_FAILED, {
        ...result,
        userAddress,
        errorMessage: error.message
      });

      throw new ValidationError(result.error || ERROR_MESSAGES.TRANSACTION_FAILED, 'PURCHASE_FAILED');
    }
  }

  // Get user transaction count (for analytics)
  private async getUserTransactionCount(userAddress: string): Promise<number> {
    try {
      if (!this.provider) return 0;
      return await this.provider.getTransactionCount(userAddress);
    } catch {
      return 0;
    }
  }

  // Error message mapping
  private getErrorMessage(error: any): string {
    const message = error.message || error.toString();
    
    if (message.includes('Too frequent purchases')) {
      return ERROR_MESSAGES.RATE_LIMITED;
    }
    if (message.includes('insufficient funds')) {
      return ERROR_MESSAGES.INSUFFICIENT_BALANCE;
    }
    if (message.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    if (message.includes('Below minimum purchase')) {
      return ERROR_MESSAGES.AMOUNT_TOO_LOW;
    }
    if (message.includes('Above maximum purchase')) {
      return ERROR_MESSAGES.AMOUNT_TOO_HIGH;
    }
    
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Logging utility
  private logError(method: string, error: any): void {
    if (VCSALE_CONFIG.enableDebugLogs) {
      log.error(`VCSaleService.${method}`, {
        component: 'VCSaleService',
        method,
        contractAddress: this.contractAddress,
        error: error.message || error.toString()
      }, error);
    }
  }

  // Analytics tracking
  private trackEvent(event: string, data: any): void {
    if (VCSALE_CONFIG.enableAnalytics) {
      // Integration with your analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, data);
      }
      
      if (VCSALE_CONFIG.enableDebugLogs) {
        log.info(`Analytics: ${event}`, { event, data });
      }
    }
  }
} 