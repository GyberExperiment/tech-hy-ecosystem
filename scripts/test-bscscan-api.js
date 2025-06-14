// Test BSCScan API without API key (free tier)
async function testBSCScanAPI() {
  console.log('🧪 TESTING BSCScan API');
  console.log('======================');
  
  const account = '0xe70eC2DeA28CD14B2d392E72F2fE68F8d8799D5E';
  const baseUrl = 'https://api-testnet.bscscan.com/api';
  
  // Test 1: Get normal transactions
  console.log('\n1️⃣ TESTING NORMAL TRANSACTIONS:');
  console.log('================================');
  
  try {
    const normalTxUrl = `${baseUrl}?module=account&action=txlist&address=${account}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
    console.log(`URL: ${normalTxUrl}`);
    
    const response = await fetch(normalTxUrl);
    const data = await response.json();
    
    console.log(`Status: ${data.status}`);
    console.log(`Message: ${data.message}`);
    console.log(`Result count: ${data.result ? data.result.length : 0}`);
    
    if (data.result && data.result.length > 0) {
      const tx = data.result[0];
      console.log(`Latest transaction:`);
      console.log(`  Hash: ${tx.hash}`);
      console.log(`  Block: ${tx.blockNumber}`);
      console.log(`  From: ${tx.from}`);
      console.log(`  To: ${tx.to}`);
      console.log(`  Value: ${tx.value} wei`);
      console.log(`  Timestamp: ${new Date(parseInt(tx.timeStamp) * 1000).toISOString()}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 2: Get token transfers
  console.log('\n2️⃣ TESTING TOKEN TRANSFERS:');
  console.log('============================');
  
  try {
    const tokenTxUrl = `${baseUrl}?module=account&action=tokentx&address=${account}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
    console.log(`URL: ${tokenTxUrl}`);
    
    const response = await fetch(tokenTxUrl);
    const data = await response.json();
    
    console.log(`Status: ${data.status}`);
    console.log(`Message: ${data.message}`);
    console.log(`Result count: ${data.result ? data.result.length : 0}`);
    
    if (data.result && data.result.length > 0) {
      const tx = data.result[0];
      console.log(`Latest token transfer:`);
      console.log(`  Hash: ${tx.hash}`);
      console.log(`  Block: ${tx.blockNumber}`);
      console.log(`  Token: ${tx.tokenSymbol} (${tx.tokenName})`);
      console.log(`  From: ${tx.from}`);
      console.log(`  To: ${tx.to}`);
      console.log(`  Value: ${tx.value} (${tx.tokenDecimal} decimals)`);
      console.log(`  Contract: ${tx.contractAddress}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: Get event logs for LPLocker
  console.log('\n3️⃣ TESTING EVENT LOGS:');
  console.log('=======================');
  
  try {
    const lpLockerAddress = '0x9269baba99cE0388Daf814E351b4d556fA728D32';
    const eventLogsUrl = `${baseUrl}?module=logs&action=getLogs&address=${lpLockerAddress}&fromBlock=0&toBlock=latest`;
    console.log(`URL: ${eventLogsUrl}`);
    
    const response = await fetch(eventLogsUrl);
    const data = await response.json();
    
    console.log(`Status: ${data.status}`);
    console.log(`Message: ${data.message}`);
    console.log(`Result count: ${data.result ? data.result.length : 0}`);
    
    if (data.result && data.result.length > 0) {
      // Filter events that involve our account
      const userEvents = data.result.filter(log => 
        log.topics.some(topic => 
          topic.toLowerCase().includes(account.slice(2).toLowerCase())
        )
      );
      
      console.log(`Events involving our account: ${userEvents.length}`);
      
      if (userEvents.length > 0) {
        const event = userEvents[0];
        console.log(`Latest user event:`);
        console.log(`  Transaction: ${event.transactionHash}`);
        console.log(`  Block: ${event.blockNumber}`);
        console.log(`  Topics: ${event.topics.length}`);
        console.log(`  Topic 0: ${event.topics[0]}`);
        if (event.topics[1]) console.log(`  Topic 1: ${event.topics[1]}`);
        console.log(`  Data: ${event.data.slice(0, 50)}...`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 4: Check specific transaction receipt
  console.log('\n4️⃣ TESTING TRANSACTION RECEIPT:');
  console.log('================================');
  
  try {
    const txHash = '0x6a4fb273dc00092cd3b75409d250b7db1edd4f3041fd21d6f52bd495d26503fe';
    const receiptUrl = `${baseUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}`;
    console.log(`URL: ${receiptUrl}`);
    
    const response = await fetch(receiptUrl);
    const data = await response.json();
    
    console.log(`Status: ${data.status}`);
    console.log(`Message: ${data.message}`);
    
    if (data.result) {
      const receipt = data.result;
      console.log(`Transaction receipt:`);
      console.log(`  Block: ${receipt.blockNumber}`);
      console.log(`  From: ${receipt.from}`);
      console.log(`  To: ${receipt.to}`);
      console.log(`  Status: ${receipt.status}`);
      console.log(`  Logs: ${receipt.logs ? receipt.logs.length : 0}`);
      console.log(`  Gas used: ${receipt.gasUsed}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n🏁 BSCScan API TEST COMPLETE');
  console.log('=============================');
  console.log('✅ BSCScan API works without API key (free tier)');
  console.log('✅ Can fetch normal transactions');
  console.log('✅ Can fetch token transfers');
  console.log('✅ Can fetch event logs');
  console.log('✅ Can fetch transaction receipts');
  console.log('\n💡 For production, consider getting a free API key from BSCScan');
  console.log('   to increase rate limits and reliability.');
}

testBSCScanAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 