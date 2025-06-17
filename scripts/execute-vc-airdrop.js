const { ethers } = require("hardhat");
const fs = require('fs');
const { VCAirdropAnalyzer } = require('./vc-airdrop-analysis');
const { BSCScanHoldersAnalyzer } = require('./bscscan-holders-analyzer');

// Configuration
const MAINNET_VC_CONTRACT = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";
const AIRDROP_AMOUNT = ethers.parseEther("100000"); // 100,000 VC (assuming 18 decimals)

class VCAirdropExecutor {
  constructor() {
    this.holders = new Map();
    this.batchAirdropContract = null;
    this.vcTokenContract = null;
    this.deployedContracts = {};
  }

  async loadHoldersData(useCache = true) {
    console.log("📂 Loading holders data...");
    
    // Try to load from cache first
    if (useCache) {
      try {
        if (fs.existsSync('bscscan-holders-analysis.json')) {
          console.log("📋 Loading from BSCScan analysis cache...");
          const data = JSON.parse(fs.readFileSync('bscscan-holders-analysis.json', 'utf8'));
          
          for (const [address, holderData] of Object.entries(data.allHolders)) {
            this.holders.set(address.toLowerCase(), {
              balance: BigInt(holderData.balance),
              rank: holderData.rank
            });
          }
          
          console.log(`✅ Loaded ${this.holders.size} holders from cache`);
          return this.holders;
        }
        
        if (fs.existsSync('vc-holders-analysis.json')) {
          console.log("📋 Loading from on-chain analysis cache...");
          const data = JSON.parse(fs.readFileSync('vc-holders-analysis.json', 'utf8'));
          
          for (const [address, holderData] of Object.entries(data.holders)) {
            this.holders.set(address.toLowerCase(), {
              balance: BigInt(holderData.balance),
              balanceFormatted: holderData.balanceFormatted
            });
          }
          
          console.log(`✅ Loaded ${this.holders.size} holders from cache`);
          return this.holders;
        }
      } catch (error) {
        console.log("⚠️ Error loading cached data:", error.message);
      }
    }

    // Fetch fresh data
    console.log("🔍 Fetching fresh holders data...");
    
    // Try BSCScan first (more comprehensive)
    if (process.env.BSCSCAN_API_KEY) {
      console.log("🌐 Using BSCScan API for comprehensive analysis...");
      const bscscanAnalyzer = new BSCScanHoldersAnalyzer();
      await bscscanAnalyzer.analyzeAllHolders();
      this.holders = bscscanAnalyzer.holders;
    } else {
      console.log("⛓️ Using on-chain analysis (last 50k blocks)...");
      const onchainAnalyzer = new VCAirdropAnalyzer();
      await onchainAnalyzer.analyzeMainnetHolders();
      this.holders = onchainAnalyzer.holders;
    }

    return this.holders;
  }

  async deployBatchAirdropContract() {
    console.log("🚀 Deploying BatchAirdrop contract...");
    
    const BatchAirdrop = await ethers.getContractFactory("BatchAirdrop");
    const batchAirdrop = await BatchAirdrop.deploy();
    await batchAirdrop.waitForDeployment();
    
    const address = await batchAirdrop.getAddress();
    console.log(`✅ BatchAirdrop deployed at: ${address}`);
    
    this.batchAirdropContract = batchAirdrop;
    this.deployedContracts.batchAirdrop = address;
    
    return batchAirdrop;
  }

  async setupVCTokenContract() {
    console.log("🔗 Setting up VC Token contract...");
    
    // Check if we have deployed VC token
    let vcTokenAddress = process.env.TESTNET_VC_CONTRACT;
    
    if (!vcTokenAddress) {
      // Deploy new VC token for testing
      console.log("📦 Deploying test VC Token...");
      const VCToken = await ethers.getContractFactory("VCToken");
      const vcToken = await VCToken.deploy();
      await vcToken.waitForDeployment();
      
      vcTokenAddress = await vcToken.getAddress();
      console.log(`✅ Test VC Token deployed at: ${vcTokenAddress}`);
      this.deployedContracts.vcToken = vcTokenAddress;
    }
    
    this.vcTokenContract = await ethers.getContractAt("VCToken", vcTokenAddress);
    return this.vcTokenContract;
  }

