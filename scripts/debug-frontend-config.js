const { ethers } = require('ethers');

const LP_LOCKER_ADDRESS = '0x9269baba99cE0388Daf814E351b4d556fA728D32';

const LPLOCKER_ABI = [
  "function config() external view returns (address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint16 maxSlippageBps, uint16 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited)",
  "function owner() external view returns (address)"
];

async function testWithBrowserProvider() {
  console.log('🔍 TESTING CONFIG() WITH BROWSER PROVIDER CONDITIONS');
  console.log('====================================================');
  
  // Simulate browser provider conditions
  console.log('🌐 Creating JsonRpcProvider (simulating BrowserProvider)...');
  const provider = new ethers.JsonRpcProvider('https://bsc-testnet-rpc.publicnode.com');
  
  // Test network
  const network = await provider.getNetwork();
  console.log(`✅ Network: ${network.name} (chainId: ${network.chainId})`);
  
  // Create contract WITHOUT signer (read-only, like in frontend when signer is null)
  console.log('🔧 Creating contract WITHOUT signer (read-only)...');
  const contractReadOnly = new ethers.Contract(LP_LOCKER_ADDRESS, LPLOCKER_ABI, provider);
  
  console.log('📞 Testing config() with read-only contract...');
  try {
    const startTime = Date.now();
    const config = await contractReadOnly.config();
    const elapsed = Date.now() - startTime;
    console.log(`✅ Read-only config() successful! (${elapsed}ms)`);
    console.log('Config result:', {
      authority: config.authority,
      stakingVaultAddress: config.stakingVaultAddress,
      maxSlippageBps: config.maxSlippageBps.toString(),
      mevProtectionEnabled: config.mevProtectionEnabled
    });
  } catch (error) {
    console.error('❌ Read-only config() failed:', error.message);
  }
  
  // Now test with a mock signer (simulating frontend conditions)
  console.log('\n🔧 Creating contract WITH mock signer...');
  
  // Create a mock wallet for testing (this simulates having a signer)
  const mockWallet = ethers.Wallet.createRandom().connect(provider);
  const contractWithSigner = new ethers.Contract(LP_LOCKER_ADDRESS, LPLOCKER_ABI, mockWallet);
  
  console.log('📞 Testing config() with signer-connected contract...');
  try {
    const startTime = Date.now();
    
    // Add timeout and progress logging like in frontend
    const configPromise = contractWithSigner.config();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Config timeout after 15 seconds')), 15000);
    });
    
    // Progress logging
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      console.log(`⏳ Config call still pending... ${elapsed}ms elapsed`);
    }, 3000);
    
    const config = await Promise.race([configPromise, timeoutPromise]);
    clearInterval(progressInterval);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Signer-connected config() successful! (${elapsed}ms)`);
    console.log('Config result:', {
      authority: config.authority,
      stakingVaultAddress: config.stakingVaultAddress,
      maxSlippageBps: config.maxSlippageBps.toString(),
      mevProtectionEnabled: config.mevProtectionEnabled
    });
  } catch (error) {
    console.error('❌ Signer-connected config() failed:', error.message);
  }
  
  // Test the exact ABI format from Web3Context
  console.log('\n🧪 Testing with EXACT Web3Context ABI format...');
  
  const WEB3_CONTEXT_ABI = [
    "function config() external view returns (address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint16 maxSlippageBps, uint16 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited)"
  ];
  
  const exactContract = new ethers.Contract(LP_LOCKER_ADDRESS, WEB3_CONTEXT_ABI, mockWallet);
  
  console.log('📞 Testing config() with exact Web3Context ABI...');
  try {
    const startTime = Date.now();
    const config = await exactContract.config();
    const elapsed = Date.now() - startTime;
    console.log(`✅ Exact ABI config() successful! (${elapsed}ms)`);
    
    // Test accessing named properties like in frontend
    console.log('🔍 Testing named property access...');
    console.log('stakingVaultAddress:', config.stakingVaultAddress);
    console.log('maxSlippageBps:', config.maxSlippageBps.toString());
    console.log('mevProtectionEnabled:', config.mevProtectionEnabled);
    
  } catch (error) {
    console.error('❌ Exact ABI config() failed:', error.message);
  }
}

async function main() {
  try {
    await testWithBrowserProvider();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 