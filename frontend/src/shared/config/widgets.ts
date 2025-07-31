/**
 * 🎯 ЦЕНТРАЛИЗОВАННАЯ КОНФИГУРАЦИЯ ВИДЖЕТОВ
 * 
 * Устраняет все магические числа и хардкоды из компонентов
 * Обеспечивает единообразие настроек по всей экосистеме
 */

export const WIDGET_CONFIG = {
  // 💰 VCSale Widget Configuration
  VCSALE: {
    FALLBACK_PRICE_BNB: 0.001, // Default price: 0.001 BNB per VC
    MAX_VC_AMOUNT: 10000,      // Maximum VC tokens per transaction
    MIN_VC_AMOUNT: 1,          // Minimum VC tokens per transaction
    DEBOUNCE_DELAY: 300,       // ms - Input debounce for calculations
    AUTO_REFRESH_INTERVAL: 30000, // ms - Auto-refresh sale data
    MAX_SLIPPAGE_TOLERANCE: 0.05,  // 5% max slippage
    DEFAULT_SLIPPAGE: 0.01,        // 1% default slippage
    PRICE_IMPACT_WARNING: 0.05,   // 5% price impact warning threshold
    TRANSACTION_TIMEOUT: 60000,    // ms - Transaction timeout
    RETRY_ATTEMPTS: 3,             // Number of retry attempts for failed calls
  },

  // 🌊 LP Staking Configuration  
  LP_STAKING: {
    DEFAULT_LP_TO_VG_RATIO: 10,   // 10 VG tokens per 1 LP token
    LP_DIVISOR: 1000,             // LP calculation divisor (1e21 in wei)
    MAX_SLIPPAGE_BPS: 1500,       // 15% maximum slippage in basis points
    DEFAULT_SLIPPAGE_BPS: 1000,   // 10% default slippage
    MIN_SLIPPAGE_BPS: 50,         // 0.5% minimum slippage
    DEFAULT_GAS_LIMIT: 500000,    // Default gas limit for transactions
    GAS_BUFFER_MULTIPLIER: 1.2,   // 20% gas buffer
    MIN_BNB_RESERVE: 0.01,        // Minimum BNB to keep for gas
    MIN_VC_AMOUNT: 0.1,           // Minimum VC amount for staking
    MIN_BNB_AMOUNT: 0.001,        // Minimum BNB amount
    MEV_PROTECTION_DELAY: 300000, // 5 minutes between transactions
    MAX_TX_PER_BLOCK: 3,          // Maximum transactions per block per user
    APPROVAL_GAS_LIMIT: 100000,   // Gas limit for approval transactions
  },

  // 🏊 LP Pool Manager Configuration
  LP_POOL_MANAGER: {
    DEFAULT_SLIPPAGE: 0.5,        // 0.5% default slippage for LP operations
    MIN_SLIPPAGE: 0.1,            // 0.1% minimum slippage
    MAX_SLIPPAGE: 50.0,           // 50% maximum slippage
    DEADLINE_MINUTES: 20,         // 20 minutes transaction deadline
    MIN_LIQUIDITY_AMOUNT: 0.001,  // Minimum amount for liquidity operations
    PRICE_IMPACT_WARNING: 0.05,   // 5% price impact warning
    POOL_SHARE_WARNING: 0.1,      // 10% pool share warning
    AUTO_CALCULATE_DELAY: 100,    // ms - Delay for auto-calculations
    REMOVE_PERCENTAGES: [25, 50, 75, 100], // Quick remove percentage options
  },

  // 🏛️ Governance Configuration
  GOVERNANCE: {
    PROPOSALS_PER_PAGE: 10,       // Number of proposals per page
    VOTING_POWER_DECIMALS: 18,    // VG token decimals for voting power
    MIN_VOTING_POWER: 1000,       // Minimum VG tokens to vote (1000 VG)
    PROPOSAL_THRESHOLD: 10000,    // Minimum VG tokens to create proposal
    VOTING_DELAY_BLOCKS: 1,       // Blocks delay before voting starts
    VOTING_PERIOD_BLOCKS: 17280,  // ~3 days on BSC (5s blocks)
    TIMELOCK_DELAY: 172800,       // 2 days timelock delay in seconds
    QUORUM_PERCENTAGE: 4,         // 4% quorum required
    GRACE_PERIOD_BLOCKS: 40320,   // ~7 days grace period
    AUTO_REFRESH_INTERVAL: 30000, // ms - Auto-refresh proposals
  },

  // 📊 Dashboard Configuration
  DASHBOARD: {
    METRICS_REFRESH_INTERVAL: 30000,  // ms - Auto-refresh dashboard metrics
    CHART_UPDATE_INTERVAL: 60000,     // ms - Chart data updates
    PORTFOLIO_CACHE_TIME: 300000,     // ms - 5 minutes cache for portfolio data
    PRICE_PRECISION: 6,               // Decimal places for price display
    BALANCE_PRECISION: 4,             // Decimal places for balance display
    PERCENTAGE_PRECISION: 2,          // Decimal places for percentages
    LARGE_NUMBER_THRESHOLD: 1000000,  // Threshold for K/M/B formatting
    VALUE_UPDATE_ANIMATION: 500,      // ms - Animation duration for value updates
  },

  // 📜 Transaction History Configuration
  TRANSACTION_HISTORY: {
    TRANSACTIONS_PER_PAGE: 20,        // Number of transactions per page
    MAX_TRANSACTION_AGE_DAYS: 90,     // Maximum age of transactions to display
    AUTO_REFRESH_INTERVAL: 45000,     // ms - Auto-refresh transactions
    BATCH_SIZE: 50,                   // Number of transactions per API batch
    CACHE_DURATION: 120000,           // ms - 2 minutes cache duration
    RETRY_ATTEMPTS: 3,                // Number of retry attempts for failed API calls
    TIMEOUT_MS: 10000,                // ms - API request timeout
    POLLING_INTERVAL: 30000,          // ms - Polling interval for pending transactions
  },

  // 🎨 UI/UX Configuration
  UI: {
    SKELETON_ANIMATION_DURATION: 1500, // ms - Skeleton loading animation
    TOAST_DURATION: 4000,              // ms - Toast notification duration
    TOOLTIP_DELAY: 500,                // ms - Tooltip show delay
    ANIMATION_DURATION: 300,           // ms - General animation duration
    DEBOUNCE_SEARCH: 300,              // ms - Search input debounce
    INFINITE_SCROLL_THRESHOLD: 0.8,    // Threshold for infinite scroll trigger
    MAX_MOBILE_WIDTH: 768,             // px - Mobile breakpoint
    CARD_HOVER_SCALE: 1.02,            // Scale factor for card hover effects
  },

  // 🔄 Data Fetching Configuration
  API: {
    RPC_TIMEOUT: 10000,               // ms - RPC request timeout
    MAX_RETRIES: 3,                   // Maximum retry attempts
    RETRY_DELAY: 1000,                // ms - Delay between retries
    BATCH_DELAY: 100,                 // ms - Delay between batch requests
    MAX_CONCURRENT_REQUESTS: 5,       // Maximum concurrent RPC requests
    CACHE_DURATION: 30000,            // ms - Default cache duration
    STALE_TIME: 60000,                // ms - Time until data becomes stale
  },

  // 🛡️ Security Configuration
  SECURITY: {
    MAX_INPUT_LENGTH: 20,             // Maximum input field length
    ALLOWED_DECIMALS: 18,             // Maximum decimal places for token amounts
    INPUT_SANITIZATION_REGEX: /[^\d.-]/g, // Regex for input sanitization
    MAX_TRANSACTION_VALUE: 1000000,    // Maximum transaction value (in tokens)
    MIN_PASSWORD_LENGTH: 8,           // Minimum password length (if applicable)
    SESSION_TIMEOUT: 3600000,         // ms - 1 hour session timeout
    RATE_LIMIT_WINDOW: 60000,         // ms - Rate limiting window
    RATE_LIMIT_MAX_REQUESTS: 100,     // Maximum requests per window
  },

  // 🌍 Network Configuration
  NETWORK: {
    SUPPORTED_CHAIN_IDS: [56, 97],    // BSC Mainnet and Testnet
    DEFAULT_CHAIN_ID: 97,             // BSC Testnet default
    BLOCK_CONFIRMATION_COUNT: 3,      // Required block confirmations
    GAS_PRICE_MULTIPLIER: 1.1,        // 10% gas price buffer
    MAX_GAS_PRICE: 20000000000,       // 20 Gwei maximum gas price
    NETWORK_SWITCH_TIMEOUT: 30000,    // ms - Network switch timeout
  },

  // 📱 Responsive Design
  RESPONSIVE: {
    MOBILE_BREAKPOINT: 768,           // px - Mobile breakpoint
    TABLET_BREAKPOINT: 1024,          // px - Tablet breakpoint
    DESKTOP_BREAKPOINT: 1200,         // px - Desktop breakpoint
    CARDS_PER_ROW_MOBILE: 1,          // Cards per row on mobile
    CARDS_PER_ROW_TABLET: 2,          // Cards per row on tablet
    CARDS_PER_ROW_DESKTOP: 3,         // Cards per row on desktop
  },

  // 🎯 Feature Flags
  FEATURES: {
    ENABLE_ANALYTICS: true,           // Enable analytics tracking
    ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_A_B_TESTING: false,
    ENABLE_BETA_FEATURES: false,
    ENABLE_MAINTENANCE_MODE: false,
  },
} as const;

