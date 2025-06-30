/**
 * 🌐 Centralized RPC Endpoints Configuration
 * 
 * TECH HY Ecosystem - Browser-compatible RPC endpoints only
 * Priority: MetaMask provider > CORS-enabled public RPC endpoints
 */

// 🏆 Browser-compatible BSC Mainnet RPC endpoints (CORS enabled)
export const BSC_MAINNET_RPC_ENDPOINTS = [
  // ✅ Официальные BSC Mainnet эндпоинты (из docs.bnbchain.org)
  'https://bsc-dataseed.bnbchain.org',
  'https://bsc-dataseed-public.bnbchain.org',
  'https://bsc-dataseed.nariox.org',
  'https://bsc-dataseed.defibit.io',
  'https://bsc-dataseed.ninicoin.io',
  
  // ✅ Проверенные сторонние провайдеры (бесплатные, без API ключей)
  'https://bsc.publicnode.com',
  'https://bsc-rpc.publicnode.com',
  'https://bsc.drpc.org',
  'https://bnb.rpc.subquery.network/public',
  
  // ✅ Дополнительные надежные провайдеры
  'https://bsc.nodereal.io'
];

// 🏆 Browser-compatible BSC Testnet RPC endpoints (CORS enabled)
export const BSC_TESTNET_RPC_ENDPOINTS = [
  // ✅ Официальные BSC Testnet эндпоинты (из docs.bnbchain.org)
  'https://bsc-testnet-dataseed.bnbchain.org',
  'https://bsc-testnet.bnbchain.org',
  'https://bsc-prebsc-dataseed.bnbchain.org',
  
  // ✅ Проверенные сторонние провайдеры (бесплатные, без API ключей)
  'https://bsc-testnet-rpc.publicnode.com',
  'https://bsc-testnet.publicnode.com',
  'https://bsc-testnet.drpc.org',
  
  // ✅ Дополнительные надежные провайдеры
  'https://bsc-testnet.4everland.org/v1/97/public',
  'https://bsc-testnet-dataseed1.defibit.io',
  'https://bsc-testnet-dataseed1.ninicoin.io'
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

// 📊 RPC endpoint health monitoring (for browser environments)
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

// ✅ Browser environment check
export const isBrowserEnvironment = (): boolean => {
  return typeof window !== 'undefined';
};

// ✅ MetaMask availability check
export const hasMetaMask = (): boolean => {
  return isBrowserEnvironment() && 
         typeof window.ethereum !== 'undefined' && 
         window.ethereum.isMetaMask === true;
};

// Explicit functions for each network
export const getTestnetRpcEndpoints = (): string[] => BSC_TESTNET_RPC_ENDPOINTS;
export const getMainnetRpcEndpoints = (): string[] => BSC_MAINNET_RPC_ENDPOINTS; 