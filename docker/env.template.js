// 🌐 TECH HY Ecosystem Runtime Environment Configuration
// This file is generated at container startup with actual environment values

window.ENV = {
  // Network Configuration
  BSC_RPC_URL: '$REACT_APP_BSC_RPC_URL',
  BSC_CHAIN_ID: '$REACT_APP_BSC_CHAIN_ID',
  
  // App Configuration  
  ENVIRONMENT: '$REACT_APP_ENVIRONMENT',
  VERSION: '$REACT_APP_VERSION',
  BUILD_DATE: '$REACT_APP_BUILD_DATE',
  
  // Smart Contract Addresses
  CONTRACTS: {
    VC_TOKEN: '$REACT_APP_VC_TOKEN',
    VG_TOKEN: '$REACT_APP_VG_TOKEN',
    LP_LOCKER: '$REACT_APP_LP_LOCKER',
    GOVERNOR: '$REACT_APP_GOVERNOR',
    TIMELOCK: '$REACT_APP_TIMELOCK',
    LP_TOKEN: '$REACT_APP_LP_TOKEN'
  },
  
  // TECH HY Branding
  BRAND: {
    NAME: '$REACT_APP_BRAND_NAME',
    URL: '$REACT_APP_BRAND_URL',
    SUPPORT_EMAIL: '$REACT_APP_SUPPORT_EMAIL'
  },
  
  // Analytics & Monitoring
  ANALYTICS: {
    ANALYTICS_ID: '$REACT_APP_ANALYTICS_ID',
    SENTRY_DSN: '$REACT_APP_SENTRY_DSN'
  },
  
  // Feature Flags (can be controlled via environment)
  FEATURES: {
    ENABLE_ANALYTICS: '$REACT_APP_ANALYTICS_ID' !== '',
    ENABLE_SENTRY: '$REACT_APP_SENTRY_DSN' !== '',
    ENABLE_DEV_TOOLS: '$REACT_APP_ENVIRONMENT' === 'development'
  }
}; 