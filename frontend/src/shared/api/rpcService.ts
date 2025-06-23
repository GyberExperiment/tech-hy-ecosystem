/**
 * 🌐 Centralized RPC Service
 * 
 * TECH HY Ecosystem - Proper DApp Architecture
 * Uses only MetaMask provider, no direct HTTP RPC calls
 */

import { ethers } from 'ethers';
import { getAllRpcEndpoints, RpcHealthMonitor } from '../config/rpcEndpoints';
import { log } from '../lib/logger';

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
   * ✅ ДОБАВЛЯЕМ опцию принудительного использования fallback для избежания rate limiting
   */
  async getProvider(forceReadOnly: boolean = false): Promise<ethers.Provider> {
    // ✅ НОВАЯ ЛОГИКА: Если forceReadOnly или MetaMask RPC проблематичен, используем fallback
    if (forceReadOnly || !this.web3Provider) {
    // 2. Fallback to read-only provider for disconnected state
      if (!this.primaryFallbackProvider) {
      const rpcEndpoints = getAllRpcEndpoints();
        this.primaryFallbackProvider = this.getFallbackProvider(rpcEndpoints[0]);
        log.info('RPC Service: Set primary fallback provider', {
        component: 'RpcService',
          endpoint: rpcEndpoints[0],
          reason: forceReadOnly ? 'forceReadOnly' : 'no_web3_provider'
      });
    }

      return this.primaryFallbackProvider;
    }

    // 1. Prefer MetaMask provider (proper DApp architecture)
    return this.web3Provider;
  }

  /**
   * Try multiple RPC endpoints with fallback and health monitoring
   * ✅ УЛУЧШЕННАЯ ЛОГИКА: При rate limiting переключаемся на read-only режим
   * ✅ БЛОКИРОВКА ПРОБЛЕМНЫХ ENDPOINTS
   */
  async withFallback<T>(
    operation: (provider: ethers.Provider) => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    let provider = await this.getProvider();
    
    // ✅ ПРИНУДИТЕЛЬНАЯ БЛОКИРОВКА blastapi.io
    if (this.isProblematicEndpoint(provider)) {
      log.warn('Detected problematic RPC endpoint, forcing read-only mode', {
        component: 'RpcService',
        function: 'withFallback',
        reason: 'blastapi_blocked'
      });
      provider = await this.getProvider(true); // Принудительно read-only
    }
    
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
      const errorMessage = (error as Error).message;
      
      // ✅ СПЕЦИАЛЬНАЯ ОБРАБОТКА: При rate limiting переключаемся на read-only
      if (errorMessage?.includes('429') || errorMessage?.includes('Too Many Requests')) {
        log.warn('RPC rate limiting detected, switching to read-only mode', {
          component: 'RpcService',
          function: 'withFallback',
          error: errorMessage,
          switchingToReadOnly: true
        });
        
        try {
          // Принудительно используем read-only провайдер
          const readOnlyProvider = await this.getProvider(true);
          const result = await withTimeout(operation(readOnlyProvider), timeoutMs);
          
          log.info('RPC Service: Read-only fallback successful', {
            component: 'RpcService',
            function: 'withFallback',
            mode: 'read-only'
          });
          
          return result;
        } catch (readOnlyError) {
          log.error('RPC Service: Read-only fallback also failed', {
            component: 'RpcService',
            function: 'withFallback',
            error: (readOnlyError as Error).message
          });
          // Продолжаем с обычной fallback логикой
        }
      }
      
      log.error('RPC operation failed with primary provider', {
        component: 'RpcService',
        function: 'withFallback',
        isWeb3Provider: !!this.web3Provider,
        error: errorMessage
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
   * ✅ НОВЫЙ МЕТОД: Get contract instance with read-only provider (избегает MetaMask RPC)
   */
  async getReadOnlyContract(
    address: string, 
    abi: any[]
  ): Promise<ethers.Contract> {
    const readOnlyProvider = await this.getProvider(true);
    return new ethers.Contract(address, abi, readOnlyProvider);
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

  /**
   * ✅ ПРОВЕРКА ПРОБЛЕМНЫХ RPC ENDPOINTS
   * Блокирует известные проблемные endpoints типа blastapi.io
   */
  private isProblematicEndpoint(provider: ethers.Provider): boolean {
    try {
      // Проверяем JsonRpcProvider
      if (provider instanceof ethers.JsonRpcProvider) {
        const url = (provider as any)._getConnection?.()?.url || '';
        
        // ✅ БЛОКИРУЕМ ИЗВЕСТНЫЕ ПРОБЛЕМНЫЕ ENDPOINTS
        const problematicDomains = [
          'blastapi.io',
          'blast-api.io', 
          'blast.api.io'
        ];
        
        const isProblematic = problematicDomains.some(domain => url.includes(domain));
        
        if (isProblematic) {
          log.warn('Blocked problematic RPC endpoint', {
            component: 'RpcService',
            function: 'isProblematicEndpoint',
            url: url,
            reason: 'rate_limiting_issues'
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      log.debug('Error checking problematic endpoint', {
        component: 'RpcService',
        function: 'isProblematicEndpoint',
        error: (error as Error).message
      });
      return false;
    }
  }
}

export const rpcService = RpcService.getInstance(); 