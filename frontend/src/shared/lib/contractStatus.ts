/**
 * 🔍 Contract Status Checker for Tech HY Ecosystem
 * 
 * Проверяет статус контрактов в разных сетях
 * Определяет доступность функциональности для пользователей
 */

import { CONTRACTS, getCurrentNetwork } from '../config/contracts';

export interface ContractStatus {
  address: string;
  isDeployed: boolean;
  isReady: boolean;
  name: string;
  description: string;
  dependencies?: string[];
  features: string[];
}

export interface SystemStatus {
  network: 'mainnet' | 'testnet';
  overallReady: boolean;
  deployedContracts: number;
  totalContracts: number;
  readyFeatures: string[];
  pendingFeatures: string[];
  contracts: {
    [key: string]: ContractStatus;
  };
}

// Определение контрактов и их зависимостей
const CONTRACT_DEFINITIONS = {
  VC_TOKEN: {
    name: 'VC Token',
    description: 'Venture Capital Token - основной токен экосистемы',
    features: ['Token Balance', 'Token Transfer', 'Basic Trading'],
    dependencies: []
  },
  VG_TOKEN: {
    name: 'VG Token', 
    description: 'Venture Growth Token - governance токен',
    features: ['Token Balance', 'Token Transfer', 'Governance Power'],
    dependencies: []
  },
  VG_TOKEN_VOTES: {
    name: 'VG Token Votes',
    description: 'ERC20Votes extension для VG токена',
    features: ['Delegation', 'Voting Power Tracking', 'Snapshot Voting'],
    dependencies: ['VG_TOKEN']
  },
  LP_TOKEN: {
    name: 'LP Token',
    description: 'VC/WBNB Liquidity Pool Token от PancakeSwap',
    features: ['LP Staking', 'Liquidity Providing', 'Pool Statistics'],
    dependencies: ['VC_TOKEN']
  },
  LP_LOCKER: {
    name: 'LP Locker',
    description: 'Контракт для лока LP токенов и выдачи VG наград',
    features: ['LP Staking', 'VG Rewards', 'Pool Management', 'EarnVG Widget'],
    dependencies: ['LP_TOKEN', 'VG_TOKEN']
  },
  VCSALE: {
    name: 'VC Sale',
    description: 'Контракт продажи VC токенов за BNB',
    features: ['VC Purchase', 'Swap Widget', 'Price Discovery'],
    dependencies: ['VC_TOKEN']
  },
  GOVERNOR: {
    name: 'Governor',
    description: 'Governance контракт для голосований',
    features: ['Proposal Creation', 'Voting', 'Proposal Execution', 'DAO Governance'],
    dependencies: ['VG_TOKEN_VOTES']
  },
  TIMELOCK: {
    name: 'Timelock',
    description: 'Timelock контракт для задержки исполнения предложений',
    features: ['Proposal Queueing', 'Delayed Execution', 'Security'],
    dependencies: ['GOVERNOR']
  },
  STAKING_DAO: {
    name: 'Staking DAO',
    description: 'DAO контракт для управления стейкингом',
    features: ['Staking Parameters', 'Rewards Distribution'],
    dependencies: ['LP_LOCKER', 'GOVERNOR']
  }
} as const;

/**
 * Проверяет задеплоен ли контракт
 */
function isContractDeployed(address: string): boolean {
  return address !== '0x0000000000000000000000000000000000000000' && address.length === 42;
}

/**
 * Проверяет готов ли контракт к использованию
 */
