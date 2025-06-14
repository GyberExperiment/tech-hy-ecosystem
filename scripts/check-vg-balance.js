const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 ДЕТАЛЬНАЯ ПРОВЕРКА VG ТОКЕНОВ');
  console.log('='.repeat(50));

  const VG_TOKEN = "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d";
  const VG_VOTES = "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA";
  const LP_LOCKER = "0x9269baba99cE0388Daf814E351b4d556fA728D32";
  const DEPLOYER = "0xe70eC2DeA28CD14B2d392E72F2fE68F8d8799D5E";

  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function owner() view returns (address)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ];

  const LPLOCKER_ABI = [
    "function config() external view returns (tuple(address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint256 maxSlippageBps, uint256 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited))",
    "function getPoolInfo() external view returns (uint256 totalLocked, uint256 totalIssued, uint256 totalDeposited, uint256 availableVG)"
  ];

  try {
    const provider = ethers.provider;
    
    // 1. Проверка VG Token
    console.log('\n📊 1. VG TOKEN АНАЛИЗ:');
    const vgToken = new ethers.Contract(VG_TOKEN, ERC20_ABI, provider);
    
    const vgTotalSupply = await vgToken.totalSupply();
    const vgDeployerBalance = await vgToken.balanceOf(DEPLOYER);
    const vgLockerBalance = await vgToken.balanceOf(LP_LOCKER);
    const vgVotesBalance = await vgToken.balanceOf(VG_VOTES);
    
    console.log(`   Total Supply: ${ethers.formatEther(vgTotalSupply)} VG`);
    console.log(`   Deployer Balance: ${ethers.formatEther(vgDeployerBalance)} VG`);
    console.log(`   LP Locker Balance: ${ethers.formatEther(vgLockerBalance)} VG`);
    console.log(`   VG Votes Contract Balance: ${ethers.formatEther(vgVotesBalance)} VG`);
    
    // 2. Проверка VG Votes
    console.log('\n🗳️  2. VG VOTES АНАЛИЗ:');
    const vgVotes = new ethers.Contract(VG_VOTES, ERC20_ABI, provider);
    
    const vgVotesTotalSupply = await vgVotes.totalSupply();
    const vgVotesDeployerBalance = await vgVotes.balanceOf(DEPLOYER);
    
    console.log(`   Total Supply: ${ethers.formatEther(vgVotesTotalSupply)} VGVotes`);
    console.log(`   Deployer Balance: ${ethers.formatEther(vgVotesDeployerBalance)} VGVotes`);
    
    // 3. Проверка LP Locker конфигурации
    console.log('\n🔒 3. LP LOCKER КОНФИГУРАЦИЯ:');
    const lpLocker = new ethers.Contract(LP_LOCKER, LPLOCKER_ABI, provider);
    
    try {
      const config = await lpLocker.config();
      console.log(`   VG Token Address: ${config.vgTokenAddress}`);
      console.log(`   Staking Vault: ${config.stakingVaultAddress}`);
      console.log(`   Total VG Issued: ${ethers.formatEther(config.totalVgIssued)} VG`);
      console.log(`   Total VG Deposited: ${ethers.formatEther(config.totalVgDeposited)} VG`);
      
      const poolInfo = await lpLocker.getPoolInfo();
      console.log(`   Available VG in Vault: ${ethers.formatEther(poolInfo.availableVG)} VG`);
    } catch (error) {
      console.log(`   ❌ Ошибка получения конфигурации: ${error.message}`);
    }
    
    // 4. Анализ распределения
    console.log('\n📈 4. АНАЛИЗ РАСПРЕДЕЛЕНИЯ:');
    const totalVG = parseFloat(ethers.formatEther(vgTotalSupply));
    const deployerVG = parseFloat(ethers.formatEther(vgDeployerBalance));
    const lockerVG = parseFloat(ethers.formatEther(vgLockerBalance));
    const votesVG = parseFloat(ethers.formatEther(vgVotesBalance));
    
    console.log(`   Deployer: ${deployerVG.toFixed(2)} VG (${(deployerVG/totalVG*100).toFixed(2)}%)`);
    console.log(`   LP Locker: ${lockerVG.toFixed(2)} VG (${(lockerVG/totalVG*100).toFixed(2)}%)`);
    console.log(`   VG Votes: ${votesVG.toFixed(2)} VG (${(votesVG/totalVG*100).toFixed(2)}%)`);
    console.log(`   Остальное: ${(totalVG - deployerVG - lockerVG - votesVG).toFixed(2)} VG`);
    
    // 5. Проверка последних Transfer событий
    console.log('\n📜 5. ПОСЛЕДНИЕ TRANSFER СОБЫТИЯ:');
    try {
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000); // Последние 10k блоков
      
      const transferFilter = vgToken.filters.Transfer();
      const events = await vgToken.queryFilter(transferFilter, fromBlock, latestBlock);
      
      console.log(`   Найдено ${events.length} Transfer событий за последние 10k блоков`);
      
      // Показываем последние 5 событий
      const recentEvents = events.slice(-5);
      for (const event of recentEvents) {
        const from = event.args[0];
        const to = event.args[1];
        const amount = ethers.formatEther(event.args[2]);
        console.log(`   Block ${event.blockNumber}: ${from} → ${to} (${amount} VG)`);
      }
    } catch (error) {
      console.log(`   ❌ Ошибка получения событий: ${error.message}`);
    }
    
    // 6. Рекомендации
    console.log('\n💡 6. РЕКОМЕНДАЦИИ:');
    if (deployerVG < 1000000) { // Меньше 1M VG
      console.log('   ⚠️  У deployer очень мало VG токенов');
      console.log('   🔧 Возможные причины:');
      console.log('      - VG токены заблокированы в LP Locker как vault');
      console.log('      - VG токены переведены в VG Votes контракт');
      console.log('      - VG токены переведены на другие адреса');
      console.log('   💡 Проверьте VG Vault в LP Locker конфигурации');
    }
    
  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 