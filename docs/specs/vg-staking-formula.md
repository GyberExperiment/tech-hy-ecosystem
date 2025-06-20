# VG Staking Formula

## Overview

This document describes the formula for calculating rewards for staking VG tokens, including the use of NFT boosters. The formula is designed to incentivize long-term staking and the use of boosters.

## Base Formula

The reward for staking VG tokens is calculated as follows:

```
Reward = VG_staked * R * D * (1 + B * NFT_booster)
```

Where:
- `Reward` — total reward for the staking period
- `VG_staked` — amount of VG tokens staked
- `R` — base reward rate per day
- `D` — number of staking days
- `B` — booster coefficient
- `NFT_booster` — booster multiplier from NFT (if any)

## Explanation of Formula Components

### Base Reward Rate (R)

The base reward rate determines the daily reward for staking VG tokens. By default, it is set to 0.01 (1% per day).

### Booster Coefficient (B)

The booster coefficient determines the effect of NFT boosters on the reward. By default, it is set to 0.5, providing a significant bonus for using boosters.

### NFT Booster Multiplier

The NFT booster multiplier is determined by the rarity and type of the NFT used as a booster. For example:
- Common NFT: 0.1
- Rare NFT: 0.2
- Epic NFT: 0.3
- Legendary NFT: 0.5

## Calculation Examples

### Example 1: Staking Without Booster

```
Input:
- VG_staked: 1,000
- R: 0.01
- D: 30
- B: 0.5
- NFT_booster: 0

Calculation:
Reward = 1,000 * 0.01 * 30 * (1 + 0.5 * 0)
Reward = 1,000 * 0.01 * 30 * 1
Reward = 1,000 * 0.3
Reward = 300
```

### Example 2: Staking With Rare NFT Booster

```
Input:
- VG_staked: 1,000
- R: 0.01
- D: 30
- B: 0.5
- NFT_booster: 0.2

Calculation:
Reward = 1,000 * 0.01 * 30 * (1 + 0.5 * 0.2)
Reward = 1,000 * 0.01 * 30 * (1 + 0.1)
Reward = 1,000 * 0.01 * 30 * 1.1
Reward = 1,000 * 0.33
Reward = 330
```

### Example 3: Staking With Legendary NFT Booster

```
Input:
- VG_staked: 1,000
- R: 0.01
- D: 30
- B: 0.5
- NFT_booster: 0.5

Calculation:
Reward = 1,000 * 0.01 * 30 * (1 + 0.5 * 0.5)
Reward = 1,000 * 0.01 * 30 * (1 + 0.25)
Reward = 1,000 * 0.01 * 30 * 1.25
Reward = 1,000 * 0.375
Reward = 375
```

## Parameter Management via DAO

The parameters of the formula (base reward rate, booster coefficient) can be changed via DAO voting, allowing the community to adjust staking incentives.

## Security and Efficiency Considerations

1. **Overflow Handling**:
   - The calculation function must handle overflow and return an error if it occurs
2. **Rounding**:
   - The result is rounded to the nearest integer using the `round()` method
3. **Manipulation Prevention**:
   - Only the DAO can change formula parameters
4. **NFT Booster Validation**:
   - Only valid NFTs from the approved collection can be used as boosters

## Tier System and Staking Periods

According to the DAO structure, staking periods depend on the user's level (tier):

| Level           | VG Requirements            | Base Period | Additional Requirements |
|-----------------|----------------------------|-------------|-------------------------|
| Starter         | up to 100 VG               | 7 days      | -                       |
| Community Member| 100-500 VG                 | 14 days     | -                       |
| Contributor     | 500-1500 VG                | 30 days     | -                       |
| Founder         | 1500-4000 VG               | 60 days     | -                       |
| Expert          | 4000-25000 VG              | 90 days     | -                       |
| Investor        | 25000-50000 VG             | 365 days    | Steel Hand+             |
| Launchpad Master| 50000-70000 VG             | 365 days    | Titanium Hand+          |
| Partner         | over 70000 VG              | 365 days    | Diamond Hand            |
| Angel           | any amount                 | Unlimited   | Angel NFT               |

## Applying NFT Boosters to Increase Staking Multiplier

NFT boosters from the "Investor's Hand" collection are applied to increase the staking multiplier:

| NFT Level      | Multiplier | Effect on Staking Multiplier | Benefits                   |
|----------------|------------|------------------------------|----------------------------|
| Paper Hand     | 1.1x       | 10% increase                 | 10% higher yield           |
| Wooden Hand    | 1.25x      | 25% increase                 | 25% higher yield           |
| Steel Hand     | 1.5x       | 50% increase                 | 50% higher yield           |
| Titanium Hand  | 1.75x      | 75% increase                 | 75% higher yield           |
| Diamond Hand   | 2.0x       | 100% increase                | Double yield               |
| Angel NFT      | -          | Unlimited period             | Unlimited                  |

## Basic Calculation Algorithm in Simple Terms

The process of determining the staking period for VG tokens can be described in a few simple steps:

1. **Step 1: Determine base period by VG amount**
   - Up to 100 VG → 7 days (Starter)
   - 100-500 VG → 14 days (Community Member)
   - 500-1500 VG → 30 days (Contributor)
   - 1500-4000 VG → 60 days (Founder)
   - 4000-25000 VG → 90 days (Expert)
   - Over 25000 VG → 365 days (Investor, Launchpad Master, Partner)

