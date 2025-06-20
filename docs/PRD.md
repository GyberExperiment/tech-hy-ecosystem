# PRD: TECH HY Ecosystem

## 1. Introduction

### 1.1. Vision
Create a comprehensive and self-sufficient decentralized financial ecosystem on BSC (Binance Smart Chain), providing users with innovative tools for asset management, project participation, and income generation.

### 1.2. Goals
- Develop and implement two interconnected tokens (VC and VG) with unique economic models.
- Implement a "Burn and Earn" mechanism to incentivize liquidity provision and governance token distribution.
- Create flexible staking programs for VC and VG tokens using NFT boosters.
- Introduce decentralized governance (DAO) based on OpenZeppelin Governor framework.
- Ensure high security, transparency, and usability for all participants.

## 2. System Architecture

### 2.1. High-Level Overview
The TECH HY ecosystem architecture on BSC is a set of interconnected smart contracts ensuring all component functionality. The system is designed for security, scalability, and BSC gas optimization.

### 2.2. Key Components
1. **Token Contracts**: Manage main ecosystem tokens (ERC-20).
2. **Smart Contracts**: Implement core business logic and mechanics.
3. **NFTs**: Specialized tokens for extended functionality and privileges (ERC-721).
4. **External Integrations**: Interact with existing BSC protocols.

### 2.3. Tech Stack
- **Blockchain**: BSC (Binance Smart Chain)
- **Language**: Solidity
- **Framework**: Hardhat/Foundry
- **Token Standard**: ERC-20, ERC-20 with transfer tax (VG)
- **NFT Standard**: ERC-721
- **AMM**: PancakeSwap
- **Governance (DAO)**: OpenZeppelin Governor

## 3. Key Components — Detailed Specs

### 3.1. Tokens

#### 3.1.1. VC Token (TECH HY Venture Card Token)
- **Purpose**: Main utility token, used for LP creation, staking for NFT boosters, and service payments.
- **Specs**:
  - **Ticker**: VC
  - **Type**: ERC-20
  - **Decimals**: 9
  - **Transaction Tax**: 0%
  - **Total Supply**: 5,000,000,000 VC
- **Technical Params**:
  - **Mint Authority**: None after init
  - **Freeze Authority**: None after init
- **Metadata (example)**:
  - **Name**: TECH HY Venture Card Token
  - **Symbol**: VC
  - **URI**: `https://tech-hy-venture-club.gitbook.io/tech-hy-venture-club-white-paper/10.-dual-token-economy-and-tokenomics/10.1-usdvc-tech-hy-venture-club-utility-community-token`
  - **Image**: `https://techhy.me/images/vc-logo.png`
- **Utility**:
  1. **LP Creation**: Participate in "Burn and Earn" by providing VC (paired with BNB).
  2. **Staking for NFT Booster**: Lock 1,000,000 VC for 90 days to get "Investor's Hand" NFT.
  3. **Financial Tools**: Used for service payments (up to 50%), fund collateral, Success Fee collateral.
  4. **Exclusive Access**: Access to TECH HY Investors Private Club, cashback, LP farming.
- **API / Instructions (example)**:
  ```solidity
  pub enum VCTokenInstruction {
      Initialize,
      Transfer { amount: uint256 },
      AdminOperation { operation_type: AdminOperationType },
  }
  pub enum AdminOperationType {
      UpdateMetadata { new_uri: string },
      TransferAuthority { new_authority: address },
  }
  ```

#### 3.1.2. VG Token (TECH HY Venture Gift Token)
- **Purpose**: Governance token with transaction tax, used for DAO and staking.
- **Specs**:
  - **Ticker**: VG
  - **Type**: ERC-20 with transfer tax
  - **Decimals**: 9
  - **Transaction Tax**: 10%
  - **Total Supply**: 1,000,000,000 VG
- **Technical Params**:
  - **Mint Authority**: None after init
  - **Freeze Authority**: None
- **Metadata (example)**:
  - **Name**: TECH HY Venture Gift Token
  - **Symbol**: VG
  - **URI**: `https://techhy.me/metadata/vg-token.json`
  - **Image**: `https://techhy.me/images/vg-logo.png`
- **Acquisition**:
  - Not sold or bought directly.
  - Distributed by "Burn and Earn" from initial pool (contract issues in exchange for permanent LP lock).
- **Utility**:
  1. **Staking**: Lock for passive income and DAO access.
  2. **Governance (DAO)**: Voting, ecosystem development.
  3. **Privileges**: Multi-level DAO access, drops, boosters.
- **Tax Mechanism (10%)**:
  - **Distribution**:
    - 50% to NFT Fee Key holders.
    - 50% to DAO treasury.
  - **Related Accounts (PDA)**:
    *(Rust structs omitted for brevity, can be translated if needed)*
  - **Implementation**: Custom wrapper over ERC-20, intercepts transfer instructions for tax.
- **API / Instructions (example)**:
  *(Rust enums omitted for brevity, can be translated if needed)*

