const axios = require('axios');
const fs = require('fs');

// BSCScan API Configuration
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const BSCSCAN_API_URL = 'https://api.bscscan.com/api';
const MAINNET_VC_CONTRACT = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";

class BSCScanHoldersAnalyzer {
  constructor() {
    this.apiKey = BSCSCAN_API_KEY;
    this.holders = new Map();
    this.totalSupply = 0n;
  }

  async makeApiCall(params) {
    const url = BSCSCAN_API_URL;
    const requestParams = {
      ...params,
      apikey: this.apiKey
    };

    try {
      const response = await axios.get(url, { params: requestParams });
      
      if (response.data.status !== '1') {
        throw new Error(`BSCScan API error: ${response.data.message || response.data.result}`);
      }
      
      return response.data.result;
    } catch (error) {
      console.error('API call failed:', error.message);
      throw error;
    }
  }

  async getTokenHolders(page = 1, pageSize = 10000) {
    console.log(`📊 Fetching token holders page ${page}...`);
    
    const params = {
      module: 'token',
      action: 'tokenholderlist',
      contractaddress: MAINNET_VC_CONTRACT,
      page: page,
      offset: pageSize
    };

    return await this.makeApiCall(params);
  }

  async getTokenInfo() {
    console.log("📋 Getting token information...");
    
    const params = {
      module: 'stats',
      action: 'tokensupply',
      contractaddress: MAINNET_VC_CONTRACT
    };

    const totalSupply = await this.makeApiCall(params);
    
    // Get token details
    const tokenParams = {
      module: 'token',
      action: 'tokeninfo',
      contractaddress: MAINNET_VC_CONTRACT
    };

    let tokenInfo;
    try {
      tokenInfo = await this.makeApiCall(tokenParams);
    } catch (error) {
      console.log("⚠️ Could not get token info via API, using contract call...");
      tokenInfo = null;
    }

    return { totalSupply, tokenInfo };
  }

