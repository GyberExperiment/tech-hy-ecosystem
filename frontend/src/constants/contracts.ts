// Environment-based BSC Configuration
export const BSC_CONFIG = {
  chainId: Number(import.meta.env.VITE_BSC_CHAIN_ID) || 97,
  name: import.meta.env.VITE_BSC_CHAIN_ID === '56' ? 'BSC Mainnet' : 'BSC Testnet',
  currency: import.meta.env.VITE_BSC_CHAIN_ID === '56' ? 'BNB' : 'tBNB',
  rpcUrl: import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-testnet-rpc.publicnode.com',
  fallbackRpcUrls: import.meta.env.VITE_BSC_CHAIN_ID === '56' ? [
    'https://bsc-dataseed.binance.org/',
    'https://bsc-dataseed1.binance.org/',
    'https://bsc-dataseed2.binance.org/',
    'https://rpc.ankr.com/bsc',
  ] : [
    'https://bsc-testnet-rpc.publicnode.com',
    'https://bsc-testnet.public.blastapi.io',
    'https://endpoints.omniatech.io/v1/bsc/testnet/public',
    'https://bsc-testnet.blockpi.network/v1/rpc/public',
  ],
  blockExplorer: import.meta.env.VITE_BSC_CHAIN_ID === '56' 
    ? 'https://bscscan.com' 
    : 'https://testnet.bscscan.com',
};

// Legacy compatibility
export const BSC_TESTNET = BSC_CONFIG;

// Contract Addresses (Environment-based)
export const CONTRACTS = {
  // Token Contracts
  VC_TOKEN: import.meta.env.VITE_VC_TOKEN || "0xC88eC091302Eb90e78a4CA361D083330752dfc9A",
  VG_TOKEN: import.meta.env.VITE_VG_TOKEN || "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d", 
  VG_TOKEN_VOTES: "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA", // Not environment-specific yet
  
  // LP and Staking
  LP_TOKEN: import.meta.env.VITE_LP_TOKEN || "0xA221093a37396c6301db4B24D55E1C871DF31d13",
  LP_LOCKER: import.meta.env.VITE_LP_LOCKER || "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  
  // Governance
  GOVERNOR: import.meta.env.VITE_GOVERNOR || "0x786133467f52813Ce0855023D4723A244524563E",
  TIMELOCK: import.meta.env.VITE_TIMELOCK || "0x06EEB4c972c05BBEbf960Fec99f483dC95768e39",
  STAKING_DAO: "0x2269D0D279345526C30d694db1d94075450b6A99", // Not environment-specific yet
  
  // External (PancakeSwap)
  PANCAKE_ROUTER: import.meta.env.VITE_PANCAKE_ROUTER || "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
  PANCAKE_FACTORY: import.meta.env.VITE_PANCAKE_FACTORY || "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc",
  WBNB: import.meta.env.VITE_WBNB || "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
} as const;

// Brand Configuration (Environment-based)
export const BRAND_CONFIG = {
  name: import.meta.env.VITE_BRAND_NAME || "TECH HY Ecosystem",
  url: import.meta.env.VITE_BRAND_URL || "https://techhy.me",
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "i@techhy.me",
};

// Environment Information
export const ENV_CONFIG = {
  environment: import.meta.env.VITE_ENVIRONMENT || "development",
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

// Token Information
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