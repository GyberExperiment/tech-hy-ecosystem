import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import * as fs from "fs";

async function main() {
    console.log("🚀 Deploying Production Tokens to BSC Testnet...");

    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("Deployer address:", deployerAddress);
    console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployerAddress)), "BNB");

    // Deploy VC Token (Value Coin)
    console.log("\n📝 Deploying VC Token...");
    const VCToken = await ethers.getContractFactory("VCToken");
    const vcToken = await VCToken.deploy(deployerAddress);
    await vcToken.waitForDeployment();
    const vcTokenAddress = await vcToken.getAddress();
    console.log("✅ VC Token deployed at:", vcTokenAddress);
    
    // Check initial supply
    const vcTotalSupply = await vcToken.totalSupply();
    console.log("✅ VC Initial supply:", ethers.formatEther(vcTotalSupply), "VC");

    // Deploy VG Token (Value Governance)
    console.log("\n📝 Deploying VG Token...");
    const VGToken = await ethers.getContractFactory("VGToken");
    const vgToken = await VGToken.deploy(deployerAddress);
    await vgToken.waitForDeployment();
    const vgTokenAddress = await vgToken.getAddress();
    console.log("✅ VG Token deployed at:", vgTokenAddress);
    
    // Check initial supply
    const vgTotalSupply = await vgToken.totalSupply();
    console.log("✅ VG Initial supply:", ethers.formatEther(vgTotalSupply), "VG");

    // Deploy VGTokenVotes (wrapper for governance)
    console.log("\n🗳️  Deploying VGTokenVotes wrapper...");
    const VGTokenVotes = await ethers.getContractFactory("VGTokenVotes");
    const vgTokenVotes = await VGTokenVotes.deploy(vgTokenAddress);
    await vgTokenVotes.waitForDeployment();
    const vgTokenVotesAddress = await vgTokenVotes.getAddress();
    console.log("✅ VGTokenVotes deployed at:", vgTokenVotesAddress);

    // Verify wrapper setup
    const underlyingToken = await vgTokenVotes.underlyingToken();
    console.log("✅ Wrapper underlying token:", underlyingToken);
    console.log("✅ Exchange rate:", ethers.formatEther(await vgTokenVotes.exchangeRate()));

    // Mint additional tokens for ecosystem testing
    console.log("\n💰 Minting additional tokens for testing...");
    const additionalVCAmount = ethers.parseEther("900000"); // 900K more VC (total 1M)
    const additionalVGAmount = ethers.parseEther("90000000"); // 90M more VG (total 100M)
    
    await vcToken.mint(deployerAddress, additionalVCAmount, "Testnet supply");
    await vgToken.mint(deployerAddress, additionalVGAmount, "Testnet supply");
    
    const finalVCSupply = await vcToken.totalSupply();
    const finalVGSupply = await vgToken.totalSupply();
    console.log("✅ Final VC supply:", ethers.formatEther(finalVCSupply), "VC");
    console.log("✅ Final VG supply:", ethers.formatEther(finalVGSupply), "VG");

    // Save addresses to file
    const addresses = {
        VC_TOKEN: vcTokenAddress,
        VG_TOKEN: vgTokenAddress,
        VG_TOKEN_VOTES: vgTokenVotesAddress,
        DEPLOYER: deployerAddress,
        NETWORK: "BSC_TESTNET",
        TIMESTAMP: new Date().toISOString(),
        TOKEN_DETAILS: {
            VC_TOTAL_SUPPLY: ethers.formatEther(finalVCSupply),
            VG_TOTAL_SUPPLY: ethers.formatEther(finalVGSupply),
            VC_MAX_SUPPLY: ethers.formatEther(await vcToken.MAX_SUPPLY()),
            VG_MAX_SUPPLY: ethers.formatEther(await vgToken.MAX_SUPPLY())
        }
    };

    fs.writeFileSync("deployed-tokens.json", JSON.stringify(addresses, null, 2));
    console.log("\n💾 Addresses saved to deployed-tokens.json");

    console.log("\n🎉 Token deployment completed!");
    console.log("📋 Summary:");
    console.log("  VC Token (staking):", vcTokenAddress);
    console.log("  VG Token (rewards):", vgTokenAddress);  
    console.log("  VGTokenVotes (governance):", vgTokenVotesAddress);
    console.log("\nNext step: Run deploy-ecosystem.ts");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 