  async calculateAirdropRequirements() {
    console.log("🧮 Calculating airdrop requirements...");
    
    const holdersCount = this.holders.size;
    const totalAirdrop = AIRDROP_AMOUNT * BigInt(holdersCount);
    
    console.log(`📊 Airdrop Requirements:`);
    console.log(`   Recipients: ${holdersCount.toLocaleString()}`);
    console.log(`   Amount per recipient: ${ethers.formatEther(AIRDROP_AMOUNT)} VC`);
    console.log(`   Total tokens needed: ${ethers.formatEther(totalAirdrop)} VC`);
    
    // Check current VC token balance
    const [deployer] = await ethers.getSigners();
    const deployerBalance = await this.vcTokenContract.balanceOf(deployer.address);
    
    console.log(`💳 Current balance: ${ethers.formatEther(deployerBalance)} VC`);
    
    if (deployerBalance < totalAirdrop) {
      const needed = totalAirdrop - deployerBalance;
      console.log(`❌ Insufficient balance! Need ${ethers.formatEther(needed)} more VC`);
      
      // Try to mint more tokens if possible
      try {
        console.log("🏭 Attempting to mint additional tokens...");
        const mintTx = await this.vcTokenContract.mint(deployer.address, needed);
        await mintTx.wait();
        console.log(`✅ Minted ${ethers.formatEther(needed)} VC`);
      } catch (error) {
        console.log("❌ Cannot mint tokens:", error.message);
        throw new Error(`Insufficient VC tokens for airdrop. Need ${ethers.formatEther(totalAirdrop)}, have ${ethers.formatEther(deployerBalance)}`);
      }
    }
    
    return { holdersCount, totalAirdrop, deployerBalance };
  }

  async transferTokensToBatchContract(totalAmount) {
    console.log("💸 Transferring VC tokens to BatchAirdrop contract...");
    
    const batchContractAddress = await this.batchAirdropContract.getAddress();
    const transferTx = await this.vcTokenContract.transfer(batchContractAddress, totalAmount);
    await transferTx.wait();
    
    const contractBalance = await this.vcTokenContract.balanceOf(batchContractAddress);
    console.log(`✅ BatchAirdrop contract balance: ${ethers.formatEther(contractBalance)} VC`);
    
    return contractBalance;
  }

