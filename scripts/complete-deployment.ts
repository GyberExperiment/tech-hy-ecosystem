import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("🔧 Completing BSC Testnet deployment...");

    // Load token addresses
    const tokenData = JSON.parse(fs.readFileSync("deployed-tokens.json", "utf8"));
    
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("Deployer:", deployerAddress);

    // Contract addresses from latest deployment
    const addresses = {
        VC_TOKEN: tokenData.VC_TOKEN,
        VG_TOKEN: tokenData.VG_TOKEN,
        VG_TOKEN_VOTES: tokenData.VG_TOKEN_VOTES,
        LP_TOKEN: "0x740806630D7F17C5b0621b04FE3788938E76AB88",
        LP_LOCKER_PROXY: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
        STAKING_DAO: "0x2269D0D279345526C30d694db1d94075450b6A99",
        TIMELOCK: "0x06EEB4c972c05BBEbf960Fec99f483dC95768e39",
        PANCAKE_ROUTER: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
    };

    console.log("📋 Using deployed contracts:", addresses);

    // Get contract instances
    const VGToken = await ethers.getContractAt("VGToken", addresses.VG_TOKEN);
    const VGTokenVotes = await ethers.getContractAt("VGTokenVotes", addresses.VG_TOKEN_VOTES);
    const stakingDAO = await ethers.getContractAt("StakingDAO", addresses.STAKING_DAO);
    const lpLocker = await ethers.getContractAt("LPLocker", addresses.LP_LOCKER_PROXY);

    // Check current state
    console.log("\n📊 Current state:");
    const vgBalance = await VGToken.balanceOf(deployerAddress);
    const vgVotesSupply = await VGTokenVotes.totalSupply();
    const vgVotesBalance = await VGTokenVotes.balanceOf(deployerAddress);
    
    console.log("VG Balance:", ethers.formatEther(vgBalance));
    console.log("VGVotes Total Supply:", ethers.formatEther(vgVotesSupply));
    console.log("VGVotes Balance:", ethers.formatEther(vgVotesBalance));

    // Enable voting if not already enabled
    const currentVotes = await VGTokenVotes.getVotes(deployerAddress);
    console.log("Current voting power:", ethers.formatEther(currentVotes));
    
    if (currentVotes < vgVotesBalance) {
        console.log("🗳️  Enabling voting power...");
        await VGTokenVotes.enableVoting();
        const newVotes = await VGTokenVotes.getVotes(deployerAddress);
        console.log("✅ New voting power:", ethers.formatEther(newVotes));
    }

    // Get Governor address
    const governorAddress = await stakingDAO.governor();
    console.log("✅ Governor address:", governorAddress);

    // Verify Governor contract
    const Governor = await ethers.getContractAt("LPLockerGovernor", governorAddress);
    const governorToken = await Governor.token();
    console.log("✅ Governor token:", governorToken);

    // Final verification
    console.log("\n🔍 Final verification:");
    const lpConfig = await lpLocker.config();
    console.log("LPLocker authority:", lpConfig.authority);
    console.log("LPLocker VG token:", lpConfig.vgTokenAddress);
    
    const daoToken = await stakingDAO.token();
    const daoLPLocker = await stakingDAO.lpLocker();
    console.log("DAO governance token:", daoToken);
    console.log("DAO LPLocker:", daoLPLocker);

    // Save complete deployment data
    const deploymentData = {
        ...tokenData,
        ...addresses,
        DEPLOYER: deployerAddress,
        NETWORK: "BSC_TESTNET",
        DEPLOYMENT_TIMESTAMP: new Date().toISOString(),
        GOVERNOR: governorAddress,
        GOVERNANCE_SETUP: {
            VG_TOTAL_SUPPLY: ethers.formatEther(await VGToken.totalSupply()),
            VGVOTES_SUPPLY: ethers.formatEther(vgVotesSupply),
            DEPLOYER_VOTING_POWER: ethers.formatEther(await VGTokenVotes.getVotes(deployerAddress))
        }
    };

    fs.writeFileSync("deployed-ecosystem.json", JSON.stringify(deploymentData, null, 2));
    console.log("\n💾 Complete deployment saved to deployed-ecosystem.json");

    console.log("\n🎉 DEPLOYMENT COMPLETED!");
    console.log("==========================================");
    console.log("VC Token:      ", addresses.VC_TOKEN);
    console.log("VG Token:      ", addresses.VG_TOKEN);
    console.log("VGTokenVotes:  ", addresses.VG_TOKEN_VOTES);
    console.log("LP Token:      ", addresses.LP_TOKEN);
    console.log("LPLocker:      ", addresses.LP_LOCKER_PROXY);
    console.log("StakingDAO:    ", addresses.STAKING_DAO);
    console.log("Governor:      ", governorAddress);
    console.log("Timelock:      ", addresses.TIMELOCK);
    console.log("==========================================");
    
    console.log("\n✅ Ready for PancakeSwap LP creation!");
    console.log("🧪 Run test-ecosystem.ts to verify functionality");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Completion failed:", error);
        process.exit(1);
    }); 