/**
 * 🎨 Theme Configuration for Widgets
 */
export const WIDGET_THEMES = {
  colors: {
    primary: 'rgb(59, 130, 246)',      // Blue-500
    secondary: 'rgb(139, 92, 246)',     // Purple-500
    success: 'rgb(34, 197, 94)',        // Green-500
    warning: 'rgb(245, 158, 11)',       // Amber-500
    error: 'rgb(239, 68, 68)',          // Red-500
    info: 'rgb(6, 182, 212)',           // Cyan-500
  },
  gradients: {
    primary: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(139, 92, 246) 100%)',
    success: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(6, 182, 212) 100%)',
    warning: 'linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(239, 68, 68) 100%)',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
} as const;

/**
 * 📐 Format Configuration
 */
export const FORMAT_CONFIG = {
  currency: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  },
  token: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  },
  percentage: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  large_numbers: {
    thousand: 'K',
    million: 'M',
    billion: 'B',
    trillion: 'T',
  },
} as const;

/**
 * 🔧 Environment-specific overrides
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  const isTestnet = true; // process.env.REACT_APP_NETWORK !== 'mainnet'; // ФОРСИРОВАНО НА TESTNET

  return {
    ...WIDGET_CONFIG,
    FEATURES: {
      ...WIDGET_CONFIG.FEATURES,
      ENABLE_DEBUG_LOGS: isDevelopment,
      ENABLE_ANALYTICS: isProduction,
      ENABLE_BETA_FEATURES: isDevelopment || isTestnet,
    },
    API: {
      ...WIDGET_CONFIG.API,
      RPC_TIMEOUT: isDevelopment ? 30000 : WIDGET_CONFIG.API.RPC_TIMEOUT,
      MAX_RETRIES: isDevelopment ? 5 : WIDGET_CONFIG.API.MAX_RETRIES,
    },
  };
};

/**
 * 🎯 Type exports for TypeScript support
 */
export type WidgetConfig = typeof WIDGET_CONFIG;
export type WidgetThemes = typeof WIDGET_THEMES;
export type FormatConfig = typeof FORMAT_CONFIG; 