# Investor's Hand NFT Integration

## Overview

This document describes the integration of the "Investor's Hand" NFT collection into the TECH HY ecosystem, including its use as a booster in staking and other mechanisms.

## NFT Collection Description

- The "Investor's Hand" collection consists of unique NFTs with different rarity levels (Common, Rare, Epic, Legendary).
- Each NFT has metadata including:
  - Unique identifier
  - Rarity
  - Image/animation
  - Owner address
  - Booster multiplier value

## Use Cases in the Ecosystem

### 1. Staking Booster
- NFTs from the collection can be used as boosters when staking VG tokens.
- The booster multiplier depends on the NFT's rarity:
  - Common: 0.1
  - Rare: 0.2
  - Epic: 0.3
  - Legendary: 0.5
- Only one NFT can be used as a booster per staking position.
- The NFT must be owned by the user and locked for the staking period.

### 2. DAO Voting Power
- Holding an NFT increases the user's voting power in the DAO.
- The increase is proportional to the NFT's rarity.

### 3. Additional Ecosystem Benefits
- Access to exclusive features, airdrops, or events for NFT holders.
- Priority participation in ecosystem launches.

## Integration Process

1. **NFT Ownership Verification**:
   - The system checks that the user owns the NFT and that it is not used in another staking position.
2. **NFT Locking**:
   - The NFT is locked for the duration of the staking or until the user withdraws their position.
3. **Booster Application**:
   - The booster multiplier is applied to the staking reward formula.
4. **Unlocking**:
   - After the staking period ends, the NFT is unlocked and returned to the user.

## Security and Fairness Considerations

- Only NFTs from the official "Investor's Hand" collection are eligible.
- The system prevents double use of the same NFT in multiple positions.
- All operations are transparent and verifiable on-chain.

## Smart Contract Requirements

- NFT ownership and locking logic must be implemented in the staking contract.
- Booster multipliers must be read from NFT metadata.
- The contract must support unlocking and returning NFTs after staking ends.

## Example Workflow

1. User selects an NFT from their wallet to use as a booster.
2. The system verifies ownership and locks the NFT.
3. The user stakes VG tokens, and the booster is applied.
4. After the staking period, the user withdraws their tokens and the NFT is unlocked.

## Program Interaction Schemes

### General Integration Scheme

```
+-------------------+         +----------------------+         +--------------------+
|                   |         |                      |         |                    |
| VC Staking Contract| -----> | Investor's Hand NFT  | -----> | VG Staking Contract|
|                   |         |      Contract        |         |                    |
+-------------------+         +----------------------+         +--------------------+
                                       |
                                       |
                                       v
                              +--------------------+
                              |                    |
                              | Governance Contract|
                              |    (DAO)           |
                              +--------------------+
```

### Detailed Interaction Scheme

```
                                  +-- NFT Minting --+
+------------+    Contract Call    |                |    Metadata     +-----------+
| VC Staking | ----------------> | Investor's Hand | --------------> | ERC-721   |
| Contract   |                    | NFT Contract    |    Creation     | Standard  |
+------------+                   |                |                  +-----------+
      ^                           +----------------+
      |                                  |
      |              NFT Application     |
      |             +-------------------+|
      |             |                    v
      |       +------------+    Contract Call    +------------+
      |       |            | <----------------- |            |
      +-------| VC Token   |   Token Transfer   | VG Staking |
              | Contract   |                    | Contract   |
              +------------+                    +------------+
                                                      |
                                                      |
                        +-------------+               |
                        |             |   Staking     |
                        | Governance  | <-------------+
                        | Contract    |   Status
                        +-------------+
```

## Technical Integration Details with VC Staking Contract

### 1. NFT Creation through VC Token Staking

Integration process between VC Staking Contract and Investor's Hand NFT Contract:

- VC Staking Contract calls mint_nft function in Investor's Hand NFT Contract
- User and VC staking data is passed
- NFT is created with appropriate level depending on staking

### 2. NFT Creation Processing in Investor's Hand NFT Contract

- Authorization verification of call from VC Staking Contract
- NFT account initialization with corresponding parameters
- Setting booster multiplier based on NFT level
- Creating NFT metadata via ERC-721 standard

## Technical Integration Details with VG Staking Contract

### 1. Applying NFT Booster during VG Staking

- NFT owner verification
- Verification that NFT is not used in another staking
- Applying NFT booster through Investor's Hand NFT Contract call
- Checking requirements for higher DAO levels
- Determining staking period considering NFT booster

### 2. NFT Application Processing in Investor's Hand NFT Contract

- NFT owner verification
- NFT status verification (not in use)
- Updating NFT status as used for VG staking
- Saving link with VG staking account

### 3. NFT Booster Deactivation after VG Staking Completion

- When unstaking VG, check for NFT booster presence
- Call NFT deactivation function in Investor's Hand NFT Contract
- Pass necessary data for deactivation

### 4. NFT Deactivation Processing in Investor's Hand NFT Contract

- Authorization verification (owner or VG Staking Contract)
- Verification that NFT is in use
- Update NFT status and remove link with VG staking account

## Technical Integration Details with DAO

### 1. NFT Verification when Determining DAO Level

- Get VG staking information
- Determine base DAO level based on VG amount
- Check NFT for higher DAO levels:
  - Angel NFT: special Angel level
  - Diamond Hand + >70k VG: Partner
  - Titanium Hand+ + 50k-70k VG: Launchpad Master
  - Steel Hand+ + 25k-50k VG: Investor
- Create/update DAO member account with corresponding level

## Staking Period Calculation Algorithm with NFT Booster

- Determine base staking period based on VG amount
- Check for Angel NFT (unlimited period)
- Apply NFT booster multiplier for final period calculation
- Ensure minimum staking period of 1 day

## Error Handling and Edge Cases

### Error Codes for Investor's Hand NFT Contract

- NotAuthorized - operation not authorized
- InvalidNftLevel - invalid NFT level
- NftAlreadyInUse - NFT already used for staking
- NftNotInUse - NFT not used for staking
- NftAccountNotProvided - NFT account not provided
- VgStakingAccountNotFound - VG staking account not found
- InsufficientNftTier - insufficient NFT tier for required DAO level
- NftRequiredForHighTier - NFT required for high DAO tier

### Security Checks for NFT Creation

- Verify call came from VC Staking Contract or authorized administration
- Restrict creation of higher-level NFTs

### Security Checks for NFT Application

- Check NFT level correspondence for higher DAO levels:
  - For 25k-50k VG staking requires Steel Hand NFT or higher
  - For 50k-70k VG staking requires Titanium Hand NFT or higher
  - For >70k VG staking requires Diamond Hand NFT

## Conclusion

Integration of "Investor's Hand" NFT collection with other VC/VG ecosystem components provides:

1. **Seamless user experience** - receive NFT when staking VC and automatic bonus application when staking VG
2. **Enhanced security** - strict checks at all integration stages protect against unauthorized use
3. **Flexible incentive system** - different NFT levels provide different advantages and access to different DAO levels
4. **Technical reliability** - clearly defined interfaces between contracts and strict authorization control

This integration creates a unified ecosystem where user actions in one part of the system affect their capabilities in other parts, promoting long-term engagement and project sustainability. 