const { ethers } = require('hardhat');

async function debugTransactionHistory() {
  console.log('🔍 DEBUG: Transaction History Analysis');
  console.log('=====================================');
  
  const account = '0xe70eC2DeA28CD14B2d392E72F2fE68F8d8799D5E';
  const provider = new ethers.JsonRpcProvider('https://bsc-testnet-rpc.publicnode.com');
  
  // Contract addresses
  const LP_LOCKER = '0x9269baba99cE0388Daf814E351b4d556fA728D32';
  const VG_TOKEN = '0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d';
  const VC_TOKEN = '0xC88eC091302Eb90e78a4CA361D083330752dfc9A';
  const LP_TOKEN = '0xA221093a37396c6301db4B24D55E1C871DF31d13';
  
  // Known transaction hashes
  const knownTxs = [
    '0x6a4fb273dc00092cd3b75409d250b7db1edd4f3041fd21d6f52bd495d26503fe', // earnVG fix
    '0xb314f4c07555c6e6158d9921778b989cf9388f4cf1a88b67bbfe95b1635cfb7d', // MEV disable
    '0xf7850a9ea2150d88402a7f2fe643be17251a3faed4a8b1a081311ee71da982ce', // Add liquidity
    '0x05efba57c502b405ad59fb2a64d32f919f973a536253774561715e387c4faf95'  // Create pair
  ];
  
  console.log(`Account: ${account}`);
  console.log(`Current block: ${await provider.getBlockNumber()}`);
  console.log('');
  
  // 1. Check known transactions
  console.log('1️⃣ CHECKING KNOWN TRANSACTIONS:');
  console.log('================================');
  
  for (const txHash of knownTxs) {
    try {
      console.log(`\nChecking: ${txHash}`);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        console.log('❌ Transaction not found');
        continue;
      }
      
      console.log(`✅ Found transaction:`);
      console.log(`   From: ${receipt.from}`);
      console.log(`   To: ${receipt.to}`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Logs: ${receipt.logs.length}`);
      
      // Check if from our account
      if (receipt.from.toLowerCase() === account.toLowerCase()) {
        console.log('✅ Transaction is from our account');
        
        // Analyze logs
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          console.log(`   Log ${i}: ${log.address} - ${log.topics.length} topics`);
          
          if (log.address.toLowerCase() === LP_LOCKER.toLowerCase()) {
            console.log('   🎯 LPLocker event found!');
            console.log(`      Topic 0: ${log.topics[0]}`);
            if (log.topics[1]) console.log(`      Topic 1: ${log.topics[1]}`);
            if (log.topics[2]) console.log(`      Topic 2: ${log.topics[2]}`);
          }
        }
      } else {
        console.log('❌ Transaction is NOT from our account');
      }
      
    } catch (error) {
      console.log(`❌ Error checking transaction: ${error.message}`);
    }
  }
  
  // 2. Check Transfer events for our tokens
  console.log('\n\n2️⃣ CHECKING TRANSFER EVENTS:');
  console.log('=============================');
  
  const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
  console.log(`Transfer topic: ${TRANSFER_TOPIC}`);
  
  const tokens = [
    { address: VG_TOKEN, symbol: 'VG' },
    { address: VC_TOKEN, symbol: 'VC' },
    { address: LP_TOKEN, symbol: 'LP' }
  ];
  
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 10000); // Last 10k blocks
  
  for (const token of tokens) {
    try {
      console.log(`\nChecking ${token.symbol} transfers (${token.address}):`);
      
      // Transfers FROM user
      const fromLogs = await provider.getLogs({
        address: token.address,
        topics: [TRANSFER_TOPIC, ethers.zeroPadValue(account, 32), null],
        fromBlock,
        toBlock: currentBlock
      });
      
      // Transfers TO user
      const toLogs = await provider.getLogs({
        address: token.address,
        topics: [TRANSFER_TOPIC, null, ethers.zeroPadValue(account, 32)],
        fromBlock,
        toBlock: currentBlock
      });
      
      console.log(`   FROM user: ${fromLogs.length} events`);
      console.log(`   TO user: ${toLogs.length} events`);
      
      // Show first few events
      const allLogs = [...fromLogs, ...toLogs];
      for (let i = 0; i < Math.min(3, allLogs.length); i++) {
        const log = allLogs[i];
        console.log(`   Event ${i}: Block ${log.blockNumber}, Tx ${log.transactionHash}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // 3. Check LPLocker events
  console.log('\n\n3️⃣ CHECKING LPLOCKER EVENTS:');
  console.log('=============================');
  
  const VG_TOKENS_EARNED_TOPIC = ethers.id("VGTokensEarned(address,uint256,uint256,uint256,uint256,uint256)");
  const LP_TOKENS_LOCKED_TOPIC = ethers.id("LPTokensLocked(address,uint256,uint256,uint256)");
  
  console.log(`VGTokensEarned topic: ${VG_TOKENS_EARNED_TOPIC}`);
  console.log(`LPTokensLocked topic: ${LP_TOKENS_LOCKED_TOPIC}`);
  
  try {
    // Check VGTokensEarned events
    const earnVGLogs = await provider.getLogs({
      address: LP_LOCKER,
      topics: [VG_TOKENS_EARNED_TOPIC, ethers.zeroPadValue(account, 32)],
      fromBlock,
      toBlock: currentBlock
    });
    
    console.log(`VGTokensEarned events: ${earnVGLogs.length}`);
    
    // Check LPTokensLocked events
    const lockLPLogs = await provider.getLogs({
      address: LP_LOCKER,
      topics: [LP_TOKENS_LOCKED_TOPIC, ethers.zeroPadValue(account, 32)],
      fromBlock,
      toBlock: currentBlock
    });
    
    console.log(`LPTokensLocked events: ${lockLPLogs.length}`);
    
    // Try without user filter
    console.log('\nTrying without user filter:');
    const allEarnVGLogs = await provider.getLogs({
      address: LP_LOCKER,
      topics: [VG_TOKENS_EARNED_TOPIC],
      fromBlock,
      toBlock: currentBlock
    });
    
    console.log(`All VGTokensEarned events: ${allEarnVGLogs.length}`);
    
    // Show details of first event
    if (allEarnVGLogs.length > 0) {
      const log = allEarnVGLogs[0];
      console.log(`First event details:`);
      console.log(`   Block: ${log.blockNumber}`);
      console.log(`   Tx: ${log.transactionHash}`);
      console.log(`   Topics: ${log.topics.length}`);
      for (let i = 0; i < log.topics.length; i++) {
        console.log(`   Topic ${i}: ${log.topics[i]}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error checking LPLocker events: ${error.message}`);
  }
  
  // 4. Check account transaction count
  console.log('\n\n4️⃣ ACCOUNT TRANSACTION COUNT:');
  console.log('==============================');
  
  try {
    const txCount = await provider.getTransactionCount(account);
    console.log(`Total transactions sent: ${txCount}`);
    
    // Check recent blocks for any transactions from this account
    console.log('\nChecking recent blocks for account activity:');
    let foundTxs = 0;
    
    for (let i = 0; i < 100 && foundTxs < 5; i++) {
      const blockNumber = currentBlock - i;
      try {
        const block = await provider.getBlock(blockNumber, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx !== 'string' && tx.from && tx.from.toLowerCase() === account.toLowerCase()) {
              console.log(`   Found tx in block ${blockNumber}: ${tx.hash}`);
              foundTxs++;
              if (foundTxs >= 5) break;
            }
          }
        }
      } catch (error) {
        // Skip block if error
      }
    }
    
    if (foundTxs === 0) {
      console.log('   ❌ No recent transactions found from this account');
    }
    
  } catch (error) {
    console.log(`❌ Error checking account: ${error.message}`);
  }
  
  console.log('\n🏁 DEBUG COMPLETE');
}

debugTransactionHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }); 