#### 3.1.3. LP Token (VC/BNB)
- **Purpose**: Represents user share in VC/BNB PancakeSwap pool.
- **Specs**:
  - **Type**: Standard PancakeSwap LP token.
  - **Pair**: VC/BNB.
- **Acquisition**: By providing liquidity (VC and BNB) to PancakeSwap pool.
- **Usage**: Only for "Burn and Earn" — permanent lock in special contract.
- **Technical Implementation**:
  *(Rust structs and enums omitted for brevity)*

### 3.2. NFTs

#### 3.2.1. NFT Fee Key
- **Purpose**: Entitles holder to 50% of VG token tax.
- **Acquisition**: Minted automatically when LP tokens are locked in "Burn and Earn".
- **Specs**: Transferable NFT.
- **Levels and Multipliers** (depend on locked LP amount):
  | Level     | LP Tokens      | Multiplier |
  |-----------|---------------|------------|
  | Common    | < 1,000       | 1.0x       |
  | Rare      | 1,000–9,999   | 1.2x       |
  | Epic      | 10,000–99,999 | 1.5x       |
  | Legendary | ≥ 100,000     | 2.0x       |
- **Metadata (example)**:
  *(JSON omitted for brevity)*
- **Fee Share Formula**:
  `user_share_percentage = (user_locked_lp * tier_multiplier) / total_weighted_locked_lp * 100%`
- **Technical Implementation**:
  *(Details omitted for brevity)*

#### 3.2.2. "Investor's Hand" NFT Collection (Boosters)
- **Purpose**: Improve VG staking (yield, auto-compounding), access to higher DAO levels.
- **Acquisition**:
  1. **VC Staking**: Initial (Paper or Wooden Hand) by staking 1,000,000 VC for 90 days.
  2. **Upgrade**: Level up by staking more VC and burning previous NFT.
  3. **Special Distribution**: Angel Investor NFT (early investors), Titanium/Diamond Hand (major partners), limited partner series.
  4. **Secondary Market**: Buy from others.
- **Levels and Benefits**:
  | NFT Level      | Description | VG Staking Bonus | DAO Access        | Example Acquisition                |
  |----------------|-------------|------------------|-------------------|------------------------------------|
  | Paper Hand     | Basic       | +10% (1.1x)      | -                 | Stake 1M VC (30 days)              |
  | Wooden Hand    | Entry       | +25% (1.25x)     | -                 | Upgrade from Paper / Stake 1M VC   |
  | Steel Hand     | Mid         | +50% (1.5x)      | Investor          | Upgrade from Wooden                |
  | Titanium Hand  | Advanced    | +75% (1.75x)     | Launchpad Master  | Upgrade from Steel / Special dist. |
  | Diamond Hand   | Top         | +100% (2.0x)     | Partner           | Upgrade from Titanium / Special    |
  | Angel Investor | Exclusive   | +100% (2.0x)     | Angel (all levels)| Presale from 50 BNB, daily autocomp|
  | Limited Edition| Partner     | +15% (1.15x)     | -                 | Partner platform presales          |
- **Upgrade System**:
  | Current        | Target        | Extra VC Stake | Stake Period | Action with Current NFT |
  |----------------|--------------|---------------|--------------|------------------------|
  | -              | Paper Hand   | 1,000,000 VC  | 30 days      | -                      |
  | Paper Hand     | Wooden Hand  | 1,500,000 VC  | 60 days      | Burn                   |
  | Wooden Hand    | Steel Hand   | 2,500,000 VC  | 90 days      | Burn                   |
  | Steel Hand     | Titanium Hand| 4,000,000 VC  | 180 days     | Burn                   |
  | Titanium Hand  | Diamond Hand | 6,000,000 VC  | 365 days     | Burn                   |
- **NFT Metadata (example)**:
  *(JSON omitted for brevity)*

- **Technical Implementation**:
  *(Details omitted for brevity)*

### 3.3. Program Contracts (Smart Contracts)

#### 3.3.1. LP Formation Program ("Burn and Earn")
- **Purpose**: Convert VC and BNB into permanently locked LP tokens, distribute VG tokens, and create NFT Fee Key.
- **Key Logic**:
  1. User provides VC and BNB.
  2. Program interacts with PancakeSwap to create LP tokens.
  3. LP tokens are locked in `PermanentLockVault` (PDA).
  4. VG tokens calculated and transferred to user.
  5. NFT Fee Key is created and transferred to user.
- **Data Structures**:
  *(Omitted for brevity)*
- **API / Instructions (example)**:
  *(Omitted for brevity)*

#### 3.3.2. VC Staking Program (and "Investor's Hand" NFT management)
- **Purpose**: Manage VC staking and full NFT booster lifecycle.
- **Key Logic**:
  1. **Staking and Minting NFT**: User stakes VC, program locks VC and mints NFT.
  2. **NFT Upgrade**: User stakes more VC, burns current NFT, mints next-level NFT.
  3. **Unstaking VC**: After lock period, user can withdraw VC. NFT remains.
  4. **Admin Functions**: Mint special NFTs (Titanium, Diamond, Angel).
