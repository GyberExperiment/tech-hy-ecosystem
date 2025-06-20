# System Architecture

## General Architecture

The architecture of the VC/VG token ecosystem on BSC (Binance Smart Chain) is a set of interconnected smart contracts that ensure the functioning of all ecosystem components. The system is designed with security, scalability, and BSC gas optimization in mind.

## System Components

The system consists of three main groups of components:

1. **Token Contracts** - ERC-20 contracts for token management
2. **Smart Contracts** - contracts for business logic implementation
3. **External Integrations** - integrations with external BSC protocols

### 1. Token Contracts

#### 1.1 VC Token (ERC-20 without tax)
- Standard ERC-20 token
- Zero tax (0%)
- Used for LP and staking

#### 1.2 VG Token (ERC-20 with 10% tax)
- ERC-20 token with modified transfer logic
- 10% tax on all transactions
- Tax distribution:
  - 50% to NFT Fee Key holders
  - 50% to DAO treasury

#### 1.3 LP Token (ERC-20 for VC/BNB pair)
- Standard PancakeSwap LP token
- Permanent lock, no withdrawal possible
- Proportional VG token issuance upon lock

### 2. Smart Contracts

#### 2.1 LP Locker Contract
- Checks and manages the VC/BNB pair in the required proportion
- Adds liquidity to the PancakeSwap pool
- Creates and locks LP tokens
- Issues VG tokens and NFT Fee Key

#### 2.2 VC Staking Contract
- Locks 1M VC tokens for 90 days
- Creates NFT booster via ERC-721
- Controls staking period and token withdrawal

#### 2.3 VG Staking Contract
- Locks VG tokens for a period depending on amount and NFT booster
- Autocompounding for stakes over 10,000 VG
- Applies NFT boosters to reduce period

#### 2.4 NFT Fee Key Contract
- Creates ERC-721 NFT with a certain level (Common, Rare, Epic, Legendary)
- Calculates share in the fee pool by formula
- Withdraws accumulated rewards

#### 2.5 Governance Contract
- Integrates with OpenZeppelin Governor
- Creates and executes proposals
- Voting and updating ecosystem parameters

### 3. External Integrations

#### 3.1 PancakeSwap Integration
- Creates VC/BNB liquidity pools
- Swaps VC for BNB
- Adds liquidity and creates LP tokens

#### 3.2 ERC-721 Integration
- Creates NFT boosters
- Creates NFT Fee Key
- Updates NFT metadata

#### 3.3 OpenZeppelin Governor Integration
- Creates and manages DAO
- Proposals and voting
- Executes approved proposals

## Component Interactions

### "Burn and Earn" Mechanism
```
[User] → [VC tokens] → [LP Locker Contract] → [LP tokens] → [Permanent Lock]
                                      ↓
                              [PancakeSwap] → [VG tokens + NFT Fee Key] → [User]
```

### VC Token Staking
```
[User] → [VC tokens] → [VC Staking Contract] → [NFT booster] → [User]
                                      ↓
                               [ERC-721 NFT]
```

### VG Token Staking
```
[User] → [VG tokens + NFT booster] → [VG Staking Contract]
                                                  ↓
                          [Reinvest 70%] ← + → [Withdraw 30%] → [User]
```

## Tech Stack
- Blockchain: BSC (Binance Smart Chain)
- Programming language: Solidity
- Framework: Hardhat/Foundry
- Token standard: ERC-20
- NFT standard: ERC-721
- AMM: PancakeSwap
- Governance: OpenZeppelin Governor

## Security Requirements
1. **Secure data storage**:
   - Use proper access control patterns
   - Multi-level transaction signature checks

2. **Attack protection**:
   - Reentrancy attack protection
   - Input and limit validation
   - Token price manipulation protection

3. **Gas optimization**:
   - Minimize gas consumption per transaction
   - Optimize storage usage
   - Efficient contract interactions

## Further Materials

- [Ecosystem Tokens](./02-tokens.md)
- ["Burn and Earn" Mechanism](./03-burn-and-earn.md)
- [Data Structures](./specs/data-structures.md)
- [Implementation Plan](./10-implementation-plan.md) 
