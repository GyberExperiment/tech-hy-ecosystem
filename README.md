# TECH HY Ecosystem: Enterprise LP Locking & Governance Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.22-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Binance Smart Chain](https://img.shields.io/badge/BSC-Testnet-F3BA2F?style=for-the-badge&logo=binance)](https://www.binance.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 🚀 Executive Summary

TECH HY Ecosystem - это enterprise-уровень DeFi платформа для **permanent LP locking** с интегрированной DAO governance системой на Binance Smart Chain. Система использует **burn-to-earn механизм**: LP токены блокируются навсегда в обмен на мгновенные VG rewards для участия в governance.

### 🔥 **Ключевые особенности**:
- **🔒 Permanent LP Locking**: LP токены заблокированы навсегда для обеспечения постоянной ликвидности
- **⚡ Instant VG Rewards**: Мгновенное получение VG токенов (15:1 ratio) при lock операции
- **🗳️ DAO Governance**: VG → VGVotes для голосования в децентрализованном управлении
- **🛡️ Enterprise Security**: Timelock защита + MEV protection + slippage control

## 🏗️ Архитектура системы

### 🔄 **LP LOCKING FLOW** (НЕ Staking):

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECH HY Ecosystem                           │
│                  BSC DeFi LP Locking Platform                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LP Creation    2. Permanent Lock    3. Instant Rewards     │
│  VC + BNB     →    LP → LPLocker    →    LP → VG (15:1)        │
│  PancakeSwap       (НАВСЕГДА)           (МГНОВЕННО)             │
│                                                                 │
│  4. Governance                                                  │
│  VG → VGVotes → DAO Voting                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🚫 **Особенности системы**:
- ❌ **Стейкинг пулы** с APY/rewards rate
- ❌ **Unstaking функции** - LP токены нельзя забрать обратно
- ❌ **Накопление rewards** со временем
- ❌ **Классические staking pool** операции

### ✅ **Реальная архитектура**:
- ✅ **BURN-TO-EARN система**: LP токены уничтожаются навсегда в обмен на VG
- ✅ **Instant rewards**: VG токены получаются сразу при lock операции
- ✅ **Permanent liquidity**: LP остаются в протоколе навсегда для стабильности
- ✅ **One-time operation**: `earnVG()` - единоразовая операция lock + reward

## 🛠️ Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECH HY Ecosystem                           │
│                  BSC DeFi LP Locking Platform                  │
├─────────────────────────────────────────────────────────────────┤
│  Frontend DApp (React + TypeScript + ethers.js)                │
├─────────────────────────────────────────────────────────────────┤
│  Smart Contract Layer (Solidity 0.8.22)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   LPLocker      │  │   Governance    │  │   Token Layer   │ │
│  │   (UUPS Proxy)  │  │   (Governor +   │  │   (VC/VG/VGV)   │ │
│  │                 │  │    Timelock)    │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  External Integrations                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  PancakeSwap V2 │  │   BSC Network   │  │   MetaMask      │ │
│  │   (Router +     │  │   (Testnet)     │  │   Integration   │ │
│  │    Factory)     │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Token Flow Architecture

```
User Assets Flow:
VC Tokens + BNB → LPLocker.earnVG() → PancakeSwap.addLiquidityETH() 
                                    ↓
LP Tokens (Locked Forever) ← VG Rewards (15:1 ratio) ← User

Governance Flow:
VG Tokens → VGTokenVotes.deposit() → VGVotes → Governor.propose/vote()
                                              ↓
                                    Timelock.execute() → Contract Updates
```

## 🛠️ Technical Stack

### Blockchain Layer
- **Blockchain**: Binance Smart Chain (BSC) Testnet
- **Solidity Version**: 0.8.22 with viaIR optimization
- **Framework**: Hardhat 2.23.0 with TypeScript
- **Proxy Pattern**: OpenZeppelin UUPS (Universal Upgradeable Proxy Standard)
- **Security**: OpenZeppelin Contracts v5.3.0 (Upgradeable)

