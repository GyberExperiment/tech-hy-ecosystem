/**
 * 🌐 Centralized RPC Service
 * 
 * TECH HY Ecosystem - Proper DApp Architecture
 * Uses only MetaMask provider, no direct HTTP RPC calls
 */

import { ethers } from 'ethers';
import { getAllRpcEndpoints } from '../constants/rpcEndpoints';
import { log } from '../utils/logger';

// Singleton pattern for RPC service
class RpcService {
  private static instance: RpcService;
  private web3Provider: ethers.BrowserProvider | null = null;
  private fallbackProvider: ethers.JsonRpcProvider | null = null;

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
   * Get provider - prefer Web3 (MetaMask), fallback to read-only
   */
  async getProvider(): Promise<ethers.Provider> {
    // 1. Prefer MetaMask provider (proper DApp architecture)
    if (this.web3Provider) {
      return this.web3Provider;
    }

    // 2. Fallback to read-only provider for disconnected state
    if (!this.fallbackProvider) {
      const rpcEndpoints = getAllRpcEndpoints();
      this.fallbackProvider = new ethers.JsonRpcProvider(rpcEndpoints[0]);
      log.info('RPC Service: Created fallback provider', {
        component: 'RpcService',
        endpoint: rpcEndpoints[0]
      });
    }

    return this.fallbackProvider;
  }

  /**
   * Try multiple RPC endpoints with fallback
   */
  async withFallback<T>(
    operation: (provider: ethers.Provider) => Promise<T>
  ): Promise<T> {
    const provider = await this.getProvider();
    
    try {
      return await operation(provider);
    } catch (error) {
      log.error('RPC operation failed', {
        component: 'RpcService',
        function: 'withFallback'
      }, error as Error);

      // If using fallback provider, try other endpoints
      if (!this.web3Provider && this.fallbackProvider) {
        const rpcEndpoints = getAllRpcEndpoints();
        
        for (let i = 1; i < rpcEndpoints.length; i++) {
          try {
            const fallbackProvider = new ethers.JsonRpcProvider(rpcEndpoints[i]);
            const result = await operation(fallbackProvider);
            
            log.info('RPC fallback successful', {
              component: 'RpcService',
              endpoint: rpcEndpoints[i],
              attemptNumber: i + 1
            });
            
            return result;
          } catch (fallbackError) {
            log.warn('RPC fallback failed', {
              component: 'RpcService',
              endpoint: rpcEndpoints[i],
              error: (fallbackError as Error).message
            });
          }
        }
      }

      throw error;
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
}

export const rpcService = RpcService.getInstance(); 