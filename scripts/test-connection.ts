import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Testing BSC Testnet connection...");
    
    try {
        // Получаем signers
        const signers = await ethers.getSigners();
        console.log("📊 Available signers:", signers.length);
        
        if (signers.length === 0) {
            console.log("❌ No signers available - check PRIVATE_KEY in .env");
            return;
        }
        
        const deployer = signers[0];
        const deployerAddress = await deployer.getAddress();
        console.log("✅ Deployer address:", deployerAddress);
        
        // Проверяем баланс
        const balance = await deployer.provider.getBalance(deployerAddress);
        console.log("💰 Deployer balance:", ethers.formatEther(balance), "BNB");
        
        // Проверяем network
        const network = await deployer.provider.getNetwork();
        console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
        
        console.log("✅ Connection test successful!");
        
    } catch (error) {
        console.error("❌ Connection test failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 