/**
 * 🌐 Centralized RPC Service
 * 
 * TECH HY Ecosystem - Proper DApp Architecture
 * Uses only MetaMask provider, no direct HTTP RPC calls
 */

import { ethers } from 'ethers';
import { getAllRpcEndpoints, RpcHealthMonitor } from '../constants/rpcEndpoints';
import { log } from '../utils/logger';

// ✅ ДОБАВЛЯЕМ Network import для staticNetwork конфигурации
const BSC_TESTNET_NETWORK = ethers.Network.from({
  chainId: 97,
  name: 'bsc-testnet'
});

// Singleton pattern for RPC service
class RpcService {
  private static instance: RpcService;
  private web3Provider: ethers.BrowserProvider | null = null;
  private fallbackProviders: Map<string, ethers.JsonRpcProvider> = new Map();
  private primaryFallbackProvider: ethers.JsonRpcProvider | null = null;

  private constructor() {}

  static getInstance(): RpcService {
    if (!RpcService.instance) {
      RpcService.instance = new RpcService();
    }
    return RpcService.instance;
  }

  /**
   * Set Web3 provider from Web3Context (MetaMask)
   */
  setWeb3Provider(provider: ethers.BrowserProvider | null) {
    this.web3Provider = provider;
    log.info('RPC Service: Web3 provider updated', {
      component: 'RpcService',
      hasProvider: !!provider
    });
  }

  /**
   * Get or create fallback provider for specific endpoint
   * ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Добавлен staticNetwork параметр
   */
  private getFallbackProvider(rpcUrl: string): ethers.JsonRpcProvider {
    if (!this.fallbackProviders.has(rpcUrl)) {
      // ✅ РЕШЕНИЕ: staticNetwork предотвращает автоматические eth_chainId запросы!
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_TESTNET_NETWORK, {
        staticNetwork: BSC_TESTNET_NETWORK
      });
      this.fallbackProviders.set(rpcUrl, provider);
      log.debug('RPC Service: Created new fallback provider with staticNetwork', {
        component: 'RpcService',
        endpoint: rpcUrl,
        network: 'BSC Testnet (97)'
      });
    }
    return this.fallbackProviders.get(rpcUrl)!;
  }

  /**
   * Get provider - prefer Web3 (MetaMask), fallback to read-only
   */
  async getProvider(): Promise<ethers.Provider> {
    // 1. Prefer MetaMask provider (proper DApp architecture)
    if (this.web3Provider) {
      return this.web3Provider;
    }

    // 2. Fallback to read-only provider for disconnected state
    if (!this.primaryFallbackProvider) {
      const rpcEndpoints = getAllRpcEndpoints();
      this.primaryFallbackProvider = this.getFallbackProvider(rpcEndpoints[0]);
      log.info('RPC Service: Set primary fallback provider', {
        component: 'RpcService',
        endpoint: rpcEndpoints[0]
      });
    }

    return this.primaryFallbackProvider;
  }

  /**
   * Try multiple RPC endpoints with fallback and health monitoring
   */
  async withFallback<T>(
    operation: (provider: ethers.Provider) => Promise<T>,
    timeoutMs: number = 15000
  ): Promise<T> {
    const provider = await this.getProvider();
    
    // Helper function for timeout
    const withTimeout = <T>(promise: Promise<T>, timeout: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout)
        )
      ]);
    };
    
    try {
      const result = await withTimeout(operation(provider), timeoutMs);
      
      // Mark success if using fallback provider
      if (!this.web3Provider && this.primaryFallbackProvider) {
        const rpcEndpoints = getAllRpcEndpoints();
        RpcHealthMonitor.markSuccess(rpcEndpoints[0]);
      }
      
      return result;
    } catch (error) {
      log.error('RPC operation failed with primary provider', {
        component: 'RpcService',
        function: 'withFallback',
        isWeb3Provider: !!this.web3Provider,
        error: (error as Error).message
      }, error as Error);

      // If using Web3 provider, don't try fallbacks (user should handle wallet issues)
      if (this.web3Provider) {
        throw error;
      }

      // Try other endpoints only if using fallback providers
      const rpcEndpoints = getAllRpcEndpoints();
      
      // Mark primary endpoint failure
      RpcHealthMonitor.markFailure(rpcEndpoints[0]);
      
      let lastError = error;
      
      for (let i = 1; i < rpcEndpoints.length; i++) {
        const rpcUrl = rpcEndpoints[i];
        
        try {
          log.debug('RPC Service: Trying fallback endpoint', {
            component: 'RpcService',
            function: 'withFallback',
            endpoint: rpcUrl,
            attemptNumber: i + 1
          });
          
          // Add delay between attempts to avoid rate limiting
          if (i > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * i));
          }
          
          const fallbackProvider = this.getFallbackProvider(rpcUrl);
          const result = await withTimeout(operation(fallbackProvider), timeoutMs);
          
          log.info('RPC Service: Fallback successful', {
            component: 'RpcService',
            function: 'withFallback',
            endpoint: rpcUrl,
            attemptNumber: i + 1
          });
          
          // Mark success and update primary provider
          RpcHealthMonitor.markSuccess(rpcUrl);
          this.primaryFallbackProvider = fallbackProvider;
          
          return result;
        } catch (fallbackError) {
          log.warn('RPC Service: Fallback failed', {
            component: 'RpcService',
            function: 'withFallback',
            endpoint: rpcUrl,
            error: (fallbackError as Error).message
          });
          
          RpcHealthMonitor.markFailure(rpcUrl);
          lastError = fallbackError;
          
          // Extra delay after rate limiting errors
          if ((fallbackError as Error).message?.includes('429') || 
              (fallbackError as Error).message?.includes('Too Many Requests')) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }

      throw lastError;
    }
  }

  /**
   * Get contract instance with proper provider
   */
  async getContract(
    address: string, 
    abi: any[], 
    needsSigner: boolean = false
  ): Promise<ethers.Contract> {
    const provider = await this.getProvider();

    if (needsSigner && this.web3Provider) {
      const signer = await this.web3Provider.getSigner();
      return new ethers.Contract(address, abi, signer);
    }

    return new ethers.Contract(address, abi, provider);
  }

  /**
   * Check if Web3 provider is available
   */
  hasWeb3Provider(): boolean {
    return !!this.web3Provider;
  }

  /**
   * Clean up providers (useful for testing/reset)
   */
  cleanup(): void {
    this.fallbackProviders.clear();
    this.primaryFallbackProvider = null;
    log.info('RPC Service: Cleaned up fallback providers', {
      component: 'RpcService',
      function: 'cleanup'
    });
  }
}

export const rpcService = RpcService.getInstance(); 