# Ecosystem Tokens

## Token Overview

The VC/VG ecosystem consists of three main types of tokens:

1. **VC Token** – the main ecosystem token with zero tax (0%)
2. **VG Token** – governance token with a 10% tax
3. **LP Token** – liquidity token for the VC/BNB pair

Each token has its unique role in the ecosystem and provides specific functionality. This document details the characteristics, emission, distribution, and usage of each token.

## VC Token

VC Token is the main token of the ecosystem, used for creating LP tokens, staking to receive NFT boosters, and paying for services in the TECH HY ecosystem.

### Characteristics

- **Ticker**: VC
- **Type**: ERC-20
- **Blockchain**: BSC (Binance Smart Chain)
- **Decimals**: 18
- **Tax**: 0%
- **Total Supply**: 5,000,000,000 VC

### Technical Parameters

- **No Mint Function**: Disabled after deployment
- **Pause Function**: None
- **Token metadata**:
  - **Name**: TECH HY Venture Club Token
  - **Symbol**: VC
  - **Contract Address**: Will be set after deployment

### Usage

1. **Creating LP tokens**:
   - Adding VC/BNB liquidity via the "Burn and Earn" mechanism
   - Staking 1M tokens for 90 days to receive an NFT booster

2. **Financial instruments**:
   - Nominal value 1 VC = $1 for paying for services in the ecosystem
   - Pay up to 50% of TECH HY services with VC (percentage depends on DAO level)
   - Used as collateral for TECH HY Venture Club Fund
   - Used as collateral for Success Fee Deposit

3. **Access to exclusive features**:
   - Spend 1,000,000 VC to get lifetime access to TECH HY Investors Private Club
   - Receive cashback in VC for purchasing services in the B2B Marketplace
   - Participate in LP BNB-VC farming on PancakeSwap

### Implementation

VC Token is implemented as a standard ERC-20 token with no modifications to transfer logic. Main functions include:

- Token initialization with specified parameters
- Standard transfer operations with no additional fees
- Interaction with other ecosystem components via contract calls

#### Contract Interface (API)

```solidity
// IERC20 standard interface
interface IVCToken is IERC20 {
    /// Token initialization
    function initialize() external;
    /// Transfer tokens from one account to another
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

interface IVCTokenAdmin {
    function updateMetadata(string calldata newUri) external;
    function transferOwnership(address newOwner) external;
}
```

## VG Token

VG Token is a governance token with a 10% transaction tax, used for ecosystem governance via DAO. VG cannot be bought directly; it can only be obtained through ecosystem mechanisms.

### Characteristics

- **Ticker**: VG
- **Type**: ERC-20 with transfer tax
- **Blockchain**: BSC (Binance Smart Chain)
- **Decimals**: 18
- **Tax**: 10% of transaction amount
- **Total Supply**: 1,000,000,000 VG
- **Tokens for sale**: 0% (cannot be bought directly)
- **Tax distribution**:
  - 50% to NFT Fee Key holders
  - 50% to DAO treasury

### Technical Parameters

- **Mint Function**: Disabled after deployment (tokens are pre-minted at initialization)
- **Not for sale or purchase, only obtainable via permanent lock of VC/BNB LP tokens and distributed by the Burn and Earn contract from the initial pool**
- **Pause Function**: None
- **Token metadata**:
  - **Name**: TECH HY Venture Gift Token
  - **Symbol**: VG
  - **Contract Address**: Will be set after deployment

### Tax Account Structure

To manage the tax, the following storage variables and contracts are used:

1. **TaxConfig (Storage)** – stores tax parameters:
   ```solidity
   struct TaxConfig {
       uint16 taxRate;          // 10% = 1000 (base 10000)
       uint16 daoShare;         // 50% = 5000 (base 10000)
       uint16 nftHoldersShare;  // 50% = 5000 (base 10000)
       address daoTreasury;     // DAO treasury address
       address authority;       // DAO multisig address
   }
   ```

2. **NFTHoldersPool (Storage)** – temporary storage for taxes for NFT holders:
   ```solidity
   struct NFTHoldersPool {
       uint256 totalCollected;     // Total tax collected
       uint256 lastDistribution;   // Last distribution time
       uint256 distributionPeriod; // Distribution period (in seconds)
   }
   ```

3. **NFTHolderInfo (Mapping)** – stores info about NFT share:
   ```solidity
   struct NFTHolderInfo {
       uint256 nftTokenId;       // NFT token ID
       address owner;            // NFT owner
       uint16 tierMultiplier;    // NFT tier multiplier (base 1000)
       uint256 lockedLpAmount;   // Amount of locked LP
       uint16 sharePercentage;   // Share of total pool (base 10000)
       uint256 lastClaimed;      // Last reward claim time
   }
   ```

### Tax Implementation

VG token transaction tax is implemented by overriding the transfer functions:

1. **Implementation method**: Custom ERC-20 implementation with tax logic

