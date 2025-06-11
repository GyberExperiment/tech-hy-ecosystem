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
    
    const initConfig = {
        vgTokenAddress: tokenData.VG_TOKEN,         // VGToken для rewards
        vcTokenAddress: tokenData.VC_TOKEN,         // VCToken для staking
        pancakeRouter: PANCAKE_ROUTER_TESTNET,
        lpTokenAddress: lpTokenAddress,
        stakingVaultAddress: deployerAddress, // Temporary, will be updated
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

    const lpLocker = await upgrades.deployProxy(LPLocker, [initConfig], {
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

    // Step 5: Setup VG Token connections
    console.log("\n💰 Setting up VG token connections...");
    const VGToken = await ethers.getContractAt("VGToken", tokenData.VG_TOKEN);
    const VGTokenVotes = await ethers.getContractAt("VGTokenVotes", tokenData.VG_TOKEN_VOTES);
    
    // Check current balances
    const currentVGBalance = await VGToken.balanceOf(deployerAddress);
    console.log("✅ Current VG balance:", ethers.formatEther(currentVGBalance));
    
    // Step 6: Setup VG rewards for LPLocker
    const rewardSupply = ethers.parseEther("50000000"); // 50M VG for rewards
    console.log("\n🎁 Approving VG rewards for LPLocker...");
    await VGToken.approve(lpLockerAddress, rewardSupply);
    console.log("✅ VG rewards approved for LPLocker:", ethers.formatEther(rewardSupply));

    // Step 7: Setup governance tokens with detailed logging
    console.log("\n🗳️  Setting up governance tokens...");
    const governanceAmount = ethers.parseEther("10000000"); // 10M VG for governance
    
    // Check current approval for VGTokenVotes
    const currentApproval = await VGToken.allowance(deployerAddress, tokenData.VG_TOKEN_VOTES);
    console.log("📊 Current VGTokenVotes approval:", ethers.formatEther(currentApproval));
    
    if (currentApproval < governanceAmount) {
        console.log("🔑 Approving VG for VGTokenVotes...");
        await VGToken.approve(tokenData.VG_TOKEN_VOTES, governanceAmount);
        const newApproval = await VGToken.allowance(deployerAddress, tokenData.VG_TOKEN_VOTES);
        console.log("✅ New approval amount:", ethers.formatEther(newApproval));
    }
    
    // Verify balances before deposit
    const vgBalanceBeforeDeposit = await VGToken.balanceOf(deployerAddress);
    const vgVotesSupplyBefore = await VGTokenVotes.totalSupply();
    console.log("📊 VG balance before deposit:", ethers.formatEther(vgBalanceBeforeDeposit));
    console.log("📊 VGVotes supply before:", ethers.formatEther(vgVotesSupplyBefore));
    
    // Deposit VG tokens into VGTokenVotes
    console.log("🔄 Depositing VG into VGTokenVotes...");
    try {
        const depositTx = await VGTokenVotes.deposit(governanceAmount);
        await depositTx.wait();
        console.log("✅ Deposit transaction successful");
    } catch (error) {
        console.error("❌ Deposit failed:", error);
        throw error;
    }
    
    // Verify deposit success
    const vgVotesBalance = await VGTokenVotes.balanceOf(deployerAddress);
    const vgVotesSupplyAfter = await VGTokenVotes.totalSupply();
    console.log("✅ VGVotes balance after deposit:", ethers.formatEther(vgVotesBalance));
    console.log("✅ VGVotes total supply:", ethers.formatEther(vgVotesSupplyAfter));
    
    // Enable voting power
    console.log("🗳️  Enabling voting power...");
    await VGTokenVotes.enableVoting();
    console.log("✅ Voting power enabled for deployer");

    // Step 8: Get Governor address from DAO
    const governorAddress = await stakingDAO.governor();
    console.log("✅ Governor deployed at:", governorAddress);

    // Verify governance setup
    const Governor = await ethers.getContractAt("LPLockerGovernor", governorAddress);
    const votingPower = await VGTokenVotes.getVotes(deployerAddress);
    console.log("✅ Deployer voting power:", ethers.formatEther(votingPower), "VGVotes");

    // Step 9: Verify all contracts
    console.log("\n🔍 Verifying contract setup...");
    
    // Check LPLocker config
    const lpConfig = await lpLocker.config();
    console.log("✅ LPLocker authority:", lpConfig.authority);
    console.log("✅ LPLocker VG token:", lpConfig.vgTokenAddress);
    console.log("✅ LPLocker VC token:", lpConfig.vcTokenAddress);
    
    // Check DAO config
    const daoToken = await stakingDAO.token();
    const daoLPLocker = await stakingDAO.lpLocker();
    console.log("✅ DAO governance token:", daoToken);
    console.log("✅ DAO LPLocker address:", daoLPLocker);

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
        CONFIG: initConfig,
        GOVERNANCE_SETUP: {
            VG_REWARDS_APPROVED: ethers.formatEther(rewardSupply),
            VG_GOVERNANCE_DEPOSITED: ethers.formatEther(governanceAmount),
            DEPLOYER_VOTING_POWER: ethers.formatEther(votingPower),
            TOTAL_VGVOTES_SUPPLY: ethers.formatEther(vgVotesSupplyAfter)
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
    console.log("LP Token:           ", lpTokenAddress);
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
    
    console.log("\n💎 Balances & Power:");
    console.log("• VG Rewards Available: ", ethers.formatEther(rewardSupply), "VG");
    console.log("• Governance Tokens: ", ethers.formatEther(vgVotesBalance), "VGVotes"); 
    console.log("• Voting Power: ", ethers.formatEther(votingPower), "VGVotes");
    
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