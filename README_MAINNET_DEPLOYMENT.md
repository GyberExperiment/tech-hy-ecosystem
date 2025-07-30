# 🚀 TECH HY MAINNET DEPLOYMENT GUIDE

## 📋 Pre-Deployment Checklist

### ✅ Requirements
- [ ] BSC Mainnet wallet with sufficient BNB (minimum 0.5 BNB)
- [ ] Private key for deployment wallet
- [ ] BSCScan API key for contract verification
- [ ] VC/WBNB liquidity pair created on PancakeSwap

### 🔧 Environment Setup

1. **Copy environment template:**
```bash
cp .env.mainnet .env
```

2. **Configure environment variables:**
```bash
# .env file
PRIVATE_KEY=your_64_character_private_key_without_0x
BSCSCAN_API_KEY=your_bscscan_api_key
```

3. **Verify configuration:**
```bash
npm run compile
```

## 🚀 Deployment Process

### Step 1: Create VC/WBNB Liquidity (if needed)

If LP pair doesn't exist yet:
1. Go to [PancakeSwap](https://pancakeswap.finance/add/ETH/0x1ea36ffe7e81fa21c18477741d2a75da3881e78e)
2. Add liquidity for VC/WBNB pair
3. Note the LP token address

### Step 2: Deploy Contracts

**Production deployment:**
```bash
npm run deploy:mainnet:production
```

This will deploy:
1. ✅ VGTokenVotes (ERC20Votes extension)
2. ✅ LPLocker (main staking contract)
3. ✅ VCSaleContract (VC token sale)
4. ✅ TimelockController (governance timelock)
5. ✅ LPLockerGovernor (governance contract)
6. ✅ LockerDAO (DAO integration)

### Step 3: Update Frontend Configuration

After successful deployment, update `frontend/src/shared/config/contracts.ts`:

```typescript
const MAINNET_CONTRACTS = {
  VC_TOKEN: "0x1ea36ffe7e81fa21c18477741d2a75da3881e78e",
  VG_TOKEN: "0x3459ee77d6b6ed69a835b1faa77938fc2e4183a2",
  VG_TOKEN_VOTES: "DEPLOYED_ADDRESS_HERE",
  LP_TOKEN: "DEPLOYED_ADDRESS_HERE", 
  LP_LOCKER: "DEPLOYED_ADDRESS_HERE",
  VG_VAULT: "SAME_AS_LP_LOCKER",
  VCSALE: "DEPLOYED_ADDRESS_HERE",
  GOVERNOR: "DEPLOYED_ADDRESS_HERE", 
  TIMELOCK: "DEPLOYED_ADDRESS_HERE",
  STAKING_DAO: "DEPLOYED_ADDRESS_HERE",
  // ... rest stays the same
};
```

## 📊 Deployed Contract Configuration

### LPLocker Parameters:
- **LP to VG Ratio:** 1 LP = 10 VG tokens
- **Min BNB Amount:** 0.01 BNB
- **Min VC Amount:** 1 VC token
- **Max Slippage:** 10%
- **Default Slippage:** 2%
- **MEV Protection:** Enabled

### VCSale Parameters:
- **Price:** 100 VC tokens per 1 BNB
- **Min Purchase:** 0.001 BNB
- **Max Purchase:** 10 BNB
- **Sale Supply:** 1,000,000 VC tokens

### Governance Parameters:
- **Voting Delay:** 1 block
- **Voting Period:** 7 days (~45,818 blocks)
- **Proposal Threshold:** 1,000 VG tokens
- **Quorum:** 4%
- **Timelock Delay:** 2 days

## 🔒 Security Features

### Contract Security:
- ✅ **Upgradeable Proxies** (UUPS pattern)
- ✅ **Role-based Access Control**
- ✅ **Reentrancy Protection**
- ✅ **Circuit Breaker Pattern**
- ✅ **MEV Protection**
- ✅ **Comprehensive Input Validation**

### Governance Security:
- ✅ **Timelock Controller** (2-day delay)
- ✅ **Multi-signature Requirements**
- ✅ **Public Proposal Execution**
- ✅ **Transparent Voting Process**

## 🧪 Post-Deployment Testing

### 1. Contract Verification
```bash
# All contracts should auto-verify during deployment
# Manual verification if needed:
npx hardhat verify --network bsc CONTRACT_ADDRESS "constructor_arg1" "constructor_arg2"
```

### 2. Functionality Testing
- [ ] Token balances display correctly
- [ ] LP staking works
- [ ] VG rewards distribution
- [ ] VC token purchase
- [ ] Governance proposals
- [ ] Timelock execution

### 3. Frontend Integration
- [ ] Switch to mainnet in app
- [ ] All widgets load correctly
- [ ] No Coming Soon pages for deployed features
- [ ] Transaction history works
- [ ] Network status indicators

## ⚡ Quick Start Commands

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to mainnet (with environment setup)
npm run deploy:mainnet:production

# Verify specific contract
npx hardhat verify --network bsc ADDRESS

# Check deployment
npx hardhat console --network bsc
```

## 🚨 Emergency Procedures

### Pause Contracts
```javascript
// In hardhat console
const contract = await ethers.getContractAt("ContractName", "ADDRESS");
await contract.pause();
```

### Upgrade Contracts
```bash
# Prepare upgrade
npx hardhat run scripts/upgrade/upgrade-contract.js --network bsc
```

## 📞 Support

For deployment issues:
1. Check contract addresses in BSCScan
2. Verify gas prices and network status
3. Ensure sufficient BNB balance
4. Check BSCScan API rate limits

## 🎯 Success Metrics

Deployment is successful when:
- ✅ All contracts deployed and verified
- ✅ Frontend updated with new addresses
- ✅ Basic functionality tested
- ✅ No critical errors in console
- ✅ User can interact with all features

---

**⚠️ Important:** Keep your private key secure and never commit it to version control! 