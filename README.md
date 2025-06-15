# TECH HY Ecosystem: Enterprise LP Locking & Governance Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.22-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Binance Smart Chain](https://img.shields.io/badge/BSC-Testnet-F3BA2F?style=for-the-badge&logo=binance)](https://www.binance.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 🚀 Executive Summary

TECH HY Ecosystem is an enterprise-grade DeFi platform for **permanent LP locking** with integrated DAO governance on Binance Smart Chain. The system uses a **burn-to-earn mechanism**: LP tokens are locked forever in exchange for instant VG rewards, which are used for governance.

### 🔥 **Key Features**:
- **🔒 Permanent LP Locking**: LP tokens are locked forever to guarantee protocol liquidity
- **⚡ Instant VG Rewards**: Immediate VG token rewards (15:1 ratio) for every lock operation
- **🗳️ DAO Governance**: VG → VGVotes for decentralized voting
- **🛡️ Enterprise Security**: Timelock, MEV protection, and slippage control
- **📊 Production Logging**: Enterprise-grade structured logging and monitoring

## 🏗️ System Architecture

### 🔄 **LP LOCKING FLOW** (Not Staking):

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECH HY Ecosystem                           │
│                  BSC DeFi LP Locking Platform                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LP Creation    2. Permanent Lock    3. Instant Rewards     │
│  VC + BNB     →    LP → LPLocker    →    LP → VG (15:1)        │
│  PancakeSwap       (FOREVER)              (INSTANT)             │
│                                                                 │
│  4. Governance                                                  │
│  VG → VGVotes → DAO Voting                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🚫 **What the System is NOT**:
- ❌ **Staking pools** with APY/rewards rate
- ❌ **Unstaking** — LP tokens cannot be withdrawn
- ❌ **Time-based rewards accumulation**
- ❌ **Classic staking pool operations**

### ✅ **Actual Architecture**:
- ✅ **BURN-TO-EARN**: LP tokens are burned forever for VG
- ✅ **Instant rewards**: VG tokens are minted instantly on lock
- ✅ **Permanent liquidity**: LP tokens remain in protocol forever
- ✅ **One-time operation**: `earnVG()` = lock + reward in one call

## 🛠️ Enhanced Architecture Overview

### Enterprise System Architecture with Logging Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECH HY Ecosystem                           │
│                  BSC DeFi LP Locking Platform                  │
├─────────────────────────────────────────────────────────────────┤
│  Frontend DApp (React + TypeScript + ethers.js)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Production Logging Layer (NEW)                │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │  Structured     │  │  Error Tracking & Context  │   │   │
│  │  │  Logging        │  │  Web3/Transaction Logging  │   │   │
│  │  │  (logger.ts)    │  │  (ErrorBoundary.tsx)       │   │   │
│  │  └─────────────────┘  └─────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
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

### Error Management & Logging Flow

```
Component Error → ErrorBoundary → Structured Log → Context Capture
                                        ↓
localStorage Buffer ← Production Logger ← External Service (Sentry Ready)
                                        ↓
Debug Export ← Log Aggregation ← Monitoring Dashboard
```

## 📊 Production Logging & Monitoring

### 🚀 **Enterprise Logging System**

Our platform features a comprehensive **production-grade logging system** that replaces all `console.*` calls with structured, context-aware logging.

#### **Frontend Logger** (`frontend/src/utils/logger.ts`)
```typescript
import { log } from '../utils/logger';

// Context-aware transaction logging
log.error('Transaction failed', {
  component: 'EarnVGWidget',
  function: 'handleEarnVG',
  txHash: '0x123...',
  address: account,
  network: 'BSC Testnet'
}, error);

// Specialized Web3 logging
log.web3('Wallet connected', { address });
log.transaction('TX confirmed', txHash);
log.contract('Contract interaction', contractAddress);
```

#### **Node.js Logger** (`scripts/logger.js`)
```javascript
const { log } = require('./logger');

log.section('Contract Deployment');
log.info('Deploying LPLocker contract', { deployer: address });
log.success('Contract deployed successfully', contractAddress);
```

### 🛡️ **Production Features**

#### **1. Structured Logging with Context**
- **Type Safety**: Full TypeScript support with interface definitions
- **Component Context**: Automatic component and function tracking
- **Web3 Context**: Transaction hashes, addresses, network info
- **Error Context**: Full error objects with stack traces