### Smart Contract Architecture
- **LPLocker.sol**: Core staking logic with UUPS upgradeability
- **VCToken.sol**: ERC20 staking token (1B max supply)
- **VGToken.sol**: ERC20 reward token (100M max supply)
- **VGTokenVotes.sol**: ERC20Votes wrapper for governance
- **LPLockerGovernor.sol**: OpenZeppelin Governor implementation
- **TimelockController.sol**: Timelock for critical operations

### Frontend Stack
- **Framework**: React 18.2.0 + TypeScript 5.2.2
- **Build Tool**: Vite 4.5.0 with HMR
- **Web3 Library**: ethers.js v6.8.0
- **UI Framework**: Tailwind CSS 3.3.5 with glassmorphism design
- **State Management**: React Query 5.8.4 + React Context
- **Routing**: React Router DOM 6.18.0
- **Notifications**: React Hot Toast 2.4.1

### Development Tools
- **Testing**: Hardhat Toolbox with Mocha/Chai
- **Code Quality**: ESLint + Prettier + Solhint
- **Type Safety**: TypeChain for contract type generation
- **Coverage**: Hardhat Coverage plugin
- **Deployment**: Custom deployment scripts with verification

## 📊 Smart Contracts Documentation

### LPLocker.sol - Core Contract

**Contract Address**: `0x9269baba99cE0388Daf814E351b4d556fA728D32`

#### Key Functions

```solidity
function earnVG(
    uint256 vcAmount,
    uint256 bnbAmount,
    uint16 slippageBps
) external payable mevProtection nonReentrant
```

**Purpose**: Основная функция для создания LP позиций и получения VG наград

**Parameters**:
- `vcAmount`: Количество VC токенов для стейкинга
- `bnbAmount`: Количество BNB для создания LP (должно равняться msg.value)
- `slippageBps`: Slippage tolerance в basis points (max 1000 = 10%)

**Process Flow**:
1. Валидация входных параметров и MEV protection
2. Transfer VC токенов от пользователя
3. Approve VC токенов для PancakeSwap Router
4. Создание LP через `addLiquidityETH()`
5. Расчет VG наград (15 VG за 1 LP токен)
6. Transfer VG токенов пользователю
7. LP токены остаются заблокированными в контракте навсегда

#### Configuration Structure

   ```solidity
struct StakingConfig {
    address authority;           // Администратор контракта
    address vgTokenAddress;      // VG токен для наград
    address vcTokenAddress;      // VC токен для стейкинга
    address pancakeRouter;       // PancakeSwap V2 Router
    address lpTokenAddress;      // LP токен VC/WBNB
    address stakingVaultAddress; // Хранилище VG токенов
    uint256 lpDivisor;          // Делитель для расчета LP (1,000,000)
    uint256 lpToVgRatio;        // Соотношение LP к VG (15:1)
    uint256 minBnbAmount;       // Минимум BNB (0.01 BNB)
    uint256 minVcAmount;        // Минимум VC (1 VC)
    uint16 maxSlippageBps;      // Максимальный slippage (1000 = 10%)
    uint16 defaultSlippageBps;  // По умолчанию (200 = 2%)
    bool mevProtectionEnabled;   // MEV защита
    uint256 minTimeBetweenTxs;  // Минимум между транзакциями (секунды)
    uint8 maxTxPerUserPerBlock; // Максимум транзакций на блок
    uint256 totalLockedLp;      // Общее количество заблокированных LP
    uint256 totalVgIssued;      // Всего выдано VG токенов
    uint256 totalVgDeposited;   // Всего депонировано VG токенов
}
```

### Token Contracts

#### VCToken.sol (Value Coin)
- **Address**: `0xC88eC091302Eb90e78a4CA361D083330752dfc9A`
- **Type**: Standard ERC20 token
- **Max Supply**: 1,000,000,000 VC
- **Decimals**: 18
- **Purpose**: Staking token для создания LP позиций

#### VGToken.sol (Value Gold)
- **Address**: `0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d`
- **Type**: ERC20 with owner-controlled minting
- **Max Supply**: 100,000,000 VG
- **Decimals**: 18
- **Purpose**: Reward token за LP staking

