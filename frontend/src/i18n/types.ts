// Translation resource types
export interface CommonTranslations {
  // Navigation
  navigation: {
    dashboard: string;
    tokens: string;
    locking: string;
    governance: string;
  };
  
  // Common UI elements
  buttons: {
    connect: string;
    disconnect: string;
    approve: string;
    confirm: string;
    cancel: string;
    submit: string;
    refresh: string;
    copy: string;
    close: string;
    back: string;
    next: string;
    save: string;
    edit: string;
    delete: string;
    view: string;
    download: string;
  };
  
  // Common labels
  labels: {
    balance: string;
    amount: string;
    address: string;
    transaction: string;
    status: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    total: string;
    available: string;
    locked: string;
    pending: string;
    completed: string;
    failed: string;
  };
  
  // Common messages
  messages: {
    connectWallet: string;
    wrongNetwork: string;
    transactionPending: string;
    transactionSuccess: string;
    transactionFailed: string;
    insufficientBalance: string;
    approvalRequired: string;
    noDataAvailable: string;
    comingSoon: string;
  };
  
  // Time and dates
  time: {
    seconds: string;
    minutes: string;
    hours: string;
    days: string;
    weeks: string;
    months: string;
    years: string;
    ago: string;
    remaining: string;
  };
  
  // Numbers and formatting
  format: {
    currency: string;
    percentage: string;
    decimal: string;
    thousand: string;
    million: string;
    billion: string;
  };
}

export interface DashboardTranslations {
  title: string;
  subtitle: string;
  welcome: string;
  
  stats: {
    bnbBalance: string;
    totalTokens: string;
    lpLocking: string;
    governancePower: string;
    active: string;
    inactive: string;
    types: string;
    votes: string;
  };
  
  sections: {
    tokenBalances: string;
    quickActions: string;
    contractAddresses: string;
    stakingStats: string;
    transactionHistory: string;
  };
  
  actions: {
    manageTokens: {
      title: string;
      description: string;
      button: string;
    };
    lpLocking: {
      title: string;
      description: string;
      button: string;
    };
    governance: {
      title: string;
      description: string;
      button: string;
    };
  };
  
  errors: {
    notConnected: string;
    wrongNetwork: string;
    loadingFailed: string;
  };
}

export interface TokensTranslations {
  title: string;
  subtitle: string;
  
  tokens: {
    vc: {
      name: string;
      description: string;
    };
    vg: {
      name: string;
      description: string;
    };
    vgv: {
      name: string;
      description: string;
    };
    lp: {
      name: string;
      description: string;
    };
  };
  
  actions: {
    transfer: string;
    approve: string;
    mint: string;
    burn: string;
    convert: string;
  };
  
  forms: {
    recipient: string;
    amount: string;
    spender: string;
    allowance: string;
  };
  
  messages: {
    transferSuccess: string;
    approvalSuccess: string;
    invalidAmount: string;
    invalidAddress: string;
  };
}

export interface LockingTranslations {
  title: string;
  subtitle: string;
  description: string;
  
  process: {
    createLP: {
      title: string;
      description: string;
    };
    lockLP: {
      title: string;
      description: string;
    };
    earnVG: {
      title: string;
      description: string;
    };
  };
  
  info: {
    permanent: string;
    instant: string;
    ratio: string;
    governance: string;
    notStaking: string;
  };
  
  forms: {
    lpAmount: string;
    expectedVG: string;
    lockForever: string;
  };
  
  warnings: {
    permanentLock: string;
    noReturn: string;
    understand: string;
  };
}

export interface GovernanceTranslations {
  title: string;
  subtitle: string;
  
  voting: {
    power: string;
    proposals: string;
    active: string;
    closed: string;
    pending: string;
  };
  
  proposal: {
    title: string;
    description: string;
    votes: string;
    timeLeft: string;
    quorum: string;
    threshold: string;
  };
  
  actions: {
    vote: string;
    delegate: string;
    propose: string;
    execute: string;
  };
  
  status: {
    pending: string;
    active: string;
    succeeded: string;
    defeated: string;
    queued: string;
    executed: string;
    canceled: string;
    expired: string;
  };
}

// Main translation resources interface
export interface TranslationResources {
  common: CommonTranslations;
  dashboard: DashboardTranslations;
  tokens: TokensTranslations;
  locking: LockingTranslations;
  governance: GovernanceTranslations;
}

// Declare module for react-i18next
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationResources;
  }
} 