#### **2. Log Levels & Filtering**
```typescript
export enum LogLevel {
  ERROR = 0,    // 🚨 Critical errors only
  WARN = 1,     // ⚠️  Warnings and errors
  INFO = 2,     // ℹ️  General information
  DEBUG = 3,    // 🔍 Development debugging
  TRACE = 4,    // 📍 Detailed execution flow
}
```

#### **3. Production Safeguards**
- **Automatic Level Control**: Production = WARN+, Development = TRACE
- **Performance Optimized**: No-op in production when disabled
- **Memory Management**: 1000-entry rotating buffer
- **Error Persistence**: Critical errors saved to localStorage

#### **4. Error Boundaries & Recovery**
```typescript
// Automatic error capture
window.addEventListener('error', (event) => {
  log.error('Uncaught Error', {
    component: 'Global',
    function: 'windowError',
    filename: event.filename,
    lineno: event.lineno
  }, event.error);
});
```

### 📈 **Monitoring & Observability**

#### **Real-time Error Tracking**
- **Error Aggregation**: All errors collected with full context
- **Component Isolation**: Track which components fail most often
- **User Journey**: Full transaction flow with timestamps
- **Network Issues**: RPC failures and timeouts tracked

#### **Performance Monitoring**
- **Transaction Timing**: Full lifecycle from initiation to confirmation
- **RPC Performance**: Multiple endpoint failover tracking
- **Gas Usage**: Actual vs estimated gas tracking
- **User Behavior**: Feature usage analytics

#### **Debug Tools**
```javascript
// Browser console commands
logger.exportLogs()           // Export all logs as JSON
logger.getLogs()              // Get current log buffer
logger.setLevel(LogLevel.DEBUG) // Change log level
logger.clearLogs()            // Clear log buffer

// View error logs
JSON.parse(localStorage.getItem('app_error_logs'))
```

## 🔧 Stage-Debugging Workflow

### **Development Branch Strategy**
```bash
# Switch to enhanced debugging branch
git checkout stage-debugging

# This branch includes:
# - Full TRACE logging enabled
# - Debug UI components
# - Enhanced error boundaries
# - Performance profiling
```

### **Debug Mode Features**
1. **Enhanced Error UI**: Detailed error screens with stack traces
2. **Component Inspector**: Real-time component state monitoring  
3. **Transaction Debugger**: Step-by-step transaction analysis
4. **RPC Monitor**: Live RPC endpoint health tracking

### **Debug Console Integration**
```typescript
// Debug helpers available in development
if (process.env.NODE_ENV === 'development') {
  (window as any).debugLogger = logger;
  (window as any).exportLogs = () => logger.exportLogs();
  (window as any).clearLogs = () => logger.clearLogs();
}
```

## 🛠️ Technical Stack

### Blockchain Layer
- **Blockchain**: Binance Smart Chain (BSC) Testnet
- **Solidity Version**: 0.8.22 with viaIR optimization
- **Framework**: Hardhat 2.23.0 with TypeScript
- **Proxy Pattern**: OpenZeppelin UUPS (Universal Upgradeable Proxy Standard)
- **Security**: OpenZeppelin Contracts v5.3.0 (Upgradeable)

### Smart Contract Architecture
- **LPLocker.sol**: Core LP locking logic (UUPS upgradeable)
- **VCToken.sol**: ERC20 staking token (1B max supply)
- **VGToken.sol**: ERC20 reward token (100M max supply)
- **VGTokenVotes.sol**: ERC20Votes wrapper for governance
- **LPLockerGovernor.sol**: OpenZeppelin Governor implementation
- **TimelockController.sol**: Timelock for critical operations

### Frontend Stack
- **Framework**: React 18.2.0 + TypeScript 5.2.2
- **Build Tool**: Vite 4.5.0 with HMR
- **Web3 Library**: ethers.js v6.8.0
- **UI Framework**: Tailwind CSS 3.3.5 (glassmorphism design)
- **State Management**: React Query 5.8.4 + React Context
- **Routing**: React Router DOM 6.18.0
- **Notifications**: React Hot Toast 2.4.1
- **⭐ Logging**: Enterprise Production Logger (Custom)

### Development Tools
- **Testing**: Hardhat Toolbox with Mocha/Chai
- **Code Quality**: ESLint + Prettier + Solhint
- **Type Safety**: TypeChain for contract types
- **Coverage**: Hardhat Coverage plugin
- **Deployment**: Custom scripts with verification
- **⭐ Monitoring**: Structured logging with context tracking

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

