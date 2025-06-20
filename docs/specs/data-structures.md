# Data Structures

This document describes the main data structures used in the smart contracts of the VC/VG token ecosystem.

## Tokens

### Token Metadata

Structure for storing token metadata, including:
- Token name
- Symbol
- Number of decimals
- Mint address
- Authority address
- Freeze authority address
- Tax rate (VG token only)

### Tax Parameters

Structure for storing tax parameters:
- Tax rate
- Fee distribution percentage
- Buyback percentage
- DAO allocation percentage
- Authority address
- Bump

### Tax Distribution Statistics

Structure for storing tax distribution statistics:
- Total tax collected
- Total fees distributed
- Total buyback amount
- Total DAO allocation
- Bump

## "Burn and Earn" Mechanism

### Permanent LP Token Lock Vault

Structure for storing information about the permanent LP token lock vault:
- Authority address
- LP token mint address
- LP token account address
- Total locked amount
- Number of locks
- Bump

### User LP Token Lock Info

Structure for storing information about a user's LP token lock:
- User address
- Locked amount
- Lock timestamp
- Amount of VG tokens received
- Fee key mint
- Bump

### "Burn and Earn" Statistics

Structure for storing "Burn and Earn" statistics:
- Total VC converted
- Total LP locked
- Total VG minted
- Total fee keys created
- Total transactions
- Bump

## NFT Fee Key

### NFT Fee Key Account

Structure for storing NFT Fee Key account info:
- Owner address
- Locked LP token amount
- Lock timestamp
- Fee share percentage
- Level (1 - Common, 2 - Rare, 3 - Epic, 4 - Legendary)
- Last claim timestamp
- Total fees received
- Bump

### Fee Distribution Vault

Structure for storing fee distribution vault info:
- Authority address
- Token account address
- Total fees collected
- Total fees distributed
- Last distribution timestamp
- Bump

## VC Token Staking

### VC Staking Account

Structure for storing VC staking account info:
- Owner address
- Staked amount
- Staking timestamp
- Unlock timestamp
- NFT mint
- Unlock flag
- Bump

### NFT Booster Account

Structure for storing NFT booster account info:
- Owner address
- VC staking account address
- Booster multiplier
- Status (1 - Active, 2 - Used, 3 - Expired)
- VG staking account address
- Bump

### VC Staking Vault

Structure for storing VC staking vault info:
- Authority address
- Token account address
- Total staked amount
- Total stakers
- Bump

## VG Token Staking

### VG Staking Account

Structure for storing VG staking account info:
- Owner address
- Staked amount
- Staking timestamp
- Unlock timestamp
- NFT booster flag
- NFT booster address
- Auto-compounding flag
- Compounded amount
- Withdrawn amount
- Unlock flag
- Bump

### VG Staking Statistics

Structure for storing VG staking statistics:
- Total staked amount
- Total stakers
- Total with boosters
- Total auto-compoundings
- Bump

### VG Staking Vault

Structure for storing VG staking vault info:
- Authority address
- Token account address
- Total staked amount
- Bump

## Governance and DAO

### DAO Governance Parameters

Structure for storing DAO governance parameters:
- Realm address
- Governance address

- Staking parameters:
  - Minimum staking amount
  - Base staking period
  - Auto-compounding threshold
  - Compounding percentage

- Tax parameters:
  - Tax rate
  - Fee distribution percentage
  - Buyback percentage
  - DAO allocation percentage

- "Burn and Earn" parameters:
  - LP to VG conversion coefficient
  - Bonus coefficient

- Authority address
- Bump

### DAO Treasury Vault

Structure for storing DAO treasury vault info:
- Authority address
- Token account address
- Total received amount
- Total spent amount
- Bump

## External Service Integration Accounts

### Raydium Integration

Structure for storing Raydium integration info:
- AMM identifier
- Pool coin token account address
- Pool PC token account address
- LP mint
- Authority address
- Bump

### Metaplex Integration

Structure for storing Metaplex integration info:
- Metadata program address
- Token metadata program address
- Authority address
- Bump

### Realms Integration

Structure for storing Realms integration info:
- Realm address
- Governance address
- Governance program address
- Authority address
- Bump 