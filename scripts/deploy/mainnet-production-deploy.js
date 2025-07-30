/**
 * 🚀 TECH HY ECOSYSTEM - MAINNET PRODUCTION DEPLOYMENT
 * 
 * Деплой всей экосистемы в BSC Mainnet для полнофункциональной работы
 * 
 * Порядок деплоя:
 * 1. VGTokenVotes (ERC20Votes extension)
 * 2. LPLocker (основной стейкинг контракт)
 * 3. TimelockController (timelock для governance)
 * 4. LPLockerGovernor (governance контракт)
 * 5. LockerDAO (финальная DAO интеграция)
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// BSC Mainnet адреса
const MAINNET_CONFIG = {
  // Уже задеплоенные токены
  VC_TOKEN: "0x1ea36ffe7e81fa21c18477741d2a75da3881e78e", // ✅ Реальный VC
  VG_TOKEN: "0x3459ee77d6b6ed69a835b1faa77938fc2e4183a2", // ✅ Реальный VG
  
  // PancakeSwap V2 инфраструктура
  PANCAKE_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  PANCAKE_FACTORY: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  
  // Деплой настройки
  LP_TO_VG_RATIO: 10, // 1 LP = 10 VG
  LP_DIVISOR: 1000000, // Делитель для расчетов
  MIN_BNB_AMOUNT: ethers.parseEther("0.01"), // 0.01 BNB минимум
  MIN_VC_AMOUNT: ethers.parseEther("1"), // 1 VC минимум
  MAX_SLIPPAGE_BPS: 1000, // 10% максимум
  DEFAULT_SLIPPAGE_BPS: 200, // 2% по умолчанию
  
  // Governance настройки
  VOTING_DELAY: 1, // 1 блок задержка
  VOTING_PERIOD: 45818, // ~7 дней (13.2 секунды на блок в BSC)
  PROPOSAL_THRESHOLD: ethers.parseEther("1000"), // 1000 VG для создания proposal
  QUORUM_PERCENTAGE: 4, // 4% кворум
  TIMELOCK_DELAY: 2 * 24 * 60 * 60, // 2 дня в секундах
};

// Глобальные переменные для адресов
let deployedContracts = {};
let deployer;

async function main() {
  console.log("🚀 Starting TECH HY Mainnet Production Deployment...");
  console.log("=" .repeat(60));
  
  // Получаем деплоер
  [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "BNB");
  
  if (balance < ethers.parseEther("0.3")) {
    throw new Error("❌ Insufficient BNB balance for deployment (need at least 0.3 BNB)");
  }
  
  console.log("🌐 Network:", hre.network.name);
  console.log("⛽ Gas Price:", (await ethers.provider.getFeeData()).gasPrice.toString());
  console.log("");
  
  try {
    // 1. Деплой VGTokenVotes
    await deployVGTokenVotes();
    await sleep(5000);
    
    // 2. Получение LP токена адреса
    await getLPTokenAddress();
    await sleep(5000);
    
    // 3. Деплой LPLocker
    await deployLPLocker();
    await sleep(5000);
    
    // 4. Деплой TimelockController
    await deployTimelockController();
    await sleep(5000);
    
    // 5. Деплой LPLockerGovernor
    await deployLPLockerGovernor();
    await sleep(5000);
    
    // 6. Деплой LockerDAO
    await deployLockerDAO();
    await sleep(5000);
    
    // 7. Инициализация и настройка
    await initializeContracts();
    
    // 8. Финальный отчет
    await generateFinalReport();
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

async function deployVGTokenVotes() {
  console.log("📦 1. Deploying VGTokenVotes...");
  
  const VGTokenVotes = await ethers.getContractFactory("VGTokenVotes");
  const vgTokenVotes = await VGTokenVotes.deploy(MAINNET_CONFIG.VG_TOKEN);
  
  await vgTokenVotes.waitForDeployment();
  const address = await vgTokenVotes.getAddress();
  
  deployedContracts.VG_TOKEN_VOTES = address;
  console.log("✅ VGTokenVotes deployed to:", address);
  
  // Верификация контракта
  console.log("⏳ Waiting for verification...");
  await sleep(30000); // Ждем 30 секунд
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [MAINNET_CONFIG.VG_TOKEN],
    });
    console.log("✅ VGTokenVotes verified");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
  }
}

async function getLPTokenAddress() {
  console.log("📦 2. Getting LP Token Address...");
  
  const factoryAbi = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)"
  ];
  
  const factory = new ethers.Contract(
    MAINNET_CONFIG.PANCAKE_FACTORY,
    factoryAbi,
    deployer
  );
  
  const lpTokenAddress = await factory.getPair(
    MAINNET_CONFIG.VC_TOKEN,
    MAINNET_CONFIG.WBNB
  );
  
  if (lpTokenAddress === ethers.ZeroAddress) {
    console.log("⚠️ LP Pair doesn't exist yet. You need to create liquidity first!");
    console.log("💡 Create VC/WBNB pair on PancakeSwap before continuing");
    throw new Error("LP Pair not found");
  }
  
  deployedContracts.LP_TOKEN = lpTokenAddress;
  console.log("✅ LP Token found at:", lpTokenAddress);
}

async function deployLPLocker() {
  console.log("📦 3. Deploying LPLocker...");
  
  const LPLocker = await ethers.getContractFactory("LPLocker");
  
  // Деплой proxy
  const lpLocker = await hre.upgrades.deployProxy(LPLocker, [
    {
      vgTokenAddress: MAINNET_CONFIG.VG_TOKEN,
      vcTokenAddress: MAINNET_CONFIG.VC_TOKEN,
      pancakeRouter: MAINNET_CONFIG.PANCAKE_ROUTER,
      lpTokenAddress: deployedContracts.LP_TOKEN,
      stakingVaultAddress: deployer.address, // Временно, потом обновим
      lpDivisor: MAINNET_CONFIG.LP_DIVISOR,
      lpToVgRatio: MAINNET_CONFIG.LP_TO_VG_RATIO,
      minBnbAmount: MAINNET_CONFIG.MIN_BNB_AMOUNT,
      minVcAmount: MAINNET_CONFIG.MIN_VC_AMOUNT,
      maxSlippageBps: MAINNET_CONFIG.MAX_SLIPPAGE_BPS,
      defaultSlippageBps: MAINNET_CONFIG.DEFAULT_SLIPPAGE_BPS,
      mevProtectionEnabled: true,
      minTimeBetweenTxs: 60,
      maxTxPerUserPerBlock: 3
    }
  ], {
    initializer: "initialize",
    kind: "uups"
  });
  
  await lpLocker.waitForDeployment();
  const address = await lpLocker.getAddress();
  
  deployedContracts.LP_LOCKER = address;
  console.log("✅ LPLocker deployed to:", address);
  
  // Верификация
  await sleep(30000);
  try {
    const implAddress = await hre.upgrades.erc1967.getImplementationAddress(address);
    await hre.run("verify:verify", {
      address: implAddress,
    });
    console.log("✅ LPLocker implementation verified");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
  }
}

async function deployTimelockController() {
  console.log("📦 4. Deploying TimelockController...");
  
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(
    MAINNET_CONFIG.TIMELOCK_DELAY,
    [deployer.address], // proposers (временно)
    [deployer.address], // executors (временно)
    deployer.address    // admin
  );
  
  await timelock.waitForDeployment();
  const address = await timelock.getAddress();
  
  deployedContracts.TIMELOCK = address;
  console.log("✅ TimelockController deployed to:", address);
  
  // Верификация
  await sleep(30000);
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [
        MAINNET_CONFIG.TIMELOCK_DELAY,
        [deployer.address],
        [deployer.address],
        deployer.address
      ],
    });
    console.log("✅ TimelockController verified");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
  }
}

async function deployLPLockerGovernor() {
  console.log("📦 5. Deploying LPLockerGovernor...");
  
  const LPLockerGovernor = await ethers.getContractFactory("LPLockerGovernor");
  const governor = await LPLockerGovernor.deploy(
    deployedContracts.VG_TOKEN_VOTES,
    deployedContracts.TIMELOCK,
    MAINNET_CONFIG.VOTING_DELAY,
    MAINNET_CONFIG.VOTING_PERIOD,
    MAINNET_CONFIG.PROPOSAL_THRESHOLD,
    MAINNET_CONFIG.QUORUM_PERCENTAGE
  );
  
  await governor.waitForDeployment();
  const address = await governor.getAddress();
  
  deployedContracts.GOVERNOR = address;
  console.log("✅ LPLockerGovernor deployed to:", address);
  
  // Верификация
  await sleep(30000);
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [
        deployedContracts.VG_TOKEN_VOTES,
        deployedContracts.TIMELOCK,
        MAINNET_CONFIG.VOTING_DELAY,
        MAINNET_CONFIG.VOTING_PERIOD,
        MAINNET_CONFIG.PROPOSAL_THRESHOLD,
        MAINNET_CONFIG.QUORUM_PERCENTAGE
      ],
    });
    console.log("✅ LPLockerGovernor verified");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
  }
}

async function deployLockerDAO() {
  console.log("📦 6. Deploying LockerDAO...");
  
  const LockerDAO = await ethers.getContractFactory("StakingDAO");
  const lockerDAO = await LockerDAO.deploy(
    deployedContracts.LP_LOCKER,
    deployedContracts.GOVERNOR,
    deployer.address
  );
  
  await lockerDAO.waitForDeployment();
  const address = await lockerDAO.getAddress();
  
  deployedContracts.STAKING_DAO = address;
  console.log("✅ LockerDAO deployed to:", address);
  
  // Верификация
  await sleep(30000);
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [
        deployedContracts.LP_LOCKER,
        deployedContracts.GOVERNOR,
        deployer.address
      ],
    });
    console.log("✅ LockerDAO verified");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
  }
}

async function initializeContracts() {
  console.log("📦 7. Initializing contracts...");
  
  // Настраиваем роли в Timelock
  const timelock = await ethers.getContractAt("TimelockController", deployedContracts.TIMELOCK);
  
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  
  // Добавляем Governor как proposer
  await timelock.grantRole(PROPOSER_ROLE, deployedContracts.GOVERNOR);
  console.log("✅ Governor granted PROPOSER_ROLE");
  
  // Добавляем всех как executors (для публичного исполнения)
  await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
  console.log("✅ Public execution enabled");
  
  // Обновляем LPLocker vault address
  const lpLocker = await ethers.getContractAt("LPLocker", deployedContracts.LP_LOCKER);
  await lpLocker.updateConfig({
    stakingVaultAddress: deployedContracts.STAKING_DAO,
    // Остальные параметры остаются прежними
    vgTokenAddress: MAINNET_CONFIG.VG_TOKEN,
    vcTokenAddress: MAINNET_CONFIG.VC_TOKEN,
    pancakeRouter: MAINNET_CONFIG.PANCAKE_ROUTER,
    lpTokenAddress: deployedContracts.LP_TOKEN,
    lpDivisor: MAINNET_CONFIG.LP_DIVISOR,
    lpToVgRatio: MAINNET_CONFIG.LP_TO_VG_RATIO,
    minBnbAmount: MAINNET_CONFIG.MIN_BNB_AMOUNT,
    minVcAmount: MAINNET_CONFIG.MIN_VC_AMOUNT,
    maxSlippageBps: MAINNET_CONFIG.MAX_SLIPPAGE_BPS,
    defaultSlippageBps: MAINNET_CONFIG.DEFAULT_SLIPPAGE_BPS,
    mevProtectionEnabled: true,
    minTimeBetweenTxs: 60,
    maxTxPerUserPerBlock: 3
  });
  console.log("✅ LPLocker configured with DAO vault");
  
  console.log("✅ All contracts initialized successfully!");
}

async function generateFinalReport() {
  console.log("");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log("📋 DEPLOYED CONTRACTS:");
  console.log("");
  
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  
  console.log("");
  console.log("🔧 UPDATE FRONTEND CONFIG:");
  console.log("Update frontend/src/shared/config/contracts.ts:");
  console.log("");
  console.log("const MAINNET_CONTRACTS = {");
  console.log(`  VC_TOKEN: "${MAINNET_CONFIG.VC_TOKEN}",`);
  console.log(`  VG_TOKEN: "${MAINNET_CONFIG.VG_TOKEN}",`);
  console.log(`  VG_TOKEN_VOTES: "${deployedContracts.VG_TOKEN_VOTES}",`);
  console.log(`  LP_TOKEN: "${deployedContracts.LP_TOKEN}",`);
  console.log(`  LP_LOCKER: "${deployedContracts.LP_LOCKER}",`);
  console.log(`  VG_VAULT: "${deployedContracts.LP_LOCKER}",`);
  console.log(`  VCSALE: "0x0000000000000000000000000000000000000000", // Not deployed`);
  console.log(`  GOVERNOR: "${deployedContracts.GOVERNOR}",`);
  console.log(`  TIMELOCK: "${deployedContracts.TIMELOCK}",`);
  console.log(`  STAKING_DAO: "${deployedContracts.STAKING_DAO}",`);
  console.log(`  PANCAKE_ROUTER: "${MAINNET_CONFIG.PANCAKE_ROUTER}",`);
  console.log(`  PANCAKE_FACTORY: "${MAINNET_CONFIG.PANCAKE_FACTORY}",`);
  console.log(`  WBNB: "${MAINNET_CONFIG.WBNB}",`);
  console.log("} as const;");
  console.log("");
  
  console.log("🚀 NEXT STEPS:");
  console.log("1. Update frontend contracts configuration");
  console.log("2. Test staking functionality on mainnet");
  console.log("3. Transfer VG tokens to LPLocker contract");
  console.log("4. Create initial liquidity if needed");
  console.log("5. Transfer ownership to governance");
  console.log("");
  console.log("💡 Staking ecosystem is ready for production use!");
  console.log("💡 VCSale widget is commented out as requested");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main, deployedContracts, MAINNET_CONFIG }; 