#### VGTokenVotes.sol (Value Gold Votes)
- **Address**: `0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA`
- **Type**: ERC20Votes wrapper
- **Ratio**: 1:1 с VGToken
- **Purpose**: Governance voting power

### Governance System

#### LPLockerGovernor.sol
- **Address**: `0x786133467f52813Ce0855023D4723A244524563E`
- **Voting Delay**: 1 day (7200 blocks)
- **Voting Period**: 1 week (50400 blocks)
- **Proposal Threshold**: 10,000 VGVotes
- **Quorum**: 10% of total VGVotes supply

#### TimelockController.sol
- **Address**: `0x06EEB4c972c05BBEbf960Fec99f483dC95768e39`
- **Min Delay**: 2 days for critical operations
- **Roles**: Proposer (Governor), Executor (Governor), Admin (Deployer)

## 🎨 Frontend Application

### Application Structure

```
frontend/
├── src/
│   ├── components/          # React компоненты
│   │   ├── EarnVGWidget.tsx    # Основной компонент для earnVG
│   │   ├── VGConverter.tsx     # VG ↔ VGVotes конвертер
│   │   ├── LPPoolManager.tsx   # Управление ликвидностью
│   │   └── TokenBalance.tsx    # Отображение балансов
│   ├── contexts/            # React контексты
│   │   ├── Web3Context.tsx     # Web3 интеграция
│   │   └── ContractContext.tsx # Contract instances
│   ├── hooks/               # Custom React hooks
│   │   ├── useContract.ts      # Contract interaction
│   │   └── useTokenBalance.ts  # Token balance tracking
│   ├── pages/               # Страницы приложения
│   │   ├── Home.tsx           # Главная страница
│   │   ├── TokenManagement.tsx # Управление токенами
│   │   └── Governance.tsx     # DAO governance
│   ├── constants/           # Конфигурация
│   │   ├── contracts.ts       # Адреса контрактов
│   │   └── abi.ts            # Contract ABIs
│   └── utils/               # Утилиты
│       ├── formatters.ts      # Форматирование данных
│       └── validators.ts      # Валидация входных данных
```

### Key Components

#### EarnVGWidget.tsx
Основной компонент для взаимодействия с LPLocker контрактом:

```typescript
// Автоматическое определение режима работы
const hasLPTokens = lpBalance > 0n;
const mode = hasLPTokens ? 'earn' : 'create';

// One-click LP creation + VG earning
const handleEarnVG = async () => {
  const tx = await lpLockerContract.earnVG(
           vcAmount,
    bnbAmount,
    slippageBps,
    { value: bnbAmount, gasLimit: 500000 }
  );
};
```

#### Web3Context.tsx
Централизованное управление Web3 подключением:

```typescript
const Web3Context = createContext({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connectWallet: () => {},
  switchToBSCTestnet: () => {},
});
```

### User Experience Features

1. **One-Click Operations**: Минимальное количество кликов для основных операций
2. **Automatic Network Switching**: Автоматическое переключение на BSC Testnet
3. **Real-time Data**: Обновление балансов и статистики каждые 30 секунд
4. **Responsive Design**: Полная поддержка мобильных устройств
5. **Error Handling**: Детальные сообщения об ошибках с предложениями решений
6. **Transaction Tracking**: Отслеживание статуса транзакций с ссылками на BSCScan

## 🚀 Deployment Guide

### Prerequisites

```bash
# Node.js 18+ и npm
node --version  # v18.0.0+
npm --version   # 9.0.0+

# Git для клонирования репозитория
git --version
```

### Environment Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-org/tech-hy-ecosystem.git
cd tech-hy-ecosystem
```

2. **Install Dependencies**
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

3. **Environment Configuration**
```bash
# Создать .env файл из примера
cp deploy.env.example .env

# Настроить переменные окружения
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key
```

### Smart Contract Deployment

#### 1. Deploy Tokens
```bash
npm run deploy:tokens
```

Развертывает:
- VCToken (Value Coin)
- VGToken (Value Gold) 
- VGTokenVotes (Governance wrapper)

#### 2. Deploy Ecosystem
```bash
npm run deploy:ecosystem
```

Развертывает:
- LPLocker (UUPS Proxy)
- LockerDAO
- LPLockerGovernor
- TimelockController

#### 3. Test Deployment
```bash
npm run deploy:test
```

Проверяет корректность развертывания и конфигурации.

### Frontend Deployment

#### Development Server
```bash
cd frontend
npm run dev
```

Запускает development server на `http://localhost:5174`

