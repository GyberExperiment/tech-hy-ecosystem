# VG Token Staking

## Overview of VG Token Staking

VG token staking is a key mechanism for participating in the governance of the TECH HY ecosystem, providing access to various DAO levels. The staking period and conditions depend on the amount of VG tokens and the presence of NFT boosters from the "Investor's Hand" collection.

## Staking Levels and DAO Tiers

The TECH HY ecosystem provides a progressive, multi-level DAO participation structure based on the amount of staked VG tokens and the staking duration:

| Level           | Requirements                        | Staking Period |
|-----------------|-------------------------------------|---------------|
| Starter         | up to 100 VG                        | 7 days        |
| Community Member| 100-500 VG                          | 14 days       |
| Contributor     | 500-1500 VG                         | 30 days       |
| Founder         | 1500-4000 VG                        | 60 days       |
| Expert          | 4000-25000 VG                       | 90 days       |
| Angel           | Angel Investor NFT holder           | Unlimited     |
| Investor        | 25000-50000 VG + Steel Hand NFT     | 365 days      |
| Launchpad Master| 50000-70000 VG + Titanium Hand      | 365 days      |
| Partner         | over 70000 VG + Diamond Hand        | 365 days      |

> Detailed information about NFT boosters is provided in the documents [Investor's Hand NFT Collection](./investors-hand-nft.md) and [VC Token Staking and NFT Boosters](./04-vc-staking.md).

### Features of Different Staking Levels

#### Starter and Community Member
- Automatic unstaking after the period ends
- Early unstaking not available
- Basic ecosystem rights

#### Contributor
- Automatic unstaking after 30 days
- Ability to increase stake during staking
- Additional bonuses: right to airdrops and activity rewards
- Requirements: verified X.com account, subscription to @TECHHYVC, task completion

#### Founder
- Staking period: 60 days
- Early unstaking available
- Right to nominate projects for the Investment Committee

#### Expert
- Staking period: 90 days
- Early unstaking and stake increase available
- Ability to mint NFTs for TECH HY Expert Marketplace

#### Higher Levels (Investor, Launchpad Master, Partner)
- Long staking period (365 days)
- Required NFT from the "Investor's Hand" collection
- Weekly autocompounding
- Access to special ecosystem privileges and income

#### Angel Investor
- Exclusive status with unlimited staking period
- Daily autocompounding
- All privileges of higher levels available

## Using NFT Boosters

- **Applying NFT boosters from the "Investor's Hand" collection**:
  - Increases the user's effective share when calculating rewards
  - Calculation examples:
    - Without NFT: stake 100 VG → effective share 100 VG
    - With Paper Hand (1.1x): stake 100 VG → effective share 110 VG
    - With Diamond Hand (2.0x): stake 100 VG → effective share 200 VG

- **NFT booster levels**:
  | NFT Level      | Multiplier | Effective Share | Requirements                      |
  |----------------|-----------|----------------|-----------------------------------|
  | Paper Hand     | 1.1x      | +10%           | Promo, community rewards          |
  | Wooden Hand    | 1.25x     | +25%           | Stake 1M VC for 90 days           |
  | Steel Hand     | 1.5x      | +50%           | Special achievements, purchase    |
  | Titanium Hand  | 1.75x     | +75%           | Issued to major investors         |
  | Diamond Hand   | 2.0x      | +100%          | Issued to project partners        |
  | Angel Investor | 2.0x      | +100%          | Presale participation ≥ 50 SOL    |

## Main Characteristics of VG Staking

- **Minimum staking amount**: 100 VG
- **VG transaction tax**: 10%
- **Tax redistribution**:
  - 50% to NFT Fee Key holders
  - 50% to DAO treasury

## VG Token Staking Process

### Process Steps

1. **Staking initiation**:
   - User calls the staking function with the amount of VG tokens and optionally an NFT booster
   - Checks for sufficient VG token balance
   - If NFT booster is present, ownership and status are checked

2. **Staking period determination**:
   - Base period is determined according to the DAO level table
   - If NFT booster is present, the corresponding bonus is activated
   - Required NFTs are checked for higher levels

3. **Token locking**:
   - VG tokens are transferred to the vault (VG Staking Vault)
   - Tokens are locked for the specified period
   - 10% tax is charged and distributed according to the rules

4. **Unstaking conditions determination**:
   - For lower levels, automatic unstaking is set
   - For higher levels (Founder and above), early unstaking is available
   - For Investor and above, autocompounding is set

## Automatic Reinvestment

- **Automatic reinvestment for staking over 10,000 VG**:
  - 100% of tokens are automatically reinvested
  - Early withdrawal of the stake or part of it is available

## Technical Implementation

### Data Structures

The system uses the following main data structures:

#### VG Token Staking Account
Stores info about a specific staking, including:
- Owner
- Locked amount
- Staking start timestamp
- Lock end timestamp
- NFT booster flag
- NFT booster address
- Autoreinvestment flag
- Reinvestment amount
- Withdrawal amount
- Unlock flag
- PDA bump

#### VG Token Staking Statistics Account
Contains overall VG staking stats:
- Total staked tokens
- Total number of stakers
- Number of stakings with NFT boosters
- Number of automatic reinvestments
- PDA bump

### Determining Staking Period by Tier with NFT Booster

The staking period algorithm includes:
- Calculating the base period depending on the amount of VG tokens
- Checking for Angel NFT for unlimited period
- Applying the yield multiplier depending on NFT booster level
- Ensuring the minimum staking period

### VG Token Staking Function with NFT Booster

Main process steps:
- Check minimum token amount
- Check VG token balance considering tax
- Apply NFT booster (if specified)
- Determine staking period
- Check for automatic reinvestment
- Transfer VG tokens to the vault considering tax
- Distribute tax
- Initialize staking account
- Update statistics

### VG Token Withdrawal and NFT Booster Deactivation Function

Main process steps:
- Check staking account owner
- Check staking period end
- Deactivate NFT booster (if used)
- Determine withdrawal amount
- Transfer VG tokens back to user considering tax
- Automatic reinvestment (if activated)
- Update staking account status
- Update statistics

## Tax Distribution

The 10% tax charged on VG token operations is distributed as follows:
- 50% to NFT Fee Key holders
- 50% to DAO treasury

Distribution is automatic for each staking or withdrawal operation.

## Yield and Reward Calculation

VG staking yield is determined by several factors:
- Base yield set by the staking program parameters
- NFT booster multiplier (from 1.1x to 2.0x)
- DAO level and related privileges
- Automatic reinvestment for higher levels

## Interaction with the "Investor's Hand" NFT Collection

Interaction with the NFT collection is provided through the following mechanisms:
- Applying NFT booster during VG staking
- Deactivating NFT booster upon token withdrawal
- Checking required NFT level for higher DAO tiers

## Conclusion

The VG token staking system is a fundamental component of the TECH HY ecosystem, providing:
- Multi-level DAO participation structure
- Integration with the "Investor's Hand" NFT collection
- Various mechanisms to incentivize long-term token holding
- Automatic tax distribution to support tokenomics

Additional information on integration with other ecosystem components is provided in the following documents:
- [VG Staking Period Calculation Formula](./specs/vg-staking-formula.md)
- [Investor's Hand NFT Collection](./investors-hand-nft.md)
- [Investor's Hand NFT Collection Integration](./specs/investors-hand-integration.md)
- [Governance and DAO](./07-governance.md) 