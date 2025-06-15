import { ethers, upgrades } from "hardhat";
import * as fs from "fs";

// BSC Testnet PancakeSwap Router
const PANCAKE_ROUTER_TESTNET = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

async function main() {
    console.log("🚀 Deploying LPLocker Ecosystem to BSC Testnet...");

    // Load token addresses
    if (!fs.existsSync("deployed-tokens.json")) {
        throw new Error("❌ deployed-tokens.json not found. Run deploy-tokens.ts first!");
    }

    const tokenData = JSON.parse(fs.readFileSync("deployed-tokens.json", "utf8"));
    console.log("📋 Using tokens:", {
        VC_TOKEN: tokenData.VC_TOKEN,
        VG_TOKEN: tokenData.VG_TOKEN,
        VG_TOKEN_VOTES: tokenData.VG_TOKEN_VOTES
    });

    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("Deployer:", deployerAddress);
    console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployerAddress)), "BNB");

    // Step 1: Deploy Timelock Controller
    console.log("\n🕰️ Deploying Timelock Controller...");
    const TimelockController = await ethers.getContractFactory("LPLockerTimelock");
    const timelock = await TimelockController.deploy(
        86400, // 1 day delay
        [deployerAddress], // proposers
        [deployerAddress], // executors  
        deployerAddress    // admin
    );
    await timelock.waitForDeployment();
    const timelockAddress = await timelock.getAddress();
    console.log("✅ Timelock deployed at:", timelockAddress);

    // Step 2: Create LP pair first (simulate for testnet)
    console.log("\n🔗 Deploying Mock LP Token...");
    const MockLP = await ethers.getContractFactory("MockERC20");
    const lpToken = await MockLP.deploy("VC-BNB LP", "VC-BNB");
    await lpToken.waitForDeployment();
    const lpTokenAddress = await lpToken.getAddress();
    console.log("✅ Mock LP Token deployed at:", lpTokenAddress);

    // Step 3: Deploy LPLocker with UUPS proxy
    console.log("\n🔒 Deploying LPLocker...");
    
    const LPLocker = await ethers.getContractFactory("LPLocker");
    
    // ✅ PRODUCTION CONFIG - убираем временные решения
    const productionInitConfig = {
        vgTokenAddress: tokenData.VG_TOKEN,         // VGToken для rewards
        vcTokenAddress: tokenData.VC_TOKEN,         // VCToken для staking
        pancakeRouter: PANCAKE_ROUTER_TESTNET,
        lpTokenAddress: lpTokenAddress,
        stakingVaultAddress: deployerAddress, // ✅ Будет обновлён после деплоя StakingDAO
        lpDivisor: 1000000,
        lpToVgRatio: 10,
        minBnbAmount: ethers.parseEther("0.01"), // 0.01 BNB
        minVcAmount: ethers.parseEther("1"),     // 1 VC
        maxSlippageBps: 1000,  // 10%
        defaultSlippageBps: 200, // 2%
        mevProtectionEnabled: true,
        minTimeBetweenTxs: 300, // 5 minutes
        maxTxPerUserPerBlock: 2
    };

    const lpLocker = await upgrades.deployProxy(LPLocker, [productionInitConfig], {
        initializer: 'initialize',
        kind: 'uups'
    });
    await lpLocker.waitForDeployment();
    const lpLockerAddress = await lpLocker.getAddress();
    console.log("✅ LPLocker deployed at:", lpLockerAddress);

    // Step 4: Deploy StakingDAO with LPLocker address
    console.log("\n🏛️ Deploying StakingDAO...");
    const StakingDAO = await ethers.getContractFactory("StakingDAO");
    const stakingDAO = await upgrades.deployProxy(StakingDAO, [
        tokenData.VG_TOKEN_VOTES, // governance token (VGTokenVotes для голосований)
        lpLockerAddress           // LPLocker address
    ], { 
        initializer: 'initialize',
        kind: 'uups'
    });
    await stakingDAO.waitForDeployment();
    const stakingDAOAddress = await stakingDAO.getAddress();
    console.log("✅ StakingDAO deployed at:", stakingDAOAddress);

    // Step 5: Setup initial VG token supply for rewards
    console.log("\n💰 Setting up VG token rewards...");
    const VGToken = await ethers.getContractAt("VGToken", tokenData.VG_TOKEN);
    const rewardSupply = ethers.parseEther("50000000"); // 50M VG for rewards (из 100M)
    
    // Mint additional VG for rewards if needed
    const currentBalance = await VGToken.balanceOf(deployerAddress);
    console.log("✅ Current VG balance:", ethers.formatEther(currentBalance));
    
    // ✅ Переводим VG токены напрямую в LPLocker для выдачи наград
    console.log("\n🔧 Transferring VG tokens to LPLocker...");
    await VGToken.transfer(lpLockerAddress, rewardSupply);
    console.log("✅ Transferred", ethers.formatEther(rewardSupply), "VG tokens to LPLocker");
    
    // Проверяем баланс LPLocker
    const lpLockerBalance = await VGToken.balanceOf(lpLockerAddress);
    console.log("✅ LPLocker VG balance:", ethers.formatEther(lpLockerBalance));

    // Step 6: Setup VGTokenVotes for governance testing
    console.log("\n🗳️  Setting up governance tokens...");
    const VGTokenVotes = await ethers.getContractAt("VGTokenVotes", tokenData.VG_TOKEN_VOTES);
    
    // Approve and deposit some VG tokens into VGTokenVotes for governance
    const governanceAmount = ethers.parseEther("10000000"); // 10M VG for governance
    await VGToken.approve(tokenData.VG_TOKEN_VOTES, governanceAmount);
    await VGTokenVotes.deposit(governanceAmount);
    await VGTokenVotes.enableVoting(); // Self-delegate for voting
    
    console.log("✅ Deposited", ethers.formatEther(governanceAmount), "VG into VGTokenVotes");
    console.log("✅ Voting power enabled for deployer");

    // Step 7: Get Governor address from DAO
    const governorAddress = await stakingDAO.governor();
    console.log("✅ Governor deployed at:", governorAddress);

    // Verify governance setup
    const Governor = await ethers.getContractAt("LPLockerGovernor", governorAddress);
    const votingPower = await VGTokenVotes.getVotes(deployerAddress);
    console.log("✅ Deployer voting power:", ethers.formatEther(votingPower), "VGVotes");

    // Save all deployment addresses
    const deploymentData = {
        ...tokenData,
        LP_TOKEN: lpTokenAddress,
        LP_LOCKER_PROXY: lpLockerAddress,
        STAKING_DAO: stakingDAOAddress,
        GOVERNOR: governorAddress,
        TIMELOCK: timelockAddress,
        PANCAKE_ROUTER: PANCAKE_ROUTER_TESTNET,
        DEPLOYER: deployerAddress,
        NETWORK: "BSC_TESTNET",
        DEPLOYMENT_TIMESTAMP: new Date().toISOString(),
        PRODUCTION_CONFIG: productionInitConfig, // ✅ Сохраняем production конфигурацию
        GOVERNANCE_SETUP: {
            LP_LOCKER_VG_BALANCE: ethers.formatEther(lpLockerBalance),
            VG_GOVERNANCE_DEPOSITED: ethers.formatEther(governanceAmount),
            DEPLOYER_VOTING_POWER: ethers.formatEther(votingPower)
        }
    };

    fs.writeFileSync("deployed-ecosystem.json", JSON.stringify(deploymentData, null, 2));
    console.log("\n💾 All addresses saved to deployed-ecosystem.json");

    // Summary
    console.log("\n🎉 DEPLOYMENT SUMMARY:");
    console.log("==========================================");
    console.log("VC Token (staking): ", tokenData.VC_TOKEN);
    console.log("VG Token (rewards): ", tokenData.VG_TOKEN);
    console.log("VGTokenVotes (gov):  ", tokenData.VG_TOKEN_VOTES);
    console.log("LPLocker:           ", lpLockerAddress);
    console.log("StakingDAO:         ", stakingDAOAddress);
    console.log("Governor:           ", governorAddress);
    console.log("Timelock:           ", timelockAddress);
    console.log("PancakeRouter:      ", PANCAKE_ROUTER_TESTNET);
    console.log("==========================================");
    
    console.log("\n📋 Token Architecture:");
    console.log("• VGToken → LPLocker (rewards)");
    console.log("• VGTokenVotes → Governor (voting)");
    console.log("• Users: VG → wrap → VGVotes → vote");
    
    console.log("\n✅ Ecosystem deployment completed!");
    console.log("🔧 Next step: Create liquidity pool on PancakeSwap testnet");
    console.log("🧪 Then run test-ecosystem.ts to verify functionality");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 