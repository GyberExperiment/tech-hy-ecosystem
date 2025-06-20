# Governance and DAO System

## Introduction

The TECH HY ecosystem uses a decentralized governance model (DAO) based on the OpenZeppelin Governor framework on BSC. This ensures transparent, community-driven decision-making and the ability to implement changes through on-chain voting.

## DAO Structure

The DAO consists of several levels, each with its own rights and responsibilities:

| Level             | Requirements                                 | Rights and Privileges                       |
|-------------------|----------------------------------------------|---------------------------------------------|
| Starter           | up to 100 VG                                 | Basic voting rights                         |
| Community Member  | 100-500 VG                                   | Propose minor changes, vote                 |
| Contributor       | 500-1500 VG                                  | Propose new features, participate in airdrops|
| Founder           | 1500-4000 VG                                 | Nominate projects, participate in committees |
| Expert            | 4000-25000 VG                                | Mint NFTs, access to Expert Marketplace      |
| Investor          | 25000-50000 VG + Steel Hand NFT              | Access to Investment Committee, autocompounding |
| Launchpad Master  | 50000-70000 VG + Titanium Hand NFT           | Launchpad voting, advanced privileges        |
| Partner           | over 70000 VG + Diamond Hand NFT             | Strategic decisions, partner privileges      |
| Angel             | Angel Investor NFT                           | Unlimited privileges, daily autocompounding  |

## Voting Process

- All proposals and votes are conducted on-chain via the OpenZeppelin Governor framework
- Each DAO member's voting power is proportional to their staked VG tokens and NFT booster level
- Proposals can be submitted by Contributors and above
- Voting periods and quorum requirements are set by the DAO

## Proposal Types

- Protocol upgrades
- Treasury management
- New product launches
- Partnership approvals
- Community initiatives

## Security and Transparency

- All actions are recorded on-chain and are publicly auditable
- Only eligible members can submit proposals and vote
- Smart contracts enforce all rules and prevent unauthorized actions

## Integration with Other Components

- DAO levels are determined by the amount of staked VG tokens and the presence of required NFTs
- NFT boosters from the "Investor's Hand" collection grant access to higher DAO levels
- DAO decisions can trigger changes in staking, tokenomics, and ecosystem development

## Related Documents

