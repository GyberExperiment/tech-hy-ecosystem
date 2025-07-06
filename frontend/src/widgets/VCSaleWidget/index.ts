// VCSaleWidget Production-Ready Architecture
export { default as VCSaleWidget } from './ui/VCSaleWidget';

// Types
export type {
  VCSaleWidgetProps,
  SaleStats,
  UserStats,
  SecurityStatus,
  VCSaleState,
  VCSaleAction,
  VCSaleConfig,
  PurchaseParams,
  TransactionResult
} from './model/types';

// Services
export { VCSaleService } from './services/VCSaleService';

// Validation utilities
export {
  ValidationError,
  validateVCAmount,
  validateBNBBalance,
  validateNetwork,
  validateContractAddress,
  validateWalletAddress,
  sanitizeInput,
  formatSafeNumber,
  isValidTransaction,
  rateLimiter,
  safeParseEther,
  safeFormatEther,
  validateTransactionParams
} from './lib/validation';

// Constants and configuration
export {
  VCSALE_CONFIG,
  VCSALE_ABI,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SUPPORTED_NETWORKS,
  ANALYTICS_EVENTS,
  WIDGET_STYLES
} from './config/constants'; 