**Purpose**: Main function for creating LP positions and earning VG rewards

**Parameters**:
- `vcAmount`: Amount of VC tokens to stake
- `bnbAmount`: Amount of BNB to add as liquidity (must equal msg.value)
- `slippageBps`: Slippage tolerance in basis points (max 1000 = 10%)

**Process Flow**:
1. Validate input and MEV protection
2. Transfer VC tokens from user
3. Approve VC tokens for PancakeSwap Router
4. Create LP via `addLiquidityETH()`
5. Calculate VG rewards (15 VG per 1 LP token)
6. Transfer VG tokens to user
7. LP tokens are locked in the contract forever

#### Configuration Structure

   ```solidity
struct StakingConfig {
    address authority;           // Contract admin
    address vgTokenAddress;      // VG token for rewards
    address vcTokenAddress;      // VC token for staking
    address pancakeRouter;       // PancakeSwap V2 Router
    address lpTokenAddress;      // VC/WBNB LP token
    address stakingVaultAddress; // VG token vault
    uint256 lpDivisor;          // LP calculation divisor (1,000,000)
    uint256 lpToVgRatio;        // LP to VG ratio (15:1)
    uint256 minBnbAmount;       // Minimum BNB (0.01 BNB)
    uint256 minVcAmount;        // Minimum VC (1 VC)
    uint16 maxSlippageBps;      // Max slippage (1000 = 10%)
    uint16 defaultSlippageBps;  // Default (200 = 2%)
    bool mevProtectionEnabled;   // MEV protection
    uint256 minTimeBetweenTxs;  // Min time between txs (seconds)
    uint8 maxTxPerUserPerBlock; // Max txs per block per user
    uint256 totalLockedLp;      // Total locked LP
    uint256 totalVgIssued;      // Total VG issued
    uint256 totalVgDeposited;   // Total VG deposited
}
```

### Token Contracts

#### VCToken.sol (Value Coin)
- **Address**: `0xC88eC091302Eb90e78a4CA361D083330752dfc9A`
- **Type**: Standard ERC20 token
- **Max Supply**: 1,000,000,000 VC
- **Decimals**: 18
- **Purpose**: Staking token for LP creation

#### VGToken.sol (Value Gold)
- **Address**: `0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d`
- **Type**: ERC20 with owner-controlled minting
- **Max Supply**: 100,000,000 VG
- **Decimals**: 18
- **Purpose**: Reward token for LP staking

#### VGTokenVotes.sol (Value Gold Votes)
- **Address**: `0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA`
- **Type**: ERC20Votes wrapper
- **Ratio**: 1:1 with VGToken
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
│   ├── components/          # React components
│   │   ├── EarnVGWidget.tsx    # Main earnVG component
│   │   ├── VGConverter.tsx     # VG ↔ VGVotes converter
│   │   ├── LPPoolManager.tsx   # Liquidity management
│   │   ├── ErrorBoundary.tsx   # ⭐ Enterprise error handling
│   │   └── TokenBalance.tsx    # Token balances
│   ├── contexts/            # React contexts
│   │   ├── Web3Context.tsx     # Web3 integration
│   │   └── ContractContext.tsx # Contract instances
│   ├── hooks/               # Custom React hooks
│   │   ├── useContract.ts      # Contract interaction
│   │   └── useTokenBalance.ts  # Token balance tracking
│   ├── pages/               # App pages
│   │   ├── Home.tsx           # Home page
│   │   ├── TokenManagement.tsx # Token management
│   │   └── Governance.tsx     # DAO governance
│   ├── constants/           # Config
│   │   ├── contracts.ts       # Contract addresses
│   │   └── abi.ts            # Contract ABIs
│   ├── utils/               # Utilities
│   │   ├── logger.ts          # ⭐ Production Logger
│   │   ├── formatters.ts      # Data formatting
│   │   └── validators.ts      # Input validation
│   └── i18n/                # ⭐ Enhanced i18n with logging
│       ├── index.ts           # i18n config with logger
│       └── locales/           # Language files
├── scripts/                 # Node.js deployment scripts
│   ├── logger.js            # ⭐ Node.js Production Logger
│   ├── deploy-ecosystem.js  # Contract deployment
│   └── fix-vg-ownership.js  # ⭐ Enhanced with logging
```

### Key Components

#### EarnVGWidget.tsx ⭐ Enhanced
Main component for LPLocker contract interaction with production logging:

```typescript
import { log } from '../utils/logger';