- [VG Token Staking](./05-vg-staking.md)
- [Investor's Hand NFT Collection](./04.5-investors-hand-nft.md.md)
- [NFT Fee Key](./06-nft-fee-key.md)

## Key Characteristics

- **Governance Token**: VG token
- **DAO Protocol**: OpenZeppelin Governor on BSC
- **Minimum amount for voting**: 100 VG
- **Minimum amount for creating proposals**: 10,000 VG
- **Voting period**: 7 days
- **Quorum**: 30% of circulating VG token supply

## DAO Participation Levels (Tiers)

The TECH HY ecosystem provides a progressive, multi-level DAO participation structure based on the amount of staked VG tokens and staking duration:

| Level           | Requirements                    | Staking Period |
|-----------------|---------------------------------|----------------|
| Starter         | up to 100 VG                   | 7 days         |
| Community Member| 100-500 VG                     | 14 days        |
| Contributor     | 500-1500 VG                    | 30 days        |
| Founder         | 1500-4000 VG                   | 60 days        |
| Expert          | 4000-25000 VG                  | 90 days        |
| Angel           | Angel Investor NFT holder       | Unlimited      |
| Investor        | 25000-50000 VG + Steel Hand NFT| 365 days       |
| Launchpad Master| 50000-70000 VG + Titanium Hand | 365 days       |
| Partner         | over 70000 VG + Diamond Hand   | 365 days       |

### Features and Privileges of Different Levels

#### 🥉 Starter
- Maximum staking period: 7 days
- Automatic unstaking after 7 days
- Passive participation without voting rights

#### 🧑‍🤝‍🧑 Community Member
- Maximum staking period: 14 days
- Automatic unstaking after 14 days
- Basic voting rights

#### 🛠️ Contributor
- Maximum staking period: 30 days
- Automatic unstaking after 30 days
- Upgrades available during staking
- Additional bonuses: right to airdrops and rewards for social activity
- Requirements: verified X.com account, subscription to @TECHHYVC, completion of at least 5 tasks

#### 🏗️ Founder
- Maximum staking period: 60 days
- Automatic unstaking after 60 days
- Early unstaking available
- Special privileges: right to nominate projects for Investment Committee consideration

#### 🎨 Expert
- Maximum staking period: 90 days
- Automatic unstaking after 90 days
- Early unstaking and stake increase available
- Special privileges: ability to mint up to 3 NFTs for free for TECH HY Expert Marketplace

#### 🌟 Angel
- Exclusive status for VC presale participants with amount from 50 BNB
- Unlimited staking period
- Daily autocompounding of rewards
- Early unstaking and stake increase available
- Angel Investor NFT can be transferred and sold

#### 🧑‍💼 Investor
- Maximum staking period: 365 days per round
- Automatic unstaking after 365 days
- Weekly autocompounding
- Early unstaking and stake increase available

#### 🚀 Launchpad Master
- Maximum staking period: 365 days per round
- Automatic unstaking after 365 days
- Weekly autocompounding
- Early unstaking and stake increase available
- Special bonus: share of fees paid by projects on TECH HY Launchpad

#### 🏛️ Partner (TECH HY DAO Partner)
- Includes all privileges of Expert, Investor and Launchpad Master
- Official member of TECH HY DAO Board of Directors
- Right to propose and vote for appointment of special DAO statuses
- Access to TECH HY private investors club
- Veto rights are held only by:
  - TECH HY (temporarily, until full decentralization)
  - Partners (Partner level) DAO

## NFT Staking Boosters (Investor's Hand NFT Collection)

NFT boosters are represented by the "Investor's Hand" collection, which includes various hand levels representing different degrees of project commitment:

- Paper Hand NFT
- Wooden Hand NFT
- Steel Hand NFT
- Titanium Hand NFT
- Diamond Hand NFT

These NFTs can be:
- Purchased on marketplaces
- Minted through VC token staking

Titanium and Diamond hands are the rarest and most valuable, issued manually upon special request.

## Parameters Managed Through DAO

Through DAO, VG token holders can vote to change the following ecosystem parameters:

### Token Parameters

1. **VG Token Tax Rate**:
   - Current value: 10%
   - Change range: 5-15%

2. **Tax Distribution**:
   - Share for NFT Fee Key holders (current value: 50%)
   - Share for DAO treasury (current value: 50%)

### "Burn and Earn" Mechanism Parameters

1. **LP to VG Conversion Formula**:
   - Base conversion coefficient (current value: 10)
   - Bonus coefficient (current value: 0.2)

2. **NFT Fee Key Levels**:
   - Threshold values for each level
   - Income multipliers for each level

### Staking Parameters

1. **VC Token Staking**:
   - Fixed amount for staking (current value: 1 million VC)
   - Staking period (current value: 90 days)

2. **VG Token Staking**:
   - Base staking period (current value: 7 days)
   - NFT booster multipliers for increasing effective share in reward pool:
     - Paper Hand: 1.1x (+10%)
     - Wooden Hand: 1.25x (+25%)
     - Steel Hand: 1.5x (+50%)
     - Titanium Hand: 1.75x (+75%)
     - Diamond Hand: 2.0x (+100%)
   - Threshold for automatic reinvestment (current value: 10,000 VG)
   - Reinvestment percentage (current value: 100%)

## Governance Process

### Proposal Creation

VG token holders with at least 10,000 VG can create proposals for voting:

1. **Proposal Types**:
   - Ecosystem parameter changes
   - Smart contract updates
   - DAO treasury fund allocation for ecosystem development
   - Emergency measures in crisis situations

2. **Proposal Creation Process**:
   - Prepare proposal description
   - Specify concrete parameters proposed for change
   - Justify need for changes
   - Submit deposit in VG tokens (returned if proposal gathers quorum)

### Voting

VG token holders with at least 100 VG can vote for or against proposals:

1. **Voting Process**:
   - Lock VG tokens for voting period (7 days)
   - Vote weight proportional to number of locked tokens
   - Ability to delegate vote to another participant

2. **Proposal Acceptance Conditions**:
   - Quorum: 30% of circulating VG token supply
   - Simple majority (>50%) for regular proposals
   - Qualified majority (>75%) for critical changes

### Execution of Accepted Proposals

After successful voting, proposals are executed through special DAO Executor program:

1. **Regular Proposals**:
   - Automatic execution through DAO Executor smart contract
   - Update corresponding parameters in ecosystem smart contracts

2. **Critical Proposals**:
   - Two-stage execution with 48-hour delay (cooling period)
   - Cancellation possibility if errors or new circumstances discovered

## Technical Implementation

### OpenZeppelin Governor Integration

The DAO system integrates with OpenZeppelin Governor framework on BSC, which provides basic governance infrastructure. Key integration elements include creating governor contract, setting voting parameters and implementing mechanisms for executing accepted proposals through timelock controller.

### DAO Parameters Structure

DAO parameters are stored in special storage and include information about governor contract, minimum token amounts for voting and proposal creation, voting period, quorum and authorized addresses.

## DAO Treasury

### Treasury Structure

DAO treasury is a special smart contract that stores information about funds available for DAO use, including contract address where tokens are stored, total amount of received and spent funds.

### Treasury Funding

DAO treasury is funded through the following sources:

1. 50% of VG token transaction tax
2. Voluntary donations from ecosystem participants
3. DAO activity income

### Treasury Fund Usage

Treasury funds can be used based on accepted DAO proposals for:

1. VC/VG token ecosystem development
2. Funding new feature development
3. Ecosystem marketing and promotion
4. Smart contract security audits
5. Reward payments to participants contributing to ecosystem development

## Emergency Management Mechanism

### Multisignature for Emergency Cases

In critical situations requiring immediate intervention, a multisignature mechanism is used:

1. **Multisignature Composition**:
   - 5-7 key ecosystem participants
   - 2/3 participant signatures required for emergency measures

2. **Emergency Measures**:
   - Suspension of certain smart contract functions
   - Smart contract updates to eliminate vulnerabilities
   - User fund protection in case of attack

## User Interface

For user convenience, a web interface is implemented that allows:

1. View active DAO proposals
2. Create new proposals
3. Vote for or against proposals
4. Track voting results
5. View proposal and DAO decision history
6. Track DAO treasury status and fund usage

## Integration with VC/VG Token Ecosystem

DAO integrates with all VC/VG token ecosystem components:

1. **Tokens**: Token parameter management through DAO
2. **"Burn and Earn" Mechanism**: Conversion formula and NFT level configuration
3. **Staking**: VC and VG token staking parameter management
4. **NFT Fee Key**: Level management and fee distribution

This integration ensures decentralized management of the entire ecosystem and allows it to develop according to VG token holder community decisions.

## Security and Transparency Measures

- No voting rights without staking
- Inactive DAO members do not receive rewards
- All proposal and voting result data stored on blockchain
- Veto rights held only by:
  - TECH HY (temporarily, until full decentralization)
  - Partners (Partner level) DAO
- DAO metrics, expenses and treasury reports publicly available through dashboard

