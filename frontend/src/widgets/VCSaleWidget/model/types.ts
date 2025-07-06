// VCSale Widget Types - Production Ready
export interface VCSaleWidgetProps {
  className?: string;
  onPurchaseSuccess?: (txHash: string, amount: string) => void;
  onError?: (error: Error) => void;
}

export interface SaleStats {
  totalVCAvailable: string;
  totalVCSold: string;
  currentVCBalance: string;
  pricePerVC: string;
  saleActive: boolean;
  totalRevenue: string;
  dailySalesAmount: string;
  circuitBreakerActive: boolean;
  salesInCurrentWindow: string;
  lastUpdated: number; // timestamp
}

export interface UserStats {
  purchasedVC: string;
  spentBNB: string;
  lastPurchaseTimestamp: string;
  isBlacklisted: boolean;
  canPurchaseNext: string;
  totalTransactions: number;
}

export interface SecurityStatus {
  mevProtectionEnabled: boolean;
  circuitBreakerActive: boolean;
  contractPaused: boolean;
  userBlacklisted: boolean;
  rateLimited: boolean;
  dailyLimitReached: boolean;
  nextPurchaseAvailable: Date | null;
}

export interface VCSaleState {
  // Data
  saleStats: SaleStats | null;
  userStats: UserStats | null;
  securityStatus: SecurityStatus;
  
  // UI State
  vcAmount: string;
  bnbAmount: string;
  
  // Loading States
  isLoading: boolean;
  isDataLoading: boolean;
  isRefreshing: boolean;
  
  // Error States
  error: string | null;
  lastRefresh: number;
}

export type VCSaleAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_VC_AMOUNT'; payload: string }
  | { type: 'SET_BNB_AMOUNT'; payload: string }
  | { type: 'SET_SALE_STATS'; payload: SaleStats }
  | { type: 'SET_USER_STATS'; payload: UserStats }
  | { type: 'SET_SECURITY_STATUS'; payload: SecurityStatus }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FORM' }
  | { type: 'REFRESH_SUCCESS' };

export interface VCSaleConfig {
  autoRefreshInterval: number;
  debounceDelay: number;
  gasLimitBuffer: number;
  priceBuffer: number;
  maxRetries: number;
  enableAnalytics: boolean;
  enableDebugLogs: boolean;
}

export interface PurchaseParams {
  vcAmount: string;
  expectedBnbAmount: string;
  slippageTolerance: number;
  gasLimit?: bigint;
}

export interface TransactionResult {
  hash: string;
  status: 'success' | 'failed';
  vcAmount: string;
  bnbAmount: string;
  gasUsed: string;
  error?: string;
} 