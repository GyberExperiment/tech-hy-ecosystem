import { getAllRpcEndpoints, getCurrentNetworkConfig } from './rpcEndpoints';

// BSC Testnet Configuration - Updated to use centralized RPC config
export const BSC_TESTNET = {
  chainId: 97,
  name: 'BSC Testnet',
  currency: 'tBNB',
  rpcUrl: getAllRpcEndpoints()[0], // ✅ publicnode.com primary
  fallbackRpcUrls: getAllRpcEndpoints(), // ✅ All centralized endpoints
  blockExplorer: 'https://testnet.bscscan.com',
};

// Contract Addresses (BSC Testnet Deployed)
export const CONTRACTS = {
  // Token Contracts
  VC_TOKEN: "0xC88eC091302Eb90e78a4CA361D083330752dfc9A",
  VG_TOKEN: "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d", 
  VG_TOKEN_VOTES: "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA",
  
  // LP and Staking - ИСПРАВЛЕНО: РЕАЛЬНЫЙ LP токен с ликвидностью
  LP_TOKEN: "0xA221093a37396c6301db4B24D55E1C871DF31d13", // ПРАВИЛЬНЫЙ VC/WBNB LP с 0.2 WBNB + 2000 VC резервами
  LP_LOCKER: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  
  // Governance
  GOVERNOR: "0x786133467f52813Ce0855023D4723A244524563E",
  TIMELOCK: "0x06EEB4c972c05BBEbf960Fec99f483dC95768e39",
  STAKING_DAO: "0x2269D0D279345526C30d694db1d94075450b6A99",
  
  // External - ИСПРАВЛЕНЫ: правильный router и factory
  PANCAKE_ROUTER: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3", // Реальный router из развертывания
  PANCAKE_FACTORY: "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc", // ПРАВИЛЬНЫЙ Factory с активным пулом
  WBNB: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
} as const;

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