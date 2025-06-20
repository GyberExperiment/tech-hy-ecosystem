# VG Token Calculation Formula

## Overview

This document describes the formula for calculating the number of VG tokens issued to a user when locking LP tokens in the "Burn and Earn" mechanism. The formula is designed to incentivize users to lock larger amounts of LP tokens.

## Base Formula

The number of VG tokens issued to a user for locking LP tokens is calculated as follows:

```
VG = LP * C * (1 + B * log10(LP/LP_min))
```

Where:
- `VG` - number of VG tokens issued
- `LP` - amount of locked LP tokens
- `C` - base conversion coefficient (10)
- `B` - bonus coefficient (0.2)
- `LP_min` - minimum LP tokens to receive a bonus (1)

## Explanation of Formula Components

### Base Conversion Coefficient (C)

The base conversion coefficient determines the initial ratio between LP tokens and VG tokens. By default, it is set to 10, meaning that for each locked LP token, the user receives at least 10 VG tokens.

### Bonus Coefficient (B)

The bonus coefficient determines the degree to which the lock size affects the number of VG tokens issued. By default, it is set to 0.2, providing a moderate bonus for larger locks.

### Logarithmic Multiplier

The use of a logarithm in the formula (`log10(LP/LP_min)`) provides a nonlinear increase in the number of VG tokens issued as the amount of locked LP tokens increases. This encourages users to lock larger amounts, but does not create excessive advantage for very large locks.

The minimum LP token amount for a bonus (`LP_min`) is set to 1, so the bonus applies almost immediately.

## Calculation Examples

### Example 1: Small LP Token Lock

```
Input:
- LP tokens (LP): 10
- Base conversion coefficient (C): 10
- Bonus coefficient (B): 0.2
- Minimum LP tokens (LP_min): 1

Calculation:
VG = 10 * 10 * (1 + 0.2 * log10(10/1))
VG = 10 * 10 * (1 + 0.2 * log10(10))
VG = 10 * 10 * (1 + 0.2 * 1)
VG = 10 * 10 * 1.2
VG = 120
```

### Example 2: Medium LP Token Lock

```
Input:
- LP tokens (LP): 1,000
- Base conversion coefficient (C): 10
- Bonus coefficient (B): 0.2
- Minimum LP tokens (LP_min): 1

Calculation:
VG = 1,000 * 10 * (1 + 0.2 * log10(1,000/1))
VG = 1,000 * 10 * (1 + 0.2 * log10(1,000))
VG = 1,000 * 10 * (1 + 0.2 * 3)
VG = 1,000 * 10 * (1 + 0.6)
VG = 1,000 * 10 * 1.6
VG = 16,000
```

### Example 3: Large LP Token Lock

```
Input:
- LP tokens (LP): 100,000
- Base conversion coefficient (C): 10
- Bonus coefficient (B): 0.2
- Minimum LP tokens (LP_min): 1

Calculation:
VG = 100,000 * 10 * (1 + 0.2 * log10(100,000/1))
VG = 100,000 * 10 * (1 + 0.2 * log10(100,000))
VG = 100,000 * 10 * (1 + 0.2 * 5)
VG = 100,000 * 10 * (1 + 1)
VG = 100,000 * 10 * 2
VG = 2,000,000
```

## Dependency Graph

To visually represent the dependency of the number of VG tokens on the amount of locked LP tokens, see the graph below:

```
      |
      |                                            *
  VG  |                                      *
tokens|                                 *
      |                            *
      |                       *
      |                  *
      |             *
      |        *
      |    *
      |* *
      +-------------------------------------------
                     LP tokens
```

## Formula Parameter Management via DAO

The formula parameters (base conversion coefficient and bonus coefficient) can be changed via DAO. This allows the community to adjust token economics according to market conditions and ecosystem development goals.

## Security and Efficiency Considerations

1. **Overflow Handling**:
   - When working with large numbers, overflow must be handled
   - The calculation function should return an error on overflow

2. **Rounding**:
   - The result is rounded to the nearest integer using the `round()` method
   - This ensures fair VG token distribution

3. **Computational Efficiency**:
   - The logarithmic operation requires computational resources
   - Code should be optimized to minimize Compute Unit usage

4. **Manipulation Prevention**:
   - Formula parameters must be protected from unauthorized changes
   - Only the DAO can change these parameters via voting 