// Auto mode detection with logging
const hasLPTokens = lpBalance > 0n;
const mode = hasLPTokens ? 'earn' : 'create';

log.info('Mode detected', {
  component: 'EarnVGWidget',
  function: 'modeDetection',
  mode,
  hasLPTokens
});

// One-click LP creation + VG earning with comprehensive logging
const handleEarnVG = async () => {
  log.info('Starting EarnVG operation', {
    component: 'EarnVGWidget',
    function: 'handleEarnVG',
    address: account,
    vcAmount,
    bnbAmount
  });

  try {
    const tx = await lpLockerContract.earnVG(
      vcAmount,
      bnbAmount,
      slippageBps,
      { value: bnbAmount, gasLimit: 500000 }
    );
    
    log.transaction('EarnVG transaction sent', tx.hash);
    
  } catch (error) {
    log.error('EarnVG failed', {
      component: 'EarnVGWidget',
      function: 'handleEarnVG',
      address: account
    }, error);
  }
};
```

#### Web3Context.tsx ⭐ Enhanced
Centralized Web3 connection management with enterprise logging:

```typescript
import { log } from '../utils/logger';

const Web3Context = createContext({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connectWallet: () => {},
  switchToBSCTestnet: () => {},
});

// Enhanced connection with logging
const connectWallet = async () => {
  log.info('Initiating wallet connection', {
    component: 'Web3Context',
    function: 'connectWallet'
  });
  
  try {
    // Connection logic...
    log.info('Wallet connected successfully', {
      component: 'Web3Context', 
      function: 'connectWallet',
      address: account,
      network: chainId
    });
  } catch (error) {
    log.error('Wallet connection failed', {
      component: 'Web3Context',
      function: 'connectWallet'
    }, error);
  }
};
```

### User Experience Features

1. **One-Click Operations**: Minimal clicks for all main actions
2. **Automatic Network Switching**: Auto switch to BSC Testnet
3. **Real-time Data**: Balances and stats update every 30s
4. **Responsive Design**: Full mobile support
5. **⭐ Enterprise Error Handling**: Detailed error messages with structured logging
6. **⭐ Transaction Tracking**: Full lifecycle monitoring with context
7. **⭐ Debug Tools**: Production-ready debugging and monitoring

## 🚀 Deployment Guide

### Prerequisites

```bash
# Node.js 18+ and npm
node --version  # v18.0.0+
npm --version   # 9.0.0+

# Git for repo cloning
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
# Create .env from example
cp deploy.env.example .env

# Set environment variables
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key

# ⭐ Production Logging Configuration
VITE_ENABLE_LOGGING=true         # Enable logging in production
VITE_LOG_LEVEL=WARN              # Production log level (ERROR, WARN, INFO, DEBUG, TRACE)
VITE_SENTRY_DSN=your_sentry_dsn  # Optional: Error tracking service
VITE_LOG_BUFFER_SIZE=1000        # Log buffer size (default: 1000)
```

### Smart Contract Deployment

#### 1. Deploy Tokens ⭐ Enhanced Logging
```bash
npm run deploy:tokens
```

Deploys with enhanced logging:
- VCToken (Value Coin) - Full deployment logging
- VGToken (Value Gold) - Transaction tracking  
- VGTokenVotes (Governance wrapper) - Configuration logging

#### 2. Deploy Ecosystem ⭐ Enhanced Logging
```bash
npm run deploy:ecosystem
```

Deploys with production monitoring:
- LPLocker (UUPS Proxy) - Full deployment flow tracking
- LockerDAO - Governance setup logging
- LPLockerGovernor - Proposal system monitoring
- TimelockController - Security parameter logging

#### 3. Test Deployment ⭐ Enhanced Validation
```bash
npm run deploy:test
```

Enhanced validation with logging:
- Contract deployment verification
- Configuration correctness checks
- Network connectivity testing
- Transaction parameter validation

### Frontend Deployment

#### Development Server ⭐ Full Debug Mode
```bash
cd frontend
npm run dev

# Full trace logging enabled in development
# Debug console helpers available
# Error boundaries with detailed stack traces
```

#### Production Build ⭐ Optimized Logging
```bash
cd frontend

# Production build with optimized logging
npm run build

