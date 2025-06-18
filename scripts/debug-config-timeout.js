const { ethers } = require('ethers');

// Fallback RPC providers
const FALLBACK_RPC_URLS = [
  'https://bsc-testnet-rpc.publicnode.com',
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://bsc-testnet.drpc.org',
  'https://endpoints.omniatech.io/v1/bsc/testnet/public'
];

const LP_LOCKER_ADDRESS = '0x9269baba99cE0388Daf814E351b4d556fA728D32';

const LPLOCKER_ABI = [
  "function config() external view returns (address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint16 maxSlippageBps, uint16 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited)",
  "function owner() external view returns (address)"
];

async function testConfigWithProvider(rpcUrl) {
  console.log(`\n🧪 Testing with RPC: ${rpcUrl}`);
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test network connection
    console.log('🌐 Testing network connection...');
    const network = await provider.getNetwork();
    console.log(`✅ Network: ${network.name} (chainId: ${network.chainId})`);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Current block: ${blockNumber}`);
    
    // Create contract
    console.log('🔧 Creating contract...');
    const lpLockerContract = new ethers.Contract(LP_LOCKER_ADDRESS, LPLOCKER_ABI, provider);
    console.log(`✅ Contract created at: ${lpLockerContract.target}`);
    
    // Check contract exists
    console.log('🔍 Checking contract exists...');
    const code = await provider.getCode(LP_LOCKER_ADDRESS);
    console.log(`Contract code length: ${code.length}`);
    if (code === '0x') {
      throw new Error('Contract not deployed');
    }
    console.log('✅ Contract exists');
    
    // Test simple view call
    console.log('🧪 Testing owner() call...');
    const startOwner = Date.now();
    const owner = await lpLockerContract.owner();
    const ownerTime = Date.now() - startOwner;
    console.log(`✅ Owner: ${owner} (${ownerTime}ms)`);
    
    // Test config() call with timeout
    console.log('📞 Testing config() call...');
    const startConfig = Date.now();
    
    const configPromise = lpLockerContract.config();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Config timeout after 30 seconds')), 30000);
    });
    
    // Log progress every 5 seconds
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startConfig;
      console.log(`⏳ Config call still pending... ${elapsed}ms elapsed`);
    }, 5000);
    
    try {
      const config = await Promise.race([configPromise, timeoutPromise]);
      clearInterval(progressInterval);
      const configTime = Date.now() - startConfig;
      
      console.log(`✅ Config call successful! (${configTime}ms)`);
      console.log('📊 Config result:', {
        authority: config.authority,
        vgTokenAddress: config.vgTokenAddress,
        vcTokenAddress: config.vcTokenAddress,
        pancakeRouter: config.pancakeRouter,
        lpTokenAddress: config.lpTokenAddress,
        stakingVaultAddress: config.stakingVaultAddress,
        lpDivisor: config.lpDivisor.toString(),
        lpToVgRatio: config.lpToVgRatio.toString(),
        maxSlippageBps: config.maxSlippageBps.toString(),
        mevProtectionEnabled: config.mevProtectionEnabled
      });
      
      return { success: true, time: configTime, rpcUrl };
    } catch (error) {
      clearInterval(progressInterval);
      const configTime = Date.now() - startConfig;
      console.error(`❌ Config call failed after ${configTime}ms:`, error.message);
      return { success: false, error: error.message, time: configTime, rpcUrl };
    }
    
  } catch (error) {
    console.error(`❌ RPC test failed:`, error.message);
    return { success: false, error: error.message, rpcUrl };
  }
}

async function main() {
  console.log('🔍 DIAGNOSING CONFIG() TIMEOUT ISSUE');
  console.log('=====================================');
  
  const results = [];
  
  for (const rpcUrl of FALLBACK_RPC_URLS) {
    const result = await testConfigWithProvider(rpcUrl);
    results.push(result);
    
    if (result.success) {
      console.log(`\n✅ SUCCESS with ${rpcUrl}`);
      break; // Stop on first success
    } else {
      console.log(`\n❌ FAILED with ${rpcUrl}: ${result.error}`);
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('===========');
  results.forEach((result, index) => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    const time = result.time ? `${result.time}ms` : 'N/A';
    console.log(`${index + 1}. ${status} - ${result.rpcUrl} (${time})`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Result: ${successCount}/${results.length} RPC endpoints successful`);
  
  if (successCount === 0) {
    console.log('\n🚨 ALL RPC ENDPOINTS FAILED!');
    console.log('This indicates a fundamental issue with:');
    console.log('1. Contract deployment');
    console.log('2. Network connectivity');
    console.log('3. ABI mismatch');
    console.log('4. Contract state corruption');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 