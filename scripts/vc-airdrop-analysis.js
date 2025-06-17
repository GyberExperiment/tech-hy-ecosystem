const { ethers } = require("hardhat");
const fs = require('fs');

// VC Contract addresses
const MAINNET_VC_CONTRACT = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";
const TESTNET_VC_CONTRACT = process.env.TESTNET_VC_CONTRACT; // Will be deployed in testnet

// RPC URLs
const BSC_MAINNET_RPC = "https://bsc-dataseed.binance.org/";
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";

// Standard ERC20 ABI for getting holders
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

class VCAirdropAnalyzer {
  constructor() {
    this.mainnetProvider = new ethers.JsonRpcProvider(BSC_MAINNET_RPC);
    this.testnetProvider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
    this.holders = new Map();
  }

  async analyzeMainnetHolders() {
    console.log("🔍 Analyzing VC holders in BSC Mainnet...");
    console.log(`📍 Contract: ${MAINNET_VC_CONTRACT}`);
    
    const contract = new ethers.Contract(MAINNET_VC_CONTRACT, ERC20_ABI, this.mainnetProvider);
    
    try {
      // Get contract info
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(), 
        contract.decimals(),
        contract.totalSupply()
      ]);
      
      console.log(`📊 Token Info:`);
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
      
      // Get all Transfer events to find holders
      console.log("🔍 Scanning Transfer events...");
      
      const currentBlock = await this.mainnetProvider.getBlockNumber();
      const fromBlock = currentBlock - 50000; // Last ~50k blocks (~4 days)
      
      console.log(`📦 Scanning blocks ${fromBlock} to ${currentBlock}...`);
      
      const transferFilter = contract.filters.Transfer();
      const events = await contract.queryFilter(transferFilter, fromBlock, currentBlock);
      
      console.log(`📈 Found ${events.length} transfer events`);
      
      // Process events to build holder list
      const uniqueAddresses = new Set();
      
      for (const event of events) {
        if (event.args && event.args.to !== ethers.ZeroAddress) {
          uniqueAddresses.add(event.args.to.toLowerCase());
        }
      }
      
      console.log(`👥 Found ${uniqueAddresses.size} unique recipient addresses`);
      console.log("💰 Checking current balances...");
      
      // Check current balances for each address
      let holdersCount = 0;
      const batchSize = 10;
      const addresses = Array.from(uniqueAddresses);
      
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        
        const balancePromises = batch.map(async (address) => {
          try {
            const balance = await contract.balanceOf(address);
            return { address, balance };
          } catch (error) {
            console.log(`⚠️ Error checking balance for ${address}:`, error.message);
            return { address, balance: 0n };
          }
        });
        
        const results = await Promise.all(balancePromises);
        
        for (const { address, balance } of results) {
          if (balance > 0n) {
            const balanceFormatted = ethers.formatUnits(balance, decimals);
            this.holders.set(address, {
              balance: balance,
              balanceFormatted: balanceFormatted
            });
            holdersCount++;
          }
        }
        