function isContractReady(contractKey: string, contracts: typeof CONTRACTS): boolean {
  const definition = CONTRACT_DEFINITIONS[contractKey as keyof typeof CONTRACT_DEFINITIONS];
  if (!definition) return false;

  // Проверяем что сам контракт задеплоен
  const isDeployed = isContractDeployed(contracts[contractKey as keyof typeof contracts]);
  if (!isDeployed) return false;

  // Проверяем зависимости
  if (definition.dependencies) {
    for (const dep of definition.dependencies) {
      const depAddress = contracts[dep as keyof typeof contracts];
      if (!isContractDeployed(depAddress)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Получает статус конкретного контракта
 */
export function getContractStatus(contractKey: string): ContractStatus {
  const address = CONTRACTS[contractKey as keyof typeof CONTRACTS] || '0x0000000000000000000000000000000000000000';
  const definition = CONTRACT_DEFINITIONS[contractKey as keyof typeof CONTRACT_DEFINITIONS];
  
  if (!definition) {
    return {
      address,
      isDeployed: false,
      isReady: false,
      name: contractKey,
      description: 'Unknown contract',
      features: []
    };
  }

  const isDeployed = isContractDeployed(address);
  const isReady = isContractReady(contractKey, CONTRACTS);

  return {
    address,
    isDeployed,
    isReady,
    name: definition.name,
    description: definition.description,
    dependencies: definition.dependencies,
    features: definition.features
  };
}

/**
 * Получает статус всей системы
 */
export function getSystemStatus(): SystemStatus {
  const network = getCurrentNetwork();
  const contractKeys = Object.keys(CONTRACT_DEFINITIONS);
  
  const contracts: { [key: string]: ContractStatus } = {};
  let deployedCount = 0;
  let readyCount = 0;
  const readyFeatures: string[] = [];
  const pendingFeatures: string[] = [];

  // Анализируем каждый контракт
  for (const contractKey of contractKeys) {
    const status = getContractStatus(contractKey);
    contracts[contractKey] = status;

    if (status.isDeployed) {
      deployedCount++;
    }

    if (status.isReady) {
      readyCount++;
      readyFeatures.push(...status.features);
    } else {
      pendingFeatures.push(...status.features);
    }
  }

  // Убираем дублированные фичи
  const uniqueReadyFeatures = [...new Set(readyFeatures)];
  const uniquePendingFeatures = [...new Set(pendingFeatures.filter(f => !uniqueReadyFeatures.includes(f)))];

  return {
    network,
    overallReady: readyCount === contractKeys.length,
    deployedContracts: deployedCount,
    totalContracts: contractKeys.length,
    readyFeatures: uniqueReadyFeatures,
    pendingFeatures: uniquePendingFeatures,
    contracts
  };
}

/**
 * Проверяет доступность конкретной функциональности
 */
export function isFeatureAvailable(feature: string): boolean {
  const systemStatus = getSystemStatus();
  return systemStatus.readyFeatures.includes(feature);
}

/**
 * Получает список контрактов необходимых для функциональности
 */
export function getRequiredContractsForFeature(feature: string): string[] {
  const required: string[] = [];
  
  for (const [contractKey, definition] of Object.entries(CONTRACT_DEFINITIONS)) {
    if (definition.features.includes(feature)) {
      required.push(contractKey);
      // Добавляем зависимости
      if (definition.dependencies) {
        required.push(...definition.dependencies);
      }
    }
  }
  
  return [...new Set(required)];
}

/**
 * Получает статус готовности компонента/виджета
 */
export function getComponentReadiness(requiredFeatures: string[]): {
  isReady: boolean;
  availableFeatures: string[];
  missingFeatures: string[];
  missingContracts: string[];
} {
  const systemStatus = getSystemStatus();
  
  const availableFeatures = requiredFeatures.filter(feature => 
    systemStatus.readyFeatures.includes(feature)
  );
  
  const missingFeatures = requiredFeatures.filter(feature => 
    !systemStatus.readyFeatures.includes(feature)
  );
  
  const missingContracts: string[] = [];
  for (const feature of missingFeatures) {
    const required = getRequiredContractsForFeature(feature);
    for (const contractKey of required) {
      if (!systemStatus.contracts[contractKey]?.isReady) {
        missingContracts.push(contractKey);
      }
    }
  }
  
  return {
    isReady: missingFeatures.length === 0,
    availableFeatures,
    missingFeatures,
    missingContracts: [...new Set(missingContracts)]
  };
}

/**
 * Типизированные проверки для конкретных виджетов
 */
export const WidgetReadiness = {
  VCSaleWidget: () => getComponentReadiness(['VC Purchase', 'Swap Widget']),
  EarnVGWidget: () => getComponentReadiness(['LP Staking', 'VG Rewards', 'EarnVG Widget']),
  LPPoolManager: () => getComponentReadiness(['LP Staking', 'Liquidity Providing', 'Pool Management']),
  GovernanceWidget: () => getComponentReadiness(['Proposal Creation', 'Voting', 'DAO Governance']),
  StakingStats: () => getComponentReadiness(['LP Staking', 'Pool Statistics']),
  TokenBalance: () => getComponentReadiness(['Token Balance', 'Token Transfer'])
};

// Экспорт для удобства использования
export { isContractDeployed, isContractReady }; 