- **Data Structures**:
  *(Omitted for brevity)*
- **API / Instructions (example)**:
  *(Omitted for brevity)*

#### 3.3.3. VG Staking Program
- **Purpose**: VG staking for DAO, rewards, NFT booster usage.
- **Key Logic**:
  1. **Staking**: User specifies VG amount and optional NFT.
  2. **Tax**: Program calls VG Token contract, which withholds 10% tax.
  3. **Terms**: Staking period, DAO level, and bonuses determined by staked VG and NFT.
  4. **Booster Application**: NFT multiplier applied to stake/rewards.
  5. **Auto-compounding**: For certain DAO levels or >10,000 VG staked.
  6. **Unstaking**: User can withdraw VG (minus tax) after period or early (if allowed).
- **Data Structures**:
  *(Omitted for brevity)*
- **API / Instructions (example)**:
  *(Omitted for brevity)*

#### 3.3.4. NFT Fee Key Program
- **Purpose**: Manage NFT Fee Key creation and rewards.
- **Key Logic**:
  1. **NFT Creation**: Called by "Burn and Earn", mints NFT, sets level, saves metadata.
  2. **Reward Claim**: NFT holder claims, program calculates and transfers VG.
  3. **Share Update**: Periodic or triggered recalculation of shares.
- **Data Structures**:
  *(Omitted for brevity)*
- **API / Instructions (example)**:
  *(Omitted for brevity)*

#### 3.3.5. Governance Program (DAO)
- **Purpose**: Decentralized governance via staked VG token voting.
- **Key Logic**:
  1. **OpenZeppelin Integration**: Create/configure realm in OpenZeppelin Governor framework.
  2. **Proposals**: VG stakers (min. 10,000) can create proposals.
  3. **Voting**: VG stakers (min. 100) vote. Weight = staked VG. Voting period (e.g., 7 days), quorum (e.g., 30% of active VG stake).
  4. **Execution**: Accepted proposals executed via DAO Executor.
  5. **DAO Treasury**: Managed by voting, funded by 50% VG tax and donations.
  6. **Emergency Management**: Multisig for critical actions.
- **Managed Params (examples)**:
  - VG tax rate (5–15%)
  - VG tax distribution proportions
  - Burn and Earn formula coefficients
  - NFT Fee Key parameters
  - VC/VG staking terms
- **API / Instructions**: Mainly OpenZeppelin protocol, plus custom for DAO Executor/treasury.
- **External Dependencies**: OpenZeppelin protocol.

## 4. Key Mechanics — Summary

### 4.1. "Burn and Earn" Flow
User (VC + BNB) → [PancakeSwap] → LP Tokens → [Burn and Earn: LP Lock] → User receives: VG Tokens + NFT Fee Key.

### 4.2. VC Staking and "Investor's Hand" NFT Flow
User (VC) → [VC Staking: VC Lock] → User receives "Investor's Hand" NFT.
User (existing NFT + extra VC) → [VC Staking: Burn old NFT, Lock extra VC] → User receives upgraded NFT.

### 4.3. VG Staking Flow
User (VG Tokens + optional NFT) → [VG Staking: VG Lock (with tax)] → DAO participation + rewards (with NFT boost).

### 4.4. VG Token Tax Collection and Distribution
Any VG transfer/stake/unstake → [VG Token Contract: 10% tax] → 50% to NFT Fee Key Pool + 50% to DAO Treasury.

## 5. External Integrations
- **PancakeSwap**: For VC/BNB liquidity pools and LP tokens in "Burn and Earn".
- **ERC-721**: For minting, updating, and burning all NFTs (NFT Fee Key, "Investor's Hand").
- **OpenZeppelin**: For DAO infrastructure (proposals, voting, treasury management).

## 6. Security Aspects
- All contracts must be thoroughly audited.
- Use PDA for key data and authority management.
- Strict signature and authority checks in all instructions.
- Validate all inputs to prevent misuse.
- Protect against common attack vectors (reentrancy, integer overflow/underflow, etc.).
- Restrict admin functions, use multisig for critical ops.
- Transparency of all contract operations and states.

## 7. User Interface (UI/UX) — Recommendations
A web interface should provide:
- **Token Management**: Balances, transaction history.
- **"Burn and Earn"**: Interface for providing VC/BNB, getting/locking LP, viewing VG/NFT Fee Key.
- **VC Staking**: Interface for staking VC, viewing stakes, terms, NFTs, NFT upgrades.
- **VG Staking**: Interface for staking VG, choosing NFT booster, viewing stakes, yield, claiming rewards, unstaking.
- **NFT Management**: View all user NFTs, attributes, list for sale.
- **DAO (Governance)**:
  - View active/completed proposals.
  - Create proposals (for eligible users).
  - Vote on proposals.
  - Track DAO treasury.
- Intuitive design, mobile-friendly, clear instructions and tooltips. 