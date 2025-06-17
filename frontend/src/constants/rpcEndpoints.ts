/**
 * 🌐 Centralized RPC Endpoints Configuration
 * 
 * TECH HY Ecosystem - Centralized management of all RPC endpoints
 * Priority: publicnode.com (most reliable) > fallback providers
 */

// 🏆 Primary RPC endpoints (most reliable)
export const BSC_MAINNET_RPC_ENDPOINTS = [
  'https://bsc-rpc.publicnode.com',           // ✅ publicnode.com - most reliable
  'https://bsc-dataseed.binance.org/',        // ✅ Binance official - backup
  'https://rpc.ankr.com/bsc',                 // ✅ Ankr - backup
];

export const BSC_TESTNET_RPC_ENDPOINTS = [
  'https://bsc-testnet-rpc.publicnode.com',   // ✅ publicnode.com - most reliable
  'https://data-seed-prebsc-1-s1.binance.org:8545', // ✅ Binance testnet - backup
  'https://bsc-testnet.public.blastapi.io',   // ⚠️ blastapi.io - last resort (rate limited)
];

// 🎯 Current network configuration
export const CURRENT_NETWORK = process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';

// 🔗 Get primary RPC endpoint for current network
export const getPrimaryRpcEndpoint = (): string => {
  return CURRENT_NETWORK === 'mainnet' 
    ? BSC_MAINNET_RPC_ENDPOINTS[0]
    : BSC_TESTNET_RPC_ENDPOINTS[0];
};

// 🔄 Get all RPC endpoints for current network (with fallbacks)
export const getAllRpcEndpoints = (): string[] => {
  return CURRENT_NETWORK === 'mainnet' 
    ? BSC_MAINNET_RPC_ENDPOINTS
    : BSC_TESTNET_RPC_ENDPOINTS;
};

// 🌍 Network configuration
export const NETWORK_CONFIG = {
  mainnet: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrls: BSC_MAINNET_RPC_ENDPOINTS,
    blockExplorerUrls: ['https://bscscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  testnet: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrls: BSC_TESTNET_RPC_ENDPOINTS,
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    },
  },
};

// 🚀 Get current network config
export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[CURRENT_NETWORK];
};

// 📊 RPC endpoint health monitoring
export class RpcHealthMonitor {
  private static failureCount = new Map<string, number>();
  private static lastSuccess = new Map<string, number>();
  
  static markFailure(endpoint: string) {
    const currentCount = this.failureCount.get(endpoint) || 0;
    this.failureCount.set(endpoint, currentCount + 1);
    console.warn(`🚨 RPC endpoint ${endpoint} failed. Failure count: ${currentCount + 1}`);
  }
  
  static markSuccess(endpoint: string) {
    this.failureCount.set(endpoint, 0);
    this.lastSuccess.set(endpoint, Date.now());
    console.log(`✅ RPC endpoint ${endpoint} working correctly`);
  }
  
  static getHealthyEndpoints(): string[] {
    const allEndpoints = getAllRpcEndpoints();
    return allEndpoints.filter(endpoint => {
      const failures = this.failureCount.get(endpoint) || 0;
      return failures < 3; // Exclude endpoints with 3+ consecutive failures
    });
  }
  
  static getBestEndpoint(): string {
    const healthyEndpoints = this.getHealthyEndpoints();
    if (healthyEndpoints.length === 0) {
      console.warn('⚠️ All RPC endpoints unhealthy, using primary');
      return getPrimaryRpcEndpoint();
    }
    return healthyEndpoints[0];
  }
} 