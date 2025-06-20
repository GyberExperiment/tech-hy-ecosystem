# NFT Fee Key

## Overview

The NFT Fee Key is a special non-fungible token (NFT) that provides its holders with a share of the VG token transaction tax collected in the TECH HY ecosystem. This mechanism is designed to incentivize early supporters, key contributors, and ecosystem partners.

## Key Features

- **Limited supply**: Only 100 NFT Fee Keys will be issued
- **Share in VG tax**: Holders receive 50% of all VG transaction taxes
- **Tradable**: NFT Fee Keys can be freely traded on the secondary market
- **On-chain distribution**: All rewards are distributed automatically via smart contracts

## Distribution of NFT Fee Keys

NFT Fee Keys are distributed as follows:
- 50 to early investors and partners
- 30 to the project team and advisors
- 20 reserved for future ecosystem development and community rewards

## VG Tax Distribution Mechanism

- Every VG token transaction is subject to a 10% tax
- 50% of the collected tax is distributed among all NFT Fee Key holders
- 50% goes to the DAO treasury
- Distribution is performed automatically by the smart contract

## Reward Calculation Example

Suppose 1,000,000 VG tokens are transacted in a day:
- Tax collected: 100,000 VG (10%)
- Amount distributed to NFT Fee Key holders: 50,000 VG (50%)
- Each NFT Fee Key holder receives: 50,000 VG / 100 = 500 VG

## Technical Implementation

### Data Structures

- **NFT Fee Key Account**: Stores information about the NFT, including owner, mint address, and reward history
- **Reward Pool Account**: Accumulates VG tax for distribution

### Instructions

1. **Claim rewards**
   - Holder calls the claim function
   - Smart contract calculates the share and transfers VG tokens to the holder
2. **Transfer NFT Fee Key**
   - NFT can be transferred or sold on the secondary market
   - New owner receives future rewards

## Security Considerations

- Only the NFT owner can claim rewards
- Double claiming is prevented by tracking reward history
- All calculations and distributions are performed on-chain

## Benefits for the Ecosystem

- Incentivizes early supporters and key contributors
- Ensures fair and transparent distribution of VG tax
- Creates a new class of valuable, tradable NFTs

## Related Documents

- [VG Token Staking](./05-vg-staking.md)
- [Investor's Hand NFT Collection](./04.5-investors-hand-nft.md.md)
- [Governance and DAO](./07-governance.md)

## Characteristics
- **Acquisition**: When locking LP tokens in "Burn and Earn"
- **Purpose**: Receiving part of VG transaction tax (10%)
- **Transferability**: Can be sold or transferred to another user

## NFT Levels
| Level     | LP Tokens | Multiplier |
|-----------|-----------|------------|
| Common    | < 1,000   | 1.0x       |
| Rare      | 1K - 10K  | 1.2x       |
| Epic      | 10K - 100K| 1.5x       |
| Legendary | > 100K    | 2.0x       |

## NFT Metadata
- **Name**: VC/VG Fee Key #{id}
- **Symbol**: VCFK
- **Attributes**:
  - `locked_lp_amount`: Amount of locked LP
  - `lock_timestamp`: Lock time (Unix timestamp)
  - `fee_share_percentage`: Percentage of total fee pool
  - `tier`: NFT level (Common, Rare, Epic, Legendary)

## Fee Share Calculation
```
share_percentage = (user_locked_lp * tier_multiplier) / total_weighted_locked_lp * 100%
```

## Technical Implementation Aspects

### Data Structures
1. **NFT Fee Key Account**:
   - Owner
   - Amount of locked LP
   - Lock timestamp
   - Fee pool share percentage
   - NFT level (1-4)
   - Last reward claim timestamp
   - Total reward amount collected
   - PDA bump

2. **Fee Distribution Storage**:
   - Manager address
   - Token account address
   - Total fees collected
   - Total fees distributed
   - Last distribution timestamp
   - PDA bump

### Key Functions
1. **NFT Fee Key Creation**:
   - Determine NFT level
   - Calculate fee pool share
   - Initialize account
   - Create NFT via ERC-721 standard

2. **Reward Collection**:
   - Verify NFT ownership
   - Calculate accumulated rewards
   - Transfer to user wallet
   - Update state

3. **Pool Share Updates**:
   - Recalculate when total locked LP tokens change
   - Update `total_weighted_locked_lp`
   - Update shares for each NFT 