  async executeBatchAirdrop() {
    console.log("🚀 Executing batch airdrop...");
    
    const vcTokenAddress = await this.vcTokenContract.getAddress();
    const holders = Array.from(this.holders.keys());
    const batchSize = 200; // Max batch size for safety
    
    const results = [];
    let totalProcessed = 0;
    
    console.log(`📦 Processing ${holders.length} holders in batches of ${batchSize}...`);
    
    for (let i = 0; i < holders.length; i += batchSize) {
      const batch = holders.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(holders.length / batchSize);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} recipients)...`);
      
      try {
        // Estimate gas
        const gasEstimate = await this.batchAirdropContract.estimateGasCost(batch.length);
        console.log(`⛽ Estimated gas: ${gasEstimate.toLocaleString()}`);
        
        // Execute batch
        const tx = await this.batchAirdropContract.batchAirdropSameAmount(
          vcTokenAddress,
          batch,
          AIRDROP_AMOUNT,
          {
            gasLimit: gasEstimate + 100000n // Add buffer
          }
        );
        
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        
        console.log(`✅ Batch ${batchNumber} completed! Gas used: ${receipt.gasUsed.toLocaleString()}`);
        
        results.push({
          batchNumber,
          addresses: batch,
          txHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          success: true
        });
        
        totalProcessed += batch.length;
        console.log(`📊 Progress: ${totalProcessed}/${holders.length} (${((totalProcessed / holders.length) * 100).toFixed(1)}%)`);
        
        // Small delay between batches
        if (i + batchSize < holders.length) {
          console.log("⏳ Waiting 3 seconds before next batch...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        
        results.push({
          batchNumber,
          addresses: batch,
          error: error.message,
          success: false
        });
      }
    }
    
    // Summary
    const successfulBatches = results.filter(r => r.success).length;
    const failedBatches = results.filter(r => !r.success).length;
    const successfulTransfers = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.addresses.length, 0);
    
    console.log("\n🎉 Airdrop Execution Summary:");
    console.log(`   ✅ Successful batches: ${successfulBatches}/${results.length}`);
    console.log(`   ❌ Failed batches: ${failedBatches}/${results.length}`);
    console.log(`   ✅ Successful transfers: ${successfulTransfers}/${holders.length}`);
    console.log(`   📊 Success rate: ${((successfulTransfers / holders.length) * 100).toFixed(2)}%`);
    
    // Save detailed results
    const airdropResults = {
      timestamp: new Date().toISOString(),
      mainnetContract: MAINNET_VC_CONTRACT,
      testnetContract: await this.vcTokenContract.getAddress(),
      batchAirdropContract: await this.batchAirdropContract.getAddress(),
      airdropAmount: ethers.formatEther(AIRDROP_AMOUNT),
      totalHolders: holders.length,
      successfulTransfers,
      failedTransfers: holders.length - successfulTransfers,
      batches: results,
      deployedContracts: this.deployedContracts
    };
    
    fs.writeFileSync('airdrop-execution-results.json', JSON.stringify(airdropResults, null, 2));
    console.log("💾 Detailed results saved to airdrop-execution-results.json");
    
    return results;
  }

  async verifyAirdrop() {
    console.log("🔍 Verifying airdrop results...");
    
    const holders = Array.from(this.holders.keys());
    const sampleSize = Math.min(10, holders.length);
    const sampleAddresses = holders.slice(0, sampleSize);
    
    console.log(`📊 Checking balances for ${sampleSize} sample addresses...`);
    
    for (let i = 0; i < sampleAddresses.length; i++) {
      const address = sampleAddresses[i];
      const balance = await this.vcTokenContract.balanceOf(address);
      const expected = AIRDROP_AMOUNT;
      
      console.log(`   ${i + 1}. ${address}: ${ethers.formatEther(balance)} VC ${balance >= expected ? '✅' : '❌'}`);
    }
    
    // Check batch contract's remaining balance
    const batchContractAddress = await this.batchAirdropContract.getAddress();
    const remainingBalance = await this.vcTokenContract.balanceOf(batchContractAddress);
    console.log(`💰 Remaining in batch contract: ${ethers.formatEther(remainingBalance)} VC`);
    
    return sampleAddresses;
  }
}

async function main() {
  console.log("🎯 Starting TECH HY VC Airdrop Execution...");
  console.log(`📍 Mainnet VC Contract: ${MAINNET_VC_CONTRACT}`);
  console.log(`💰 Airdrop Amount: ${ethers.formatEther(AIRDROP_AMOUNT)} VC per holder`);
  
  const executor = new VCAirdropExecutor();
  
  try {
    // Step 1: Load holders data
    console.log("\n📊 Step 1: Loading VC holders data...");
    await executor.loadHoldersData(true);
    
    if (executor.holders.size === 0) {
      throw new Error("No holders found!");
    }
    
    // Step 2: Deploy batch airdrop contract
    console.log("\n🏗️ Step 2: Deploying contracts...");
    await executor.deployBatchAirdropContract();
    await executor.setupVCTokenContract();
    
    // Step 3: Calculate requirements and prepare tokens
    console.log("\n🧮 Step 3: Preparing airdrop...");
    const { totalAirdrop } = await executor.calculateAirdropRequirements();
    await executor.transferTokensToBatchContract(totalAirdrop);
    
    // Step 4: Execute airdrop
    console.log("\n🚀 Step 4: Executing airdrop...");
    await executor.executeBatchAirdrop();
    
    // Step 5: Verify results
    console.log("\n🔍 Step 5: Verifying results...");
    await executor.verifyAirdrop();
    
    console.log("\n🎉 Airdrop execution completed successfully!");
    console.log(`📊 Summary: ${executor.holders.size} VC holders received ${ethers.formatEther(AIRDROP_AMOUNT)} test VC each`);
    console.log(`🔗 Deployed contracts:`);
    console.log(`   BatchAirdrop: ${executor.deployedContracts.batchAirdrop}`);
    if (executor.deployedContracts.vcToken) {
      console.log(`   Test VC Token: ${executor.deployedContracts.vcToken}`);
    }
    
  } catch (error) {
    console.error("💥 Airdrop execution failed:", error);
    process.exit(1);
  }
}

// CLI interface
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

module.exports = { VCAirdropExecutor }; 