2. **Tax collection process**:
   ```solidity
   // Pseudocode
   function _transfer(address from, address to, uint256 amount) internal override {
       // Calculate tax
       uint256 taxAmount = amount * taxRate / 10000;
       uint256 userAmount = amount - taxAmount;
       
       // Calculate shares
       uint256 daoAmount = taxAmount * daoShare / 10000;
       uint256 nftAmount = taxAmount - daoAmount;
       
       // Transfer main amount
       super._transfer(from, to, userAmount);
       
       // Transfer tax
       super._transfer(from, daoTreasury, daoAmount);
       super._transfer(from, address(this), nftAmount);
       
       // Update tax pool data
       _updateNftHoldersPool(nftAmount);
   }
   ```

### Contract Interface (API)

```solidity
// Main interface
interface IVGToken is IERC20 {
    /// Initialize tax config
    function initializeTaxConfig(
        uint16 taxRate,
        uint16 daoShare,
        uint16 nftHoldersShare
    ) external;
    
    /// Update tax parameters (DAO only)
    function updateTaxConfig(
        uint16 taxRate,
        uint16 daoShare,
        uint16 nftHoldersShare
    ) external;
    
    /// Transfer tokens with tax
    function transfer(address to, uint256 amount) external returns (bool);
    
    /// Distribute tax among NFT holders
    function distributeNFTHoldersRewards() external;
    
    /// Claim NFT holder reward
    function claimNFTHolderReward(uint256 nftTokenId) external;
    
    /// Set tax exemption
    function setTaxExempt(address account, bool exempt) external;
}
```

### Usage

1. **VG token staking**:
   - Lock for a period depending on token amount
   - Apply NFT boosters to improve staking conditions
   - Automatic reinvestment for large stakes
   - Receive passive income from:
     - 50% of DAO income
     - 10% fee from every VG transaction
     - VC staking reward pool
     - Trading fees from PancakeSwap (Burn & Earn contract)

2. **Ecosystem governance (DAO)**:
   - Vote on proposals
   - Make decisions on ecosystem development
   - Manage smart contract parameters
   - Participate in investment committee (for certain levels)

3. **Access to privileges**:
   - Access to special DAO levels from Starter to Partner (depending on amount)
   - Receive additional drops and boosters
   - Access to exclusive community events

### Implementation

VG Token is implemented as a modified ERC-20 token with additional logic for tax collection and distribution. Key aspects:

- Initialization with tax rate and distribution parameters
- Modified transfer function that collects tax
- Mechanism for distributing tax among recipients
- Integration with DAO treasury and buyback system

## LP Token

LP Token is the liquidity token for the VC/BNB pair, created via PancakeSwap and used in the "Burn and Earn" mechanism.

### Characteristics

- **Type**: Standard PancakeSwap LP token (ERC-20)
- **Pair**: VC/BNB
- **Usage**: Permanent lock, no withdrawal possible

### Technical Implementation

- **PermanentLockVault (Storage)** – storage for locked LP tokens:
  ```solidity
  struct PermanentLockVault {
      uint256 totalLockedLp;            // Total locked LP
      uint256 totalWeightedLockedLp;    // Weighted LP sum (with NFT multipliers)
      address lpToken;                  // LP token contract address
      address authority;                // Contract authority
  }
  ```

- **UserLockInfo (Mapping)** – stores lock info:
  ```solidity
  struct UserLockInfo {
      address user;                // User address
      uint256 lockedLpAmount;      // Amount of locked LP
      uint256 lockTimestamp;       // Lock time
      uint256 vgReceived;          // Amount of VG received
      uint256 nftTokenId;          // Token ID of issued NFT (if any)
  }
  ```

### Implementation

LP tokens are created via PancakeSwap integration and locked in a special vault. The process includes:

- Creation via PancakeSwap integration
- Locking in PermanentLockVault storage
- Minting VG tokens proportional to locked LP
- Creating NFT Fee Key for receiving part of tax revenue

### Contract Interface (API)

```solidity
// Main interface
interface ILPLocker {
    /// Initialize vault for locking LP tokens
    function initializeLockVault(address lpToken) external;
    
    /// Lock LP tokens and receive VG + NFT
    function lockLPTokens(uint256 amount) external;
    
    /// Get lock info
    function getUserLockInfo(address user) external view returns (UserLockInfo memory);
    
    /// Get total locked LP
    function getTotalLockedLP() external view returns (uint256);
}
```

## Token Interactions in the Ecosystem

### VC Token Circulation

1. **VC tokens**:
   - Free transfer with no tax
   - Add liquidity to create LP tokens (Burn and Earn mechanism)
   - Stake for NFT boosters

### VG Token Circulation

1. **VG tokens**:
   - Created when locking LP
   - Staked for ecosystem governance
   - 10% tax on all transactions

### LP Token Circulation

1. **LP tokens**:
   - Created from VC/BNB pair
   - Permanently locked
   - Generate VG and NFT Fee Key

## Further Materials

- [System Architecture](./01-system-architecture.md)
- ["Burn and Earn" Mechanism](./03-burn-and-earn.md)
- [VG Token Calculation Formula](./specs/vg-calculation-formula.md) 