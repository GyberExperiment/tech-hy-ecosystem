import { VCSaleConfig } from '../model/types';

// Production Configuration
export const VCSALE_CONFIG: VCSaleConfig = {
  autoRefreshInterval: 30000, // 30 seconds
  debounceDelay: 300, // 300ms for better UX
  gasLimitBuffer: 1.2, // 20% gas buffer
  priceBuffer: 1.01, // 1% price buffer
  maxRetries: 3,
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableDebugLogs: process.env.NODE_ENV === 'development',
};

// Contract ABI - Typed and Secure
export const VCSALE_ABI = [
  // Purchase functions
  "function purchaseVC(uint256 vcAmount) payable",
  "function calculateBNBAmount(uint256 vcAmount) view returns (uint256)",
  "function calculateVCAmount(uint256 bnbAmount) view returns (uint256)",
  
  // View functions
  "function getSaleStats() view returns (uint256, uint256, uint256, uint256, bool, uint256, uint256, bool, uint256)",
  "function getUserStats(address user) view returns (uint256, uint256, uint256, bool, uint256)",
  "function canPurchase(address user, uint256 vcAmount) view returns (bool, string)",
  
  // Configuration
  "function saleConfig() view returns (address, uint256, uint256, uint256, uint256, uint256, bool, address, uint256, uint256, uint256)",
  "function securityConfig() view returns (bool, uint256, uint256, bool, uint256, uint256)",
  "function circuitBreaker() view returns (uint256, uint256, bool, uint256)",
  
  // Security
  "function paused() view returns (bool)",
  "function blacklistedUsers(address) view returns (bool)",
  
  // Events
  "event VCPurchased(address indexed buyer, uint256 vcAmount, uint256 bnbAmount, uint256 pricePerVC, uint256 timestamp, bytes32 indexed purchaseId)",
  "event SecurityEvent(address indexed user, string indexed eventType, string description, uint256 timestamp)",
  "event CircuitBreakerTriggered(uint256 salesAmount, uint256 threshold, uint256 timestamp)"
] as const;

// Input validation constants
export const VALIDATION_RULES = {
  MIN_VC_AMOUNT: 1,
  MAX_VC_AMOUNT: 1000,
  MIN_BNB_AMOUNT: 0.001,
  MAX_BNB_AMOUNT: 1,
  DECIMAL_PLACES: 6,
  SAFE_INTEGER_LIMIT: Number.MAX_SAFE_INTEGER / 1e18, // For Wei calculations
} as const;

// Error messages - Internationalization ready
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  INVALID_AMOUNT: 'Invalid amount entered',
  AMOUNT_TOO_LOW: `Minimum purchase: ${VALIDATION_RULES.MIN_VC_AMOUNT} VC`,
  AMOUNT_TOO_HIGH: `Maximum purchase: ${VALIDATION_RULES.MAX_VC_AMOUNT} VC`,
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  SALE_INACTIVE: 'Sale is currently inactive',
  CONTRACT_PAUSED: 'Contract is paused',
  USER_BLACKLISTED: 'Account is restricted',
  CIRCUIT_BREAKER: 'Circuit breaker is active',
  RATE_LIMITED: 'Too many requests, please wait',
  NETWORK_ERROR: 'Network connection error',
  TRANSACTION_FAILED: 'Transaction failed',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PURCHASE_SUCCESS: 'VC tokens purchased successfully!',
  DATA_REFRESHED: 'Data refreshed successfully',
} as const;

// Network validation
export const SUPPORTED_NETWORKS = {
  BSC_MAINNET: 56,
  BSC_TESTNET: 97,
} as const;

// Analytics events
export const ANALYTICS_EVENTS = {
  WIDGET_VIEWED: 'vcsale_widget_viewed',
  PURCHASE_INITIATED: 'vcsale_purchase_initiated',
  PURCHASE_SUCCESS: 'vcsale_purchase_success',
  PURCHASE_FAILED: 'vcsale_purchase_failed',
  DATA_REFRESH: 'vcsale_data_refresh',
  ERROR_OCCURRED: 'vcsale_error_occurred',
} as const;

// CSS classes for consistency
export const WIDGET_STYLES = {
  CARD_BASE: 'card-ultra animate-enhanced-widget-chaos-1',
  GRADIENT_PRIMARY: 'bg-gradient-to-br from-yellow-500/80 to-orange-600/80',
  GRADIENT_SECONDARY: 'bg-gradient-to-br from-blue-500/8 via-blue-400/5 to-cyan-400/4',
  HOVER_EFFECTS: 'hover:shadow-lg transition-all duration-300',
  LOADING_SKELETON: 'animate-pulse bg-gray-400/20 rounded',
} as const; 