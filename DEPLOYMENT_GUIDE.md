# 🚀 LPLocker Ecosystem - BSC Testnet Deployment Guide

## Prerequisites

### 1. 💳 BSC Testnet Setup
- Получите tBNB (testnet BNB) из фaucet: https://testnet.binance.org/faucet-smart
- Минимум: **2-3 tBNB** для газа и тестирования
- Добавьте BSC Testnet в MetaMask:
  - Network Name: BSC Testnet
  - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
  - Chain ID: 97
  - Symbol: tBNB
  - Block Explorer: https://testnet.bscscan.com

### 2. 🔧 Environment Setup
```bash
# 1. Установите dependencies
npm install

# 2. Создайте .env файл
cp deploy.env.example .env

# 3. Заполните .env файл:
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here
```

### 3. 📋 BSC Testnet Addresses
- **PancakeSwap V2 Router**: `0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3`
- **WBNB**: `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd`
- **PancakeSwap Factory**: `0x6725F303b657a9733d1Ac0B8D8b1a4cb5C9b7Ff9`

## 🎯 Deployment Steps

### Step 1: Deploy Test Tokens
```bash
npx hardhat run scripts/deploy-tokens.ts --network bscTestnet
```

**Output**: `deployed-tokens.json` с адресами VC и VG токенов

### Step 2: Deploy Ecosystem Contracts
```bash
npx hardhat run scripts/deploy-ecosystem.ts --network bscTestnet
```

**Output**: `deployed-ecosystem.json` с адресами всех контрактов

### Step 3: Verify Contracts on BSCScan
```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Step 4: Test Deployment
```bash
npx hardhat run scripts/test-ecosystem.ts --network bscTestnet
```

## 📋 Deployed Contracts

После деплоя будут созданы:

### 🪙 Tokens
- **VC Token** (Value Coin) - ERC20 токен для стейкинга
- **VG Token** (Value Governance) - Governance токен для наград и голосования

### 🔒 Core Contracts
- **LPLocker** (UUPS Proxy) - Основной контракт для LP стейкинга
- **StakingDAO** (UUPS Proxy) - DAO управление
- **LPLockerGovernor** - Governance контракт для голосования
- **LPLockerTimelock** - Timelock для критических операций

### 🎛️ Configuration
```javascript
{
  lpDivisor: 1000000,           // Делитель для расчета LP
  lpToVgRatio: 10,              // 1 LP = 10 VG rewards
  minBnbAmount: "0.01 BNB",     // Минимум BNB для стейкинга
  minVcAmount: "1 VC",          // Минимум VC для стейкинга
  maxSlippageBps: 1000,         // Максимум slippage: 10%
  defaultSlippageBps: 200,      // По умолчанию: 2%
  mevProtectionEnabled: true,   // MEV защита включена
  minTimeBetweenTxs: 300,       // 5 минут между транзакциями
  maxTxPerUserPerBlock: 2       // Максимум 2 тx на блок
}
```

## 🥞 PancakeSwap Integration

### Create VC/BNB Liquidity Pool

1. **Перейдите на PancakeSwap Testnet**: https://pancake.kiemtienonline360.com/
2. **Add Liquidity**:
   - Token A: VC Token (используйте адрес из `deployed-tokens.json`)
   - Token B: BNB
   - Рекомендуемый ratio: 1 VC = 0.001 BNB
3. **Получите LP Token Address** из транзакции
4. **Обновите LPLocker** с реальным LP адресом:

```bash
# Через governance или authority функцию
await lpLocker.updatePancakeConfig(PANCAKE_ROUTER, LP_TOKEN_ADDRESS);
```

## 🧪 Testing Functionality

### Test EarnVG Function
```javascript
// 1. Approve VC tokens
await vcToken.approve(lpLockerAddress, vcAmount);

// 2. Call earnVG with BNB
await lpLocker.earnVG(
  ethers.parseEther("10"),    // 10 VC
  ethers.parseEther("0.01"),  // 0.01 BNB
  200,                        // 2% slippage
  { value: ethers.parseEther("0.01") }
);
```

### Test Governance
```javascript
// 1. Create proposal
const proposalId = await governor.proposeUpgrade(newImplementationAddress);

// 2. Vote on proposal
await governor.castVote(proposalId, 1); // 1 = For

// 3. Execute after voting period
await governor.execute(proposalId);
```

## 🔐 Security Features

### ✅ Implemented Protections
- **Slippage Protection**: Real minAmounts в PancakeSwap calls
- **MEV Protection**: Time + block based limits
- **Zero Address Validation**: Все критические адреса проверяются
- **Authority Validation**: Только authority может изменять конфигурацию
- **Timelock Protection**: Критические операции с задержкой
- **Enhanced Governance**: 10% quorum, 1 день delay, 10K threshold

### 🛡️ Additional Recommendations
- **Price Oracle**: Интегрируйте Chainlink для защиты от price manipulation
- **Emergency Pause**: Добавьте emergency stop функционал
- **Rate Limiting**: Дополнительные лимиты на большие транзакции
- **Multi-sig**: Используйте multi-sig wallet для authority

## 📊 Monitoring & Maintenance

### Key Metrics to Monitor
- Total LP Locked
- VG Rewards Issued
- Pool Utilization
- Governance Activity
- MEV Protection Triggers

### Regular Tasks
- Monitor VG token supply for rewards
- Update rates based on market conditions
- Review and respond to governance proposals
- Monitor for unusual activity patterns

## 🚨 Emergency Procedures

### If Issues Detected
1. **Pause Operations** (через authority или governance)
2. **Assess Impact** (check locked funds, issued rewards)
3. **Coordinate Response** (governance proposal для fixes)
4. **Deploy Fixes** (через UUPS upgrade mechanism)
5. **Resume Operations** (после тестирования)

## 📞 Support & Resources

- **BSC Testnet Explorer**: https://testnet.bscscan.com
- **PancakeSwap Docs**: https://docs.pancakeswap.finance
- **OpenZeppelin Docs**: https://docs.openzeppelin.com
- **Hardhat Docs**: https://hardhat.org/docs

---

## ⚠️ Important Notes

- **LP Tokens Lock Forever**: По дизайну системы LP токены не возвращаются
- **Testnet Only**: Эта конфигурация только для тестирования
- **Security Audit**: Перед mainnet нужен полный аудит безопасности
- **Gas Optimization**: Оптимизируйте gas costs перед production 