2. **Step 2: Check special conditions**
   - If user has Angel NFT → unlimited staking period, calculation complete
   - If level 25000-50000 VG (Investor), requires Steel Hand NFT or higher
   - If level 50000-70000 VG (Launchpad Master), requires Titanium Hand NFT or higher
   - If level over 70000 VG (Partner), requires Diamond Hand NFT

3. **Step 3: Apply NFT booster multiplier**
   - Paper Hand (1.1x) → 10% increase in staking multiplier
   - Wooden Hand (1.25x) → 25% increase in staking multiplier
   - Steel Hand (1.5x) → 50% increase in staking multiplier
   - Titanium Hand (1.75x) → 75% increase in staking multiplier
   - Diamond Hand (2.0x) → 100% increase in staking multiplier

4. **Step 4: Check for automatic reinvestment**
   - If VG amount over 10,000 → auto-reinvestment activated
   - 100% of tokens automatically reinvested at period end
   - Early withdrawal of entire deposit or part available

**Example:**
User wants to stake 6,000 VG and has Steel Hand NFT:
- By token amount: 6,000 VG → 90 days (Expert level)
- Steel Hand multiplier: 1.5x → 50% increase in staking multiplier
- Base staking period: 90 days
- Final yield: base rate * 1.5

## Automatic Reinvestment

When staking over 10,000 VG tokens, automatic reinvestment mechanism activates:

After staking period ends:
- 100% of tokens automatically reinvested for new period
- Early withdrawal of entire deposit or part available if needed

## Features of Different Level Staking

### Starter and Community Member Levels
- Automatic unstaking after period completion
- Early unstaking unavailable
- Minimum staking period: 7 days
- Basic functions

### Investor, Launchpad Master, Partner Levels
- Requires corresponding NFT booster level
- Weekly autocompounding

## Calculation Examples

### Example 1: Level Expert (4000-25000 VG) with Wooden Hand NFT

```
Input:
- VG_staked: 5,000
- R: 0.01
- D: 90
- B: 0.5
- NFT_booster: 0.25

Calculation:
Reward = 5,000 * 0.01 * 90 * (1 + 0.5 * 0.25)
Reward = 5,000 * 0.01 * 90 * (1 + 0.125)
Reward = 5,000 * 0.01 * 90 * 1.125
Reward = 5,000 * 0.1125
Reward = 562.5
```

### Example 2: Level Investor (25000-50000 VG) with Steel Hand NFT

```
Input:
- VG_staked: 30,000
- R: 0.01
- D: 365
- B: 0.5
- NFT_booster: 0.5

Calculation:
Reward = 30,000 * 0.01 * 365 * (1 + 0.5 * 0.5)
Reward = 30,000 * 0.01 * 365 * (1 + 0.25)
Reward = 30,000 * 0.01 * 365 * 1.25
Reward = 30,000 * 0.01 * 456.25
Reward = 1,368,750
```

### Example 3: Level Partner (over 70000 VG) with Diamond Hand NFT

```
Input:
- VG_staked: 80,000
- R: 0.01
- D: 365
- B: 0.5
- NFT_booster: 0.2

Calculation:
Reward = 80,000 * 0.01 * 365 * (1 + 0.5 * 0.2)
Reward = 80,000 * 0.01 * 365 * (1 + 0.1)
Reward = 80,000 * 0.01 * 365 * 1.1
Reward = 80,000 * 0.01 * 401.5
Reward = 32,120,000
```

### Example 4: Any Level with Angel NFT

```
Input:
- VG_staked: any
- R: 0.01
- D: 365
- B: 0.5
- NFT_booster: 0

Calculation:
Reward = any * 0.01 * 365 * (1 + 0.5 * 0)
Reward = any * 0.01 * 365 * 1
Reward = any * 0.365
Reward = any * 0.365
```

## Restrictions and Rules

1. **Minimum Staking Period**: 7 days
2. **Maximum Staking Period**: 365 days (for higher levels without NFT)
3. **Rounding**: All periods are rounded to whole days
4. **Priority Rule**: Angel NFT has the highest priority and always ensures unlimited period

## Special Cases

### Insufficient NFT Level for Higher DAO Levels

If a user tries to stake VG amount corresponding to a higher DAO level (Investor, Launchpad Master, Partner) but lacks the required NFT level, the transaction will be rejected with the corresponding error.

## Managing Formula Parameters via DAO

Formula parameters and tier structure can be changed via DAO. For this, a corresponding structure is used, which includes:

- Base periods for each tier
- Tier boundaries (in VG tokens)
- NFT booster parameters 
- Automatic reinvestment parameters
- Service fields

## Connection with Other Ecosystem Components

Formula for calculating staking period VG is integrated with:

1. **NFT Collection "Investor's Hand"** - for applying multipliers to staking period
2. **DAO and Governance** - for managing formula parameters
3. **VG Staking** - for determining locking period

## Conclusion

VG tokens staking system provides a flexible mechanism allowing:
- Create a multi-level DAO structure with different privileges
- Integrate NFT boosters to increase staking multiplier
- Stimulate long-term participation in the ecosystem
- Ensure transparent and predictable system for users

## Related Documents

- [VG Staking](../05-vg-staking.md)
- [VC Staking and NFT Boosters](../04-vc-staking.md)
- [NFT Collection "Investor's Hand"](../investors-hand-nft.md)
- [Governance and DAO](../07-governance.md) 