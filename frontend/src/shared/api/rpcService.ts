/**
 * 🌐 Centralized RPC Service
 * 
 * TECH HY Ecosystem - Browser-optimized DApp Architecture
 * Priority: MetaMask provider > CORS-enabled RPC endpoints
 */

import { ethers } from 'ethers';
import { getAllRpcEndpoints, hasMetaMask, isBrowserEnvironment } from '../config/rpcEndpoints';
import { log } from '../lib/logger';

// ✅ Optimized timeouts for browser environment
const RPC_TIMEOUT = 5000; // 5 seconds for browser requests
const MAX_RETRIES = 2; // Reduced retries for faster UX
const REQUEST_DEBOUNCE_TIME = 100; // 100ms between requests
const MAX_CONCURRENT_REQUESTS = 3; // Maximum 3 concurrent requests

// ✅ BSC Testnet Network Configuration
const BSC_TESTNET_NETWORK = ethers.Network.from({
  chainId: 97,
  name: 'bsc-testnet'
});

interface ProviderInfo {
  url: string;
  provider: ethers.JsonRpcProvider;
  isHealthy: boolean;
  consecutiveErrors: number;
  lastErrorTime: number;
  requestCount: number;
  lastRequestTime: number;
}

class OptimizedRpcService {
  private providers: ProviderInfo[] = [];
  private currentProviderIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private activeRequests = 0;
  private requestQueue: Array<() => void> = [];
  private web3Provider: ethers.BrowserProvider | null = null;

  constructor() {
    this.initializeProviders();
    // ✅ Start health checking only after initialization completes
    if (isBrowserEnvironment()) {
      // Defer health checking to avoid startup spam
      setTimeout(() => this.startHealthChecking(), 5000);
    }
  }

