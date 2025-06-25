/**
 * 🌐 Centralized RPC Endpoints Configuration
 * 
 * TECH HY Ecosystem - Centralized management of all RPC endpoints
 * Priority: publicnode.com (most reliable) > fallback providers
 */

// 🏆 Primary RPC endpoints (most reliable)
export const BSC_MAINNET_RPC_ENDPOINTS = [
  'https://bsc-rpc.publicnode.com',           // ✅ publicnode.com - most reliable
  'https://bsc-dataseed.bnbchain.org',
  'https://bsc-dataseed1-defi.binance.org',
  'https://bsc-dataseed2-defi.binance.org',
  'https://bsc-rpc.publicnode.com',
  'https://endpoints.omniatech.io/v1/bsc/mainnet/public'
];

export const BSC_TESTNET_RPC_ENDPOINTS = [
  // ✅ Самые надежные endpoints (проверены на стабильность)
  'https://bsc-testnet-rpc.publicnode.com',        // ✅ publicnode.com - обычно самый надёжный
  'https://endpoints.omniatech.io/v1/bsc/testnet/public',  // ✅ omniatech - очень стабильный
  'https://bsc-testnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',  // ✅ NodeReal с API key
  
  // ✅ Официальные Binance endpoints
  'https://data-seed-prebsc-1-s1.binance.org:8545', 
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://data-seed-prebsc-1-s2.binance.org:8545',
  'https://data-seed-prebsc-2-s2.binance.org:8545',
  'https://data-seed-prebsc-1-s3.binance.org:8545',
  'https://data-seed-prebsc-2-s3.binance.org:8545',
  
  // ✅ Альтернативные провайдеры
  'https://bsc-testnet.drpc.org',
  'https://bsc-testnet-dataseed.bnbchain.org',
  'https://bsc-testnet.bnbchain.org',
  'https://bsc-testnet.public.blastapi.io',
  'https://bsc-testnet-rpc.publicnode.com',
  
  // ✅ Дополнительные backup endpoints
  'https://rpc.ankr.com/bsc_testnet_chapel',
  'https://bsc-testnet.blockpi.network/v1/rpc/public',
  'https://bsc-testnet-rpc.allthatnode.com',
  'https://1rpc.io/bnb-testnet',
  'https://bsctestapi.terminet.io/rpc'
];

// 🎯 Current network configuration
export const CURRENT_NETWORK = process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';

// 🔗 Get primary RPC endpoint for current network
export const getPrimaryRpcEndpoint = (): string => {
  const endpoints = CURRENT_NETWORK === 'mainnet' 
    ? BSC_MAINNET_RPC_ENDPOINTS
    : BSC_TESTNET_RPC_ENDPOINTS;
  
  if (endpoints.length === 0) {
    throw new Error(`No RPC endpoints configured for ${CURRENT_NETWORK}`);
  }
  
  return endpoints[0]!; // Non-null assertion since we checked length above
};

// 🔄 Get all RPC endpoints for current network (with fallbacks)
export const getAllRpcEndpoints = (): string[] => {
  // Check if we're targeting testnet (default for development)
  const isTestnet = process.env.NODE_ENV === 'development' || 
                   window.location.hostname.includes('stage') ||
                   window.location.hostname.includes('testnet');
  
  return isTestnet ? BSC_TESTNET_RPC_ENDPOINTS : BSC_MAINNET_RPC_ENDPOINTS;
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
    return healthyEndpoints[0]!; // Non-null assertion since we checked length above
  }
}

// Explicit functions for each network
export const getTestnetRpcEndpoints = (): string[] => BSC_TESTNET_RPC_ENDPOINTS;
export const getMainnetRpcEndpoints = (): string[] => BSC_MAINNET_RPC_ENDPOINTS; 