        console.log(`📊 Processed ${Math.min(i + batchSize, addresses.length)}/${addresses.length} addresses... Found ${holdersCount} holders`);
      }
      
      console.log(`✅ Analysis complete! Found ${this.holders.size} VC holders`);
      
      // Sort holders by balance
      const sortedHolders = Array.from(this.holders.entries())
        .sort((a, b) => {
          const balanceA = BigInt(a[1].balance);
          const balanceB = BigInt(b[1].balance);
          return balanceB > balanceA ? 1 : balanceB < balanceA ? -1 : 0;
        });
      
      console.log("\n🏆 Top 10 holders:");
      for (let i = 0; i < Math.min(10, sortedHolders.length); i++) {
        const [address, data] = sortedHolders[i];
        console.log(`   ${i + 1}. ${address}: ${data.balanceFormatted} VC`);
      }
      
      // Save holders to file
      const holdersData = {
        timestamp: new Date().toISOString(),
        mainnetContract: MAINNET_VC_CONTRACT,
        totalHolders: this.holders.size,
        holders: Object.fromEntries(this.holders)
      };
      
      fs.writeFileSync('vc-holders-analysis.json', JSON.stringify(holdersData, null, 2));
      console.log("💾 Holders data saved to vc-holders-analysis.json");
      
      return this.holders;
      
    } catch (error) {
      console.error("❌ Error analyzing mainnet holders:", error);
      throw error;
    }
  }

  async executeTestnetAirdrop(testnetVCContract) {
    console.log("\n🚀 Starting testnet airdrop...");
    
    if (this.holders.size === 0) {
      throw new Error("No holders found. Run analysis first.");
    }
    
    const [deployer] = await ethers.getSigners();
    console.log(`📤 Airdrop from: ${deployer.address}`);
    
    const vcContract = await ethers.getContractAt("VCToken", testnetVCContract);
    const decimals = await vcContract.decimals();
    const airdropAmount = ethers.parseUnits("100000", decimals); // 100,000 VC
    
    console.log(`💰 Airdrop amount per holder: ${ethers.formatUnits(airdropAmount, decimals)} VC`);
    console.log(`👥 Recipients: ${this.holders.size} addresses`);
    
    const totalAirdrop = airdropAmount * BigInt(this.holders.size);
    console.log(`📊 Total airdrop: ${ethers.formatUnits(totalAirdrop, decimals)} VC`);
    
    // Check deployer balance
    const deployerBalance = await vcContract.balanceOf(deployer.address);
    console.log(`💳 Deployer balance: ${ethers.formatUnits(deployerBalance, decimals)} VC`);
    
    if (deployerBalance < totalAirdrop) {
      throw new Error(`Insufficient balance! Need ${ethers.formatUnits(totalAirdrop, decimals)} VC, have ${ethers.formatUnits(deployerBalance, decimals)} VC`);
    }
    
    // Execute airdrop in batches
    const batchSize = 20; // BSC testnet can handle more
    const holders = Array.from(this.holders.keys());
    const results = [];
    
    console.log("📤 Starting batch transfers...");
    
    for (let i = 0; i < holders.length; i += batchSize) {
      const batch = holders.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(holders.length / batchSize)}...`);
      
      const batchPromises = batch.map(async (holderAddress, index) => {
        try {
          const tx = await vcContract.transfer(holderAddress, airdropAmount);
          console.log(`   ✅ ${i + index + 1}/${holders.length}: ${holderAddress} - TX: ${tx.hash}`);
          return { address: holderAddress, success: true, txHash: tx.hash };
        } catch (error) {
          console.log(`   ❌ ${i + index + 1}/${holders.length}: ${holderAddress} - Error: ${error.message}`);
          return { address: holderAddress, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < holders.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log("\n📊 Airdrop Summary:");
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Success Rate: ${((successful / results.length) * 100).toFixed(2)}%`);
    
    // Save results
    const airdropData = {
      timestamp: new Date().toISOString(),
      testnetContract: testnetVCContract,
      airdropAmount: ethers.formatUnits(airdropAmount, decimals),
      totalRecipients: holders.length,
      successful: successful,
      failed: failed,
      results: results
    };
    
    fs.writeFileSync('airdrop-results.json', JSON.stringify(airdropData, null, 2));
    console.log("💾 Airdrop results saved to airdrop-results.json");
    
    return results;
  }
}

// Main execution function
async function main() {
  const analyzer = new VCAirdropAnalyzer();
  
  try {
    // Step 1: Analyze mainnet holders
    console.log("🌐 Step 1: Analyzing BSC Mainnet VC holders...");
    await analyzer.analyzeMainnetHolders();
    
    // Step 2: Execute testnet airdrop (if testnet contract is provided)
    if (TESTNET_VC_CONTRACT) {
      console.log("\n🧪 Step 2: Executing testnet airdrop...");
      await analyzer.executeTestnetAirdrop(TESTNET_VC_CONTRACT);
    } else {
      console.log("\n⏸️ Testnet airdrop skipped - set TESTNET_VC_CONTRACT environment variable to execute");
      console.log("💡 To run airdrop: TESTNET_VC_CONTRACT=0x... npx hardhat run scripts/vc-airdrop-analysis.js --network bscTestnet");
    }
    
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("🎉 Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = { VCAirdropAnalyzer }; 