#### Production Build
```bash
cd frontend
npm run build
npm run preview
```

Создает production build в `frontend/dist/`

### Deployed Addresses (BSC Testnet)

```javascript
const CONTRACTS = {
  // Core Tokens
  VC_TOKEN: "0xC88eC091302Eb90e78a4CA361D083330752dfc9A",
  VG_TOKEN: "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d",
  VG_TOKEN_VOTES: "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA",
  
  // LP & Staking
  LP_TOKEN: "0xA221093a37396c6301db4B24D55E1C871DF31d13",
  LP_LOCKER: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  
  // Governance
  GOVERNOR: "0x786133467f52813Ce0855023D4723A244524563E",
  TIMELOCK: "0x06EEB4c972c05BBEbf960Fec99f483dC95768e39",
  
  // External
  PANCAKE_ROUTER: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
  PANCAKE_FACTORY: "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc",
};
```

## 🔧 API Reference

### LPLocker Contract API

#### Read Functions

```solidity
// Получить полную конфигурацию контракта
function config() external view returns (StakingConfig memory)

// Проверить последний блок транзакции пользователя
function lastUserTxBlock(address user) external view returns (uint256)

// Получить timestamp последней транзакции пользователя
function lastUserTxTimestamp(address user) external view returns (uint256)

// Получить количество транзакций пользователя в текущем блоке
function userTxCountInBlock(address user) external view returns (uint8)
```

#### Write Functions

```solidity
// Основная функция для получения VG токенов
function earnVG(
    uint256 vcAmount,
    uint256 bnbAmount,
    uint16 slippageBps
) external payable

// Депозит VG токенов в vault (только authority)
function depositVGTokens(uint256 amount) external onlyAuthority

// Обновление конфигурации (только authority)
function updateConfig(/* parameters */) external onlyAuthority

// Включение/выключение MEV защиты
function setMevProtection(bool enabled) external onlyAuthority
```

### Token Contract APIs

#### VGTokenVotes (Governance)

```solidity
// Конвертация VG → VGVotes для голосования
function deposit(uint256 amount) external

// Конвертация VGVotes → VG
function withdraw(uint256 amount) external

// Получить voting power пользователя
function getVotes(address account) external view returns (uint256)

// Делегирование voting power
function delegate(address delegatee) external
```

### Frontend API Integration

#### Contract Interaction Example

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from './constants/contracts';
import { LP_LOCKER_ABI } from './constants/abi';

// Инициализация контракта
const lpLockerContract = new ethers.Contract(
  CONTRACTS.LP_LOCKER,
  LP_LOCKER_ABI,
  signer
);