  async analyzeAllHolders() {
    console.log("🔍 Starting comprehensive BSCScan analysis...");
    console.log(`📍 Contract: ${MAINNET_VC_CONTRACT}`);
    
    if (!this.apiKey) {
      console.warn("⚠️ BSCSCAN_API_KEY not set. Using free tier limits...");
    }

    try {
      // Get token info
      const { totalSupply, tokenInfo } = await this.getTokenInfo();
      this.totalSupply = BigInt(totalSupply);
      
      console.log("📊 Token Information:");
      if (tokenInfo) {
        console.log(`   Name: ${tokenInfo.tokenName}`);
        console.log(`   Symbol: ${tokenInfo.symbol}`);
        console.log(`   Decimals: ${tokenInfo.divisor}`);
      }
      console.log(`   Total Supply: ${totalSupply}`);

      // Get all holders
      let allHolders = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const holders = await this.getTokenHolders(page);
        
        if (!holders || holders.length === 0) {
          hasMore = false;
          break;
        }

        allHolders = allHolders.concat(holders);
        console.log(`📈 Retrieved ${allHolders.length} holders so far...`);

        // Check if we got less than requested (means we're at the end)
        if (holders.length < 10000) {
          hasMore = false;
        } else {
          page++;
          // Rate limiting for free API
          await new Promise(resolve => setTimeout(resolve, this.apiKey ? 200 : 1000));
        }
      }

      console.log(`✅ Found ${allHolders.length} total holders`);

      // Process and filter holders
      let validHolders = 0;
      let totalBalance = 0n;

      for (const holder of allHolders) {
        const address = holder.TokenHolderAddress.toLowerCase();
        const balance = BigInt(holder.TokenHolderQuantity);

        if (balance > 0n) {
          this.holders.set(address, {
            balance: balance,
            rank: parseInt(holder.TokenHolderRank)
          });
          validHolders++;
          totalBalance += balance;
        }
      }

      console.log(`💰 Valid holders with balance > 0: ${validHolders}`);
      console.log(`📊 Total holders balance: ${totalBalance.toString()}`);
      console.log(`🔍 Coverage: ${((Number(totalBalance) / Number(this.totalSupply)) * 100).toFixed(2)}%`);

      // Top holders analysis
      const sortedHolders = Array.from(this.holders.entries())
        .sort((a, b) => a[1].rank - b[1].rank);

      console.log("\n🏆 Top 15 Holders:");
      for (let i = 0; i < Math.min(15, sortedHolders.length); i++) {
        const [address, data] = sortedHolders[i];
        const percentage = ((Number(data.balance) / Number(this.totalSupply)) * 100).toFixed(4);
        console.log(`   ${data.rank}. ${address}: ${data.balance.toString()} VC (${percentage}%)`);
      }

      // Distribution analysis
      const distributionRanges = [
        { min: 1n, max: 1000000000000000000n, label: "0.001 - 1 VC" },
        { min: 1000000000000000000n, max: 10000000000000000000n, label: "1 - 10 VC" },
        { min: 10000000000000000000n, max: 100000000000000000000n, label: "10 - 100 VC" },
        { min: 100000000000000000000n, max: 1000000000000000000000n, label: "100 - 1,000 VC" },
        { min: 1000000000000000000000n, max: 10000000000000000000000n, label: "1K - 10K VC" },
        { min: 10000000000000000000000n, max: 100000000000000000000000n, label: "10K - 100K VC" },
        { min: 100000000000000000000000n, max: 1000000000000000000000000n, label: "100K - 1M VC" },
        { min: 1000000000000000000000000n, max: 999999999999999999999999999n, label: "1M+ VC" }
      ];

      console.log("\n📊 Distribution Analysis:");
      for (const range of distributionRanges) {
        const count = Array.from(this.holders.values()).filter(
          holder => holder.balance >= range.min && holder.balance < range.max
        ).length;
        
        if (count > 0) {
          console.log(`   ${range.label}: ${count} holders`);
        }
      }

      // Save comprehensive data
      const analysisData = {
        timestamp: new Date().toISOString(),
        contract: MAINNET_VC_CONTRACT,
        totalSupply: this.totalSupply.toString(),
        totalHolders: this.holders.size,
        tokenInfo: tokenInfo,
        topHolders: sortedHolders.slice(0, 50).map(([address, data]) => ({
          address,
          balance: data.balance.toString(),
          rank: data.rank
        })),
        distribution: distributionRanges.map(range => ({
          range: range.label,
          count: Array.from(this.holders.values()).filter(
            holder => holder.balance >= range.min && holder.balance < range.max
          ).length
        })),
        allHolders: Object.fromEntries(
          Array.from(this.holders.entries()).map(([address, data]) => [
            address,
            { balance: data.balance.toString(), rank: data.rank }
          ])
        )
      };

      fs.writeFileSync('bscscan-holders-analysis.json', JSON.stringify(analysisData, null, 2));
      console.log("💾 Complete analysis saved to bscscan-holders-analysis.json");

      // Generate airdrop addresses list
      const airdropList = Array.from(this.holders.keys());
      fs.writeFileSync('airdrop-addresses.json', JSON.stringify(airdropList, null, 2));
      console.log(`💾 Airdrop addresses list saved to airdrop-addresses.json (${airdropList.length} addresses)`);

      return this.holders;

    } catch (error) {
      console.error("❌ Analysis failed:", error);
      throw error;
    }
  }

  async estimateAirdropCost() {
    if (this.holders.size === 0) {
      console.log("⚠️ No holders data. Run analysis first.");
      return;
    }

    const holdersCount = this.holders.size;
    const airdropPerHolder = 100000; // 100K VC
    const totalAirdrop = holdersCount * airdropPerHolder;

    console.log("\n💰 Airdrop Cost Estimation:");
    console.log(`   Recipients: ${holdersCount.toLocaleString()} addresses`);
    console.log(`   Amount per holder: ${airdropPerHolder.toLocaleString()} VC`);
    console.log(`   Total airdrop needed: ${totalAirdrop.toLocaleString()} VC`);
    
    // Gas estimation (approximate)
    const gasPerTransfer = 21000; // Basic ERC20 transfer
    const gasPriceGwei = 5; // BSC average
    const bnbPrice = 600; // Approximate BNB price
    
    const totalGas = holdersCount * gasPerTransfer;
    const totalGasCostBNB = (totalGas * gasPriceGwei * 1e-9);
    const totalGasCostUSD = totalGasCostBNB * bnbPrice;

    console.log(`\n⛽ Gas Cost Estimation:`);
    console.log(`   Total gas needed: ${totalGas.toLocaleString()} gas`);
    console.log(`   Gas cost: ~${totalGasCostBNB.toFixed(4)} BNB (~$${totalGasCostUSD.toFixed(2)} USD)`);
  }
}

async function main() {
  const analyzer = new BSCScanHoldersAnalyzer();
  
  try {
    await analyzer.analyzeAllHolders();
    await analyzer.estimateAirdropCost();
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("🎉 BSCScan analysis completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Analysis failed:", error);
      process.exit(1);
    });
}

module.exports = { BSCScanHoldersAnalyzer }; 