  private initializeProviders() {
    const endpoints = getAllRpcEndpoints();
    
    log.info('RpcService: Initializing fallback providers', {
      component: 'RpcService',
      hasMetaMask: hasMetaMask(),
      endpointCount: endpoints.length
    });
    
    this.providers = endpoints.map(url => ({
      url,
      provider: new ethers.JsonRpcProvider(url, BSC_TESTNET_NETWORK, {
        staticNetwork: BSC_TESTNET_NETWORK,
        batchMaxCount: 1,
        batchMaxSize: 1024,
        batchStallTime: 10,
        polling: false, // ✅ Disable polling for browser
        pollingInterval: 30000, // Longer interval for browser
      }),
      isHealthy: true,
      consecutiveErrors: 0,
      lastErrorTime: 0,
      requestCount: 0,
      lastRequestTime: 0
    }));

    // ✅ Set timeouts on providers
    this.providers.forEach(providerInfo => {
      const provider = providerInfo.provider;
      
      // Custom timeout handling for browser
      const originalSend = provider.send.bind(provider);
      provider.send = async (method: string, params: any[]): Promise<any> => {
        return Promise.race([
          originalSend(method, params),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), RPC_TIMEOUT)
          )
        ]);
      };
    });

    log.info('RpcService: Initialized browser-compatible providers', {
      component: 'RpcService',
      providerCount: this.providers.length,
      endpoints: endpoints
    });
  }

  private startHealthChecking() {
    // ✅ Start health checking for fallback providers
    this.healthCheckInterval = setInterval(() => {
      this.checkProvidersHealth();
    }, 60000); // Check every minute for browser
  }

  private async checkProvidersHealth() {
    if (this.providers.length === 0) return;

    log.debug('RpcService: Starting health check for providers', {
      component: 'RpcService',
      providerCount: this.providers.length
    });

    const healthPromises = this.providers.map(async (providerInfo, index) => {
      try {
        const start = Date.now();
        await providerInfo.provider.getBlockNumber();
        const responseTime = Date.now() - start;
        
        if (responseTime < 3000) { // 3 second threshold for browser
          providerInfo.isHealthy = true;
          providerInfo.consecutiveErrors = 0;
        }
        
        log.debug('Provider health check passed', {
          component: 'RpcService',
          providerIndex: index,
          url: providerInfo.url,
          responseTime
        });
      } catch (error) {
        providerInfo.consecutiveErrors++;
        providerInfo.lastErrorTime = Date.now();
        
        if (providerInfo.consecutiveErrors >= 2) {
          providerInfo.isHealthy = false;
        }
        
        log.warn('Provider health check failed', {
          component: 'RpcService',
          providerIndex: index,
          url: providerInfo.url,
          consecutiveErrors: providerInfo.consecutiveErrors,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.allSettled(healthPromises);
  }

  private getNextHealthyProvider(): ProviderInfo | null {
    if (this.providers.length === 0) return null;

    const healthyProviders = this.providers.filter(p => p.isHealthy);
    
    if (healthyProviders.length === 0) {
      // ✅ Reset all to healthy if none available
      log.warn('No healthy providers available, resetting all', {
        component: 'RpcService'
      });
      this.providers.forEach(p => {
        p.isHealthy = true;
        p.consecutiveErrors = 0;
      });
      return this.providers[0] || null;
    }

    // ✅ Round-robin among healthy providers
    const providerInfo = healthyProviders[this.currentProviderIndex % healthyProviders.length];
    this.currentProviderIndex++;
    
    return providerInfo;
  }

  private async rateLimitRequest(): Promise<void> {
    return new Promise(resolve => {
      if (this.activeRequests >= MAX_CONCURRENT_REQUESTS) {
        this.requestQueue.push(resolve);
      } else {
        this.activeRequests++;
        resolve();
      }
    });
  }

  private releaseRequest(): void {
    this.activeRequests--;
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        this.activeRequests++;
        nextRequest();
      }
    }
  }

  async withFallback<T>(
    operation: (provider: ethers.JsonRpcProvider) => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    // ✅ Rate limiting protection
    await this.rateLimitRequest();
    
    let lastError: Error | null = null;
    let attemptsCount = 0;

    try {
      // ✅ Check if we have any providers initialized
      if (this.providers.length === 0) {
        throw new Error('No RPC providers configured for fallback operations');
      }

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const providerInfo = this.getNextHealthyProvider();
        
        if (!providerInfo) {
          throw new Error('No healthy RPC providers available');
        }

        attemptsCount++;
        const startTime = Date.now();

        try {
          // ✅ Request debouncing
          const timeSinceLastRequest = Date.now() - providerInfo.lastRequestTime;
          if (timeSinceLastRequest < REQUEST_DEBOUNCE_TIME) {
            await new Promise(resolve => 
              setTimeout(resolve, REQUEST_DEBOUNCE_TIME - timeSinceLastRequest)
            );
          }

          providerInfo.lastRequestTime = Date.now();
          providerInfo.requestCount++;

          log.debug('Executing RPC operation', {
            component: 'RpcService',
            attempt: attempt + 1,
            maxRetries,
            providerUrl: providerInfo.url,
            requestCount: providerInfo.requestCount
          });

          const result = await operation(providerInfo.provider);
          const responseTime = Date.now() - startTime;

          log.debug('RPC operation successful', {
            component: 'RpcService',
            attempt: attempt + 1,
            providerUrl: providerInfo.url,
            responseTime,
            totalAttempts: attemptsCount
          });

          // ✅ Reset error count on success
          providerInfo.consecutiveErrors = 0;
          
          return result;

        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // ✅ Mark provider as problematic
          providerInfo.consecutiveErrors++;
          providerInfo.lastErrorTime = Date.now();
          
          // ✅ Immediate health status update for critical errors
          if (error.message.includes('429') || 
              error.message.includes('rate limit') ||
              error.message.includes('timeout') ||
              error.message.includes('CORS') ||
              responseTime >= RPC_TIMEOUT) {
            providerInfo.isHealthy = false;
          }

          log.warn('RPC operation failed', {
            component: 'RpcService',
            attempt: attempt + 1,
            maxRetries,
            providerUrl: providerInfo.url,
            responseTime,
            error: lastError.message,
            consecutiveErrors: providerInfo.consecutiveErrors
          });

          // ✅ Quick retry for rate limiting (with delay)
          if (error.message.includes('429') && attempt < maxRetries - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 3000); // Max 3s for browser
            log.info('Rate limited, waiting before retry', {
              component: 'RpcService',
              delay,
              providerUrl: providerInfo.url
            });
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // ✅ All attempts failed
      const errorMessage = lastError ? lastError.message : 'All RPC providers failed';
      
      log.error('All RPC fallback attempts failed', {
        component: 'RpcService',
        totalAttempts: attemptsCount,
        maxRetries,
        lastError: errorMessage,
        healthyProviders: this.providers.filter(p => p.isHealthy).length
      });

      throw new Error(`RPC operation failed after ${attemptsCount} attempts: ${errorMessage}`);
      
    } finally {
      this.releaseRequest();
    }
  }

  // ✅ Web3 provider management
  setWeb3Provider(provider: ethers.BrowserProvider | null) {
    this.web3Provider = provider;
    log.info('RPC Service: Web3 provider updated', {
      component: 'RpcService',
      hasProvider: !!provider
    });
  }

  async getProvider(forceReadOnly: boolean = false): Promise<ethers.Provider> {
    // ✅ For write operations, prioritize MetaMask if connected and on correct network
    if (!forceReadOnly && this.web3Provider && isBrowserEnvironment()) {
      try {
        // Test if the provider is actually working
        await this.web3Provider.getNetwork();
        return this.web3Provider;
      } catch (error) {
        log.warn('MetaMask provider not working, falling back to RPC', {
          component: 'RpcService',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // ✅ Fallback to RPC providers for read operations
    const healthyProvider = this.getNextHealthyProvider();
    if (healthyProvider) {
      return healthyProvider.provider;
    }
    
    // ✅ Last resort: return first provider if available
    if (this.providers.length > 0) {
      return this.providers[0].provider;
    }
    
    throw new Error('No providers available for read operations');
  }

  async getContract(
    address: string, 
    abi: any[], 
    needsSigner: boolean = false
  ): Promise<ethers.Contract> {
    if (needsSigner && this.web3Provider) {
      try {
        const signer = await this.web3Provider.getSigner();
        return new ethers.Contract(address, abi, signer);
      } catch (error) {
        throw new Error(`Failed to get signer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const provider = await this.getProvider(true); // Force read-only for contract calls
    return new ethers.Contract(address, abi, provider);
  }

  async getReadOnlyContract(
    address: string, 
    abi: any[]
  ): Promise<ethers.Contract> {
    const readOnlyProvider = await this.getProvider(true);
    return new ethers.Contract(address, abi, readOnlyProvider);
  }

  hasWeb3Provider(): boolean {
    return !!this.web3Provider;
  }

  // ✅ Utility methods
  getProviderStats() {
    return {
      hasMetaMask: hasMetaMask(),
      hasWeb3Provider: this.hasWeb3Provider(),
      fallbackProviders: this.providers.map(p => ({
        url: p.url,
        isHealthy: p.isHealthy,
        consecutiveErrors: p.consecutiveErrors,
        requestCount: p.requestCount,
        lastErrorTime: p.lastErrorTime
      })),
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length
    };
  }

  resetProviderHealth(providerUrl?: string) {
    if (providerUrl) {
      const provider = this.providers.find(p => p.url === providerUrl);
      if (provider) {
        provider.isHealthy = true;
        provider.consecutiveErrors = 0;
        provider.lastErrorTime = 0;
      }
    } else {
      this.providers.forEach(p => {
        p.isHealthy = true;
        p.consecutiveErrors = 0;
        p.lastErrorTime = 0;
      });
    }
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.providers.forEach(p => {
      p.provider.destroy();
    });
  }
}

// ✅ Export singleton instance
export const rpcService = new OptimizedRpcService();

// ✅ Export for testing/debugging
export { OptimizedRpcService }; 