// Вызов earnVG функции
const earnVGTokens = async (vcAmount: string, bnbAmount: string) => {
  const vcAmountWei = ethers.parseEther(vcAmount);
  const bnbAmountWei = ethers.parseEther(bnbAmount);
  const slippageBps = 1000; // 10%
  
  const tx = await lpLockerContract.earnVG(
    vcAmountWei,
    bnbAmountWei,
    slippageBps,
    { 
      value: bnbAmountWei,
      gasLimit: 500000
    }
  );
  
  return await tx.wait();
};
```

## 🛡️ Security Features

### Smart Contract Security

#### 1. OpenZeppelin Standards
- **ReentrancyGuard**: Защита от reentrancy атак
- **Ownable**: Контроль доступа к административным функциям
- **UUPS Upgradeable**: Безопасные обновления контрактов
- **ERC20Votes**: Стандартизированная система голосования

#### 2. MEV Protection
```solidity
modifier mevProtection() {
    if (config.mevProtectionEnabled) {
        // Time-based protection (300 seconds between transactions)
        require(
            block.timestamp >= lastUserTxTimestamp[msg.sender] + config.minTimeBetweenTxs,
            "Too frequent transactions"
        );
        
        // Block-based protection (max 1 tx per block per user)
        require(
            block.number > lastUserTxBlock[msg.sender] ||
                userTxCountInBlock[msg.sender] < config.maxTxPerUserPerBlock,
            "MEV protection violated"
        );
    }
    _;
}
```

#### 3. Slippage Protection
- **Maximum Slippage**: 10% (1000 basis points)
- **Dynamic Calculation**: Автоматический расчет минимальных amounts
- **User Control**: Пользователь может установить slippage от 0.1% до 10%

#### 4. Input Validation
```solidity
require(vcAmount >= config.minVcAmount, "VC amount too low");
require(bnbAmount >= config.minBnbAmount, "BNB amount too low");
require(msg.value == bnbAmount, "BNB amount mismatch");
require(slippageBps <= config.maxSlippageBps, "Slippage too high");
```

### Frontend Security

#### 1. Web3 Security
- **Network Validation**: Автоматическая проверка подключения к BSC Testnet
- **Contract Verification**: Проверка адресов контрактов перед взаимодействием
- **Transaction Simulation**: Предварительная проверка транзакций

#### 2. Input Sanitization
```typescript
const validateVCAmount = (amount: string): boolean => {
  const numAmount = parseFloat(amount);
  return numAmount > 0 && numAmount <= 1000000; // Max reasonable amount
};

const validateBNBAmount = (amount: string): boolean => {
  const numAmount = parseFloat(amount);
  return numAmount >= 0.01 && numAmount <= 100; // Min 0.01, Max 100 BNB
};
```

#### 3. Error Handling
- **Comprehensive Error Messages**: Детальные сообщения для каждого типа ошибки
- **Fallback Mechanisms**: Резервные RPC endpoints для BSC
- **Transaction Recovery**: Возможность повторной отправки failed транзакций

## 🧪 Testing

### Smart Contract Tests

#### Test Coverage: 100% (86/86 tests passed)

```bash
# Запуск всех тестов
npm run test:full

# Тестирование отдельных компонентов
npm run test:tokens      # Token contracts
npm run test:lpLocker    # LPLocker contract
npm run test:integration # Integration tests

# Coverage report
npm run coverage
```

#### Test Results Summary
- **VCToken.test.ts**: 18/18 tests ✅
- **VGToken.test.ts**: 20/20 tests ✅
- **VGTokenVotes.test.ts**: 23/23 tests ✅
- **LPLocker.test.ts**: 25/25 tests ✅

### Frontend Testing

```bash
cd frontend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Component testing
npm run test:components
```

### Integration Testing

```bash
# Тестирование deployed контрактов
npm run deploy:test

# Проверка LP pool functionality
node scripts/test-lp-pool.js

# Проверка governance system
node scripts/test-governance.js
```

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. "Internal JSON-RPC error"
**Причина**: Нестабильность BSC Testnet RPC или неправильные параметры транзакции

**Решение**:
```typescript
// Использовать fallback RPC endpoints
const fallbackRpcs = [
  'https://data-seed-prebsc-1-s1.binance.org:8545/',
  'https://data-seed-prebsc-2-s1.binance.org:8545/',
];

// Увеличить gas limit
const tx = await contract.earnVG(vcAmount, bnbAmount, slippage, {
  gasLimit: 500000, // Увеличенный gas limit
  gasPrice: ethers.parseUnits('20', 'gwei')
});
```

#### 2. "Slippage exceeded"
**Причина**: Slippage превышает максимально допустимый (10%) или недостаточная ликвидность

**Решение**:
```typescript
// Автоматическая адаптация slippage
const maxSlippage = await lpLockerContract.config().maxSlippageBps;
const adjustedSlippage = Math.min(requestedSlippage, maxSlippage);
```

#### 3. "MEV protection violated"
**Причина**: Слишком частые транзакции (менее 300 секунд между попытками)

**Решение**:
```typescript
// Проверка времени последней транзакции
const lastTxTime = await lpLockerContract.lastUserTxTimestamp(userAddress);
const currentTime = Math.floor(Date.now() / 1000);
const timeDiff = currentTime - lastTxTime;

