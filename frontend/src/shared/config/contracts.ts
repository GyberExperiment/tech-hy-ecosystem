import { getAllRpcEndpoints, getCurrentNetworkConfig } from './rpcEndpoints';

// Network Types
export type NetworkType = 'testnet' | 'mainnet';

// BSC Network Configurations
export const BSC_NETWORKS = {
  testnet: {
    chainId: 97,
    name: 'BSC Testnet',
    currency: 'tBNB',
    rpcUrl: getAllRpcEndpoints()[0],
    fallbackRpcUrls: getAllRpcEndpoints(),
    blockExplorer: 'https://testnet.bscscan.com',
  },
  mainnet: {
    chainId: 56,
    name: 'BSC Mainnet',
    currency: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    fallbackRpcUrls: [
      'https://bsc-dataseed1.binance.org/',
      'https://bsc-dataseed2.binance.org/',
      'https://bsc-dataseed3.binance.org/',
      'https://bsc.publicnode.com'
    ],
    blockExplorer: 'https://bscscan.com',
  }
} as const;

// ✅ TESTNET CONTRACT ADDRESSES (BSC Testnet Deployed)
const TESTNET_CONTRACTS = {
  // Token Contracts
  VC_TOKEN: "0xC88eC091302Eb90e78a4CA361D083330752dfc9A",
  VG_TOKEN: "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d", 
  VG_TOKEN_VOTES: "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA",
  
  // LP and Staking
  LP_TOKEN: "0xA221093a37396c6301db4B24D55E1C871DF31d13", // VC/WBNB LP с ликвидностью
  LP_LOCKER: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  VG_VAULT: "0x9269baba99cE0388Daf814E351b4d556fA728D32", // VG токены хранятся в LP_LOCKER
  
  // Governance
  GOVERNOR: "0x786133467f52813Ce0855023D4723A244524563E",
  TIMELOCK: "0x06EEB4c972c05BBEbf960Fec99f483dC95768e39",
  STAKING_DAO: "0x2269D0D279345526C30d694db1d94075450b6A99",
  
  // External (PancakeSwap Testnet)
  PANCAKE_ROUTER: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
  PANCAKE_FACTORY: "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc",
  WBNB: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
} as const;

// ✅ MAINNET CONTRACT ADDRESSES (BSC Mainnet - Real Tokens)
const MAINNET_CONTRACTS = {
  // ✅ Real Token Contracts (Mainnet BSC)
  VC_TOKEN: "0x1ea36ffe7e81fa21c18477741d2a75da3881e78e", // ✅ Real VC token mainnet
  VG_TOKEN: "0x3459ee77d6b6ed69a835b1faa77938fc2e4183a2", // ✅ Real VG token mainnet
  VG_TOKEN_VOTES: "0x0000000000000000000000000000000000000000", // ⚠️ TBD - to be deployed
  
  // ⚠️ Mainnet contracts to be deployed
  LP_TOKEN: "0x0000000000000000000000000000000000000000", // TBD - mainnet LP pair
  LP_LOCKER: "0x0000000000000000000000000000000000000000", // TBD - mainnet LP locker
  VG_VAULT: "0x0000000000000000000000000000000000000000", // TBD - will be same as LP_LOCKER
  
  // ⚠️ Governance contracts to be deployed
  GOVERNOR: "0x0000000000000000000000000000000000000000", // TBD
  TIMELOCK: "0x0000000000000000000000000000000000000000", // TBD
  STAKING_DAO: "0x0000000000000000000000000000000000000000", // TBD
  
  // ✅ External (PancakeSwap Mainnet)
  PANCAKE_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // Real PancakeSwap V2 Router
  PANCAKE_FACTORY: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", // Real PancakeSwap V2 Factory
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // Real WBNB mainnet
} as const;

// ✅ CURRENT NETWORK DETECTION
export const getCurrentNetwork = (): NetworkType => {
  // В production можно использовать переменные окружения
  const isMainnet = process.env.NODE_ENV === 'production' || 
                   process.env.REACT_APP_NETWORK === 'mainnet' ||
                   window.location.hostname.includes('app.') || // app.yourdomain.com
                   window.location.hostname === 'yourdomain.com';
  
  return isMainnet ? 'mainnet' : 'testnet';
};

// ✅ DYNAMIC CONTRACT SELECTION
export const CONTRACTS = getCurrentNetwork() === 'mainnet' ? MAINNET_CONTRACTS : TESTNET_CONTRACTS;

// ✅ CURRENT BSC NETWORK CONFIG
export const BSC_TESTNET = BSC_NETWORKS.testnet;
export const BSC_MAINNET = BSC_NETWORKS.mainnet;
export const CURRENT_BSC_NETWORK = BSC_NETWORKS[getCurrentNetwork()];

// Token Information - универсальная для обеих сетей
export const TOKEN_INFO = {
  VC: {
    name: "Venture Card",
    symbol: "VC",
    decimals: 18,
  },
  VG: {
    name: "Venture Gift", 
    symbol: "VG",
    decimals: 18,
  },
  VG_VOTES: {
    name: "Venture Gift Votes",
    symbol: "VGV",
    decimals: 18,
  },
  LP: {
    name: "VC-BNB LP Token",
    symbol: "VC-BNB LP",
    decimals: 18,
  },
  WBNB: {
    name: "Wrapped BNB",
    symbol: "WBNB",
    decimals: 18,
  },
} as const;

// LP Pool Configuration
export const LP_POOL_CONFIG = {
  TOKEN_A: CONTRACTS.VC_TOKEN,
  TOKEN_B: CONTRACTS.WBNB,
  LP_TOKEN: CONTRACTS.LP_TOKEN,
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  MAX_SLIPPAGE: 5.0, // 5%
  DEADLINE_MINUTES: 20, // 20 minutes
};

// PancakeSwap Configuration
export const PANCAKESWAP_CONFIG = {
  ROUTER: CONTRACTS.PANCAKE_ROUTER,
  FACTORY: CONTRACTS.PANCAKE_FACTORY,
  SWAP_FEE: 0.25, // 0.25%
  MINIMUM_LIQUIDITY: 1000, // Minimum liquidity units
};

// ✅ UTILITY FUNCTIONS
export const getNetworkInfo = () => ({
  currentNetwork: getCurrentNetwork(),
  chainId: CURRENT_BSC_NETWORK.chainId,
  networkName: CURRENT_BSC_NETWORK.name,
  blockExplorer: CURRENT_BSC_NETWORK.blockExplorer,
  isMainnet: getCurrentNetwork() === 'mainnet',
  isTestnet: getCurrentNetwork() === 'testnet'
});

export const getContractUrl = (address: string) => {
  return `${CURRENT_BSC_NETWORK.blockExplorer}/address/${address}`;
};

export const getTransactionUrl = (txHash: string) => {
  return `${CURRENT_BSC_NETWORK.blockExplorer}/tx/${txHash}`;
};

// ✅ NETWORK STATUS
export const NETWORK_STATUS = {
  testnet: {
    isReady: true,
    description: "Full ecosystem deployed and tested",
    features: ["LP Staking", "VG Rewards", "Governance", "All Features"]
  },
  mainnet: {
    isReady: false,
    description: "Tokens deployed, ecosystem contracts pending",
    features: ["VC Token ✅", "VG Token ✅", "LP Staking ⚠️", "Governance ⚠️"],
    nextSteps: [
      "Deploy LP_LOCKER contract",
      "Deploy Governance contracts", 
      "Create VC/WBNB liquidity pool",
      "Setup VG rewards system"
    ]
  }
} as const; 