# Preview with production logging settings
npm run preview
```

Builds production app in `frontend/dist/` with:
- **Optimized Logging**: Only WARN+ levels in production
- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Bundle size and load time tracking

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

## 🔧 Enhanced API Reference

### Logger API Reference ⭐ NEW

#### Production Logger (`frontend/src/utils/logger.ts`)

```typescript
import { log, logger, LogLevel } from '../utils/logger';

// ===== BASIC LOGGING =====

// Context-aware logging with component tracking
log.error('Transaction failed', {
  component: 'EarnVGWidget',
  function: 'handleEarnVG',
  txHash: '0x123...',
  address: account,
  network: 'BSC Testnet'
}, error);

log.warn('Slippage too high', {
  component: 'LPPoolManager',
  function: 'calculateLiquidity',
  slippage: 15,
  maxSlippage: 10
});

log.info('User wallet connected', {
  component: 'Web3Context',
  function: 'connectWallet',
  address: account,
  network: 'BSC Testnet'
});

log.debug('Pool info fetched', {
  component: 'StakingStats',
  function: 'fetchPoolStats',
  reserves: { vc: '1000', bnb: '10' }
});

// ===== SPECIALIZED LOGGING =====

// Web3-specific logging
log.web3('Provider detected', { provider: 'MetaMask' });
log.transaction('TX confirmed', txHash);
log.contract('Contract call', contractAddress);

// ===== LOGGER MANAGEMENT =====

// Logger configuration
logger.setLevel(LogLevel.DEBUG);        // Change log level
logger.getLevel();                      // Get current level
logger.clearLogs();                     // Clear log buffer
logger.getLogs();                       // Get all logs
logger.exportLogs();                    // Export as JSON

// Production error tracking
const errorLogs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
```

#### Node.js Logger (`scripts/logger.js`)

```javascript
const { log } = require('./logger');

// Section headers for deployment scripts
log.section('Contract Deployment');
log.section('Configuration Setup');

// Deployment logging
log.info('Deploying contract', { name: 'LPLocker' });
log.success('Contract deployed', contractAddress);
log.error('Deployment failed', error);

// Progress tracking
log.progress('Step 1/5: Token deployment');
log.progress('Step 2/5: LP creation');

// Color-coded terminal output
log.highlight('Important configuration');
log.dim('Optional parameter');
```

#### Logger Interfaces

```typescript
// Log context interface
interface LogContext {
  component?: string;           // React component name
  function?: string;           // Function/method name
  userId?: string;             // User identifier
  txHash?: string;             // Transaction hash
  address?: string;            // Wallet/contract address
  network?: string;            // Blockchain network
  [key: string]: any;          // Additional context
}

// Log entry structure
interface LogEntry {
  timestamp: string;           // ISO timestamp
  level: LogLevel;            // Log level enum
  levelName: string;          // Human-readable level
  message: string;            // Log message
  context?: LogContext;       // Structured context
  error?: Error;              // Error object (if applicable)
  data?: any;                 // Additional data
}

// Log levels enum
enum LogLevel {
  ERROR = 0,    // 🚨 Critical errors only
  WARN = 1,     // ⚠️  Warnings and errors  
  INFO = 2,     // ℹ️  General information
  DEBUG = 3,    // 🔍 Development debugging
  TRACE = 4,    // 📍 Detailed execution flow
}
```

### LPLocker Contract API

#### Read Functions

```solidity
// Get full contract configuration
function config() external view returns (StakingConfig memory)

// Check last transaction block for user
function lastUserTxBlock(address user) external view returns (uint256)

// Get last transaction timestamp for user
function lastUserTxTimestamp(address user) external view returns (uint256)

// Get user transaction count in current block
function userTxCountInBlock(address user) external view returns (uint8)
```

#### Write Functions

```solidity
// Main function to get VG tokens
function earnVG(
    uint256 vcAmount,
    uint256 bnbAmount,
    uint16 slippageBps
) external payable

// Deposit VG tokens to vault (only authority)
function depositVGTokens(uint256 amount) external onlyAuthority

// Update configuration (only authority)
function updateConfig(/* parameters */) external onlyAuthority

// Enable/disable MEV protection
function setMevProtection(bool enabled) external onlyAuthority
```

### Token Contract APIs

#### VGTokenVotes (Governance)

```solidity
// Convert VG → VGVotes for voting
function deposit(uint256 amount) external