if (timeDiff < 300) {
  const waitTime = 300 - timeDiff;
  alert(`Please wait ${waitTime} seconds before next transaction`);
}
```

#### 4. "Cannot convert 1e+30 to a BigInt"
**Причина**: Математический overflow при работе с большими числами

**Решение**:
```typescript
// Использовать BigInt арифметику
const calculateVGReward = (lpAmount: bigint): bigint => {
  return lpAmount * 15n; // Используем BigInt literals
};

// Избегать Number() конвертации больших BigInt
const formatAmount = (amount: bigint): string => {
  return ethers.formatEther(amount); // Прямая конвертация
};
```

#### 5. Pool Information показывает нули
**Причина**: Неправильный LP token address или пустой пул

**Решение**:
```typescript
// Проверить правильность LP token address
const LP_TOKEN = "0xA221093a37396c6301db4B24D55E1C871DF31d13"; // Правильный адрес

// Проверить ликвидность пула
const reserves = await lpPairContract.getReserves();
if (reserves[0] === 0n && reserves[1] === 0n) {
  console.log("Pool has no liquidity");
}
```

### Debug Scripts

#### Contract Configuration Diagnostic
```bash
node scripts/debug-contract-config.js
```

Выводит:
- Текущую конфигурацию LPLocker
- Статус MEV protection
- Доступные VG токены в vault
- LP pool reserves

#### Transaction Parameter Logging
```typescript
console.log('Transaction Parameters:', {
  vcAmount: ethers.formatEther(vcAmount),
  bnbAmount: ethers.formatEther(bnbAmount),
  slippageBps,
  maxSlippageBps: config.maxSlippageBps,
  gasLimit: 500000
});
```

## 📈 Performance Optimization

### Smart Contract Optimizations

1. **Gas Optimization**
   - Использование `viaIR: true` для оптимизации компилятора
   - Efficient storage layout в structs
   - Minimal external calls

2. **Batch Operations**
   - Группировка multiple updates в одну транзакцию
   - Efficient event emission

### Frontend Optimizations

1. **React Query Caching**
```typescript
const { data: balance } = useQuery({
  queryKey: ['tokenBalance', tokenAddress, account],
  queryFn: () => getTokenBalance(tokenAddress, account),
  staleTime: 30000, // 30 seconds cache
  refetchInterval: 30000
});
```

2. **Lazy Loading**
```typescript
const GovernancePage = lazy(() => import('./pages/Governance'));
const TokenManagement = lazy(() => import('./pages/TokenManagement'));
```

3. **Memoization**
```typescript
const memoizedCalculation = useMemo(() => {
  return calculateVGReward(lpAmount);
}, [lpAmount]);
```

## 🔄 Development Workflow

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create Pull Request
# Code Review
# Merge to main
```

### Code Quality

```bash
# Linting
npm run lint:sol    # Solidity linting
npm run lint:ts     # TypeScript linting

# Formatting
npm run format      # Prettier formatting

# Pre-commit hooks
npm run pre-commit  # Run all checks
```

### Continuous Integration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run compile
      - run: npm run test:full
      - run: npm run lint:sol
      - run: npm run lint:ts
```

## 📚 Additional Resources

### Documentation Links
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/5.x/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [PancakeSwap V2 Docs](https://docs.pancakeswap.finance/developers/smart-contracts)
- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)

### Contract Verification
- [BSCScan Testnet](https://testnet.bscscan.com/)
- [LPLocker Contract](https://testnet.bscscan.com/address/0x9269baba99cE0388Daf814E351b4d556fA728D32)

### Community
- [GitHub Issues](https://github.com/your-org/tech-hy-ecosystem/issues)
- [Discord Community](https://discord.gg/your-discord)
- [Telegram Channel](https://t.me/your-telegram)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For technical support and questions:
- **Email**: support@tech-hy-ecosystem.com
- **GitHub Issues**: [Create an issue](https://github.com/your-org/tech-hy-ecosystem/issues)
- **Documentation**: [Wiki](https://github.com/your-org/tech-hy-ecosystem/wiki)

---

**Built with ❤️ by the TECH HY Team**

*Last Updated: January 2025*