// Convert VGVotes → VG
function withdraw(uint256 amount) external

// Get voting power for user
function getVotes(address account) external view returns (uint256)

// Delegate voting power
function delegate(address delegatee) external
```

### Frontend API Integration

#### Contract Interaction Example

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from './constants/contracts';
import { LP_LOCKER_ABI } from './constants/abi';

// Initialize contract
const lpLockerContract = new ethers.Contract(
  CONTRACTS.LP_LOCKER,
  LP_LOCKER_ABI,
  signer
);

// Call earnVG function
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
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Ownable**: Access control to administrative functions
- **UUPS Upgradeable**: Safe contract upgrades
- **ERC20Votes**: Standardized governance system

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
- **Dynamic Calculation**: Automatic minimum amounts calculation
- **User Control**: User can set slippage from 0.1% to 10%

#### 4. Input Validation
```solidity
require(vcAmount >= config.minVcAmount, "VC amount too low");
require(bnbAmount >= config.minBnbAmount, "BNB amount too low");
require(msg.value == bnbAmount, "BNB amount mismatch");
require(slippageBps <= config.maxSlippageBps, "Slippage too high");
```

### Frontend Security

#### 1. Web3 Security
- **Network Validation**: Automatic BSC Testnet connection check
- **Contract Verification**: Contract address verification before interaction
- **Transaction Simulation**: Transaction pre-check

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
- **Comprehensive Error Messages**: Detailed error messages for each error type
- **Fallback Mechanisms**: Backup RPC endpoints for BSC
- **Transaction Recovery**: Ability to retry failed transactions

## 🧪 Testing

### Smart Contract Tests

#### Test Coverage: 100% (86/86 tests passed)

```bash
# Run all tests
npm run test:full

# Test individual components
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
# Test deployed contracts
npm run deploy:test

# Check LP pool functionality
node scripts/test-lp-pool.js

# Check governance system
node scripts/test-governance.js
```

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. "Internal JSON-RPC error"
**Cause**: Unstable BSC Testnet RPC or incorrect transaction parameters

**Solution**:
```typescript
// Use fallback RPC endpoints
const fallbackRpcs = [
  'https://data-seed-prebsc-1-s1.binance.org:8545/',
  'https://data-seed-prebsc-2-s1.binance.org:8545/',
];

// Increase gas limit
const tx = await contract.earnVG(vcAmount, bnbAmount, slippage, {
  gasLimit: 500000, // Increased gas limit
  gasPrice: ethers.parseUnits('20', 'gwei')
});
```

#### 2. "Slippage exceeded"
**Cause**: Slippage exceeds maximum allowed (10%) or insufficient liquidity

**Solution**:
```typescript
// Automatic slippage adjustment
const maxSlippage = await lpLockerContract.config().maxSlippageBps;
const adjustedSlippage = Math.min(requestedSlippage, maxSlippage);
```

#### 3. "MEV protection violated"
**Cause**: Too frequent transactions (less than 300 seconds between attempts)

**Solution**:
```typescript
// Check last transaction time
const lastTxTime = await lpLockerContract.lastUserTxTimestamp(userAddress);
const currentTime = Math.floor(Date.now() / 1000);
const timeDiff = currentTime - lastTxTime;

if (timeDiff < 300) {
  const waitTime = 300 - timeDiff;
  alert(`Please wait ${waitTime} seconds before next transaction`);
}
```

#### 4. "Cannot convert 1e+30 to a BigInt"
**Cause**: Mathematical overflow when working with large numbers

**Solution**:
```typescript
// Use BigInt arithmetic
const calculateVGReward = (lpAmount: bigint): bigint => {
  return lpAmount * 15n; // Use BigInt literals
};

// Avoid Number() conversion for large BigInts
const formatAmount = (amount: bigint): string => {
  return ethers.formatEther(amount); // Direct conversion
};
```

#### 5. Pool Information shows zeros
**Cause**: Incorrect LP token address or empty pool

**Solution**:
```typescript
// Check LP token address correctness
const LP_TOKEN = "0xA221093a37396c6301db4B24D55E1C871DF31d13"; // Correct address

// Check pool liquidity
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

Outputs:
- Current LPLocker configuration
- MEV protection status
- Available VG tokens in vault
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
   - Use `viaIR: true` for compiler optimization
   - Efficient storage layout in structs
   - Minimal external calls

2. **Batch Operations**
   - Group multiple updates into one transaction
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
