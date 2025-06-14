const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 ДИАГНОСТИКА ПРОБЛЕМЫ ЗАГРУЗКИ ДАННЫХ FRONTEND');
  console.log('='.repeat(60));

  // Адреса из frontend/constants/contracts.ts
  const CONTRACTS = {
    VC_TOKEN: "0xC88eC091302Eb90e78a4CA361D083330752dfc9A",
    VG_TOKEN: "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d", 
    VG_TOKEN_VOTES: "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA",
    LP_TOKEN: "0xA221093a37396c6301db4B24D55E1C871DF31d13",
    LP_LOCKER: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  };

  // Тестовый аккаунт из скриншота
  const testAccount = "0xe70eC2DeA28CD14B2d392E72F2fE68F8d8799D5E";

  try {
    // 1. Проверка подключения к сети
    console.log('\n📡 1. ПРОВЕРКА ПОДКЛЮЧЕНИЯ К BSC TESTNET:');
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log(`   Network: ${network.name} (chainId: ${network.chainId})`);
    
    if (network.chainId !== 97n) {
      console.log('   ❌ ОШИБКА: Не подключен к BSC Testnet (chainId должен быть 97)');
      return;
    }
    console.log('   ✅ Подключение к BSC Testnet OK');

    // 2. Проверка BNB баланса
    console.log('\n💰 2. ПРОВЕРКА BNB БАЛАНСА:');
    try {
      const bnbBalance = await provider.getBalance(testAccount);
      const bnbFormatted = ethers.formatEther(bnbBalance);
      console.log(`   BNB Balance: ${bnbFormatted} tBNB`);
      
      if (bnbBalance === 0n) {
        console.log('   ⚠️  ПРЕДУПРЕЖДЕНИЕ: BNB баланс равен 0');
      } else {
        console.log('   ✅ BNB баланс OK');
      }
    } catch (error) {
      console.log(`   ❌ ОШИБКА получения BNB баланса: ${error.message}`);
    }

    // 3. Проверка контрактов токенов
    console.log('\n🪙 3. ПРОВЕРКА КОНТРАКТОВ ТОКЕНОВ:');
    
    const ERC20_ABI = [
      "function balanceOf(address) view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)"
    ];

    const tokens = [
      { name: 'VC Token', address: CONTRACTS.VC_TOKEN },
      { name: 'VG Token', address: CONTRACTS.VG_TOKEN },
      { name: 'VG Votes', address: CONTRACTS.VG_TOKEN_VOTES },
      { name: 'LP Token', address: CONTRACTS.LP_TOKEN }
    ];

    for (const token of tokens) {
      try {
        console.log(`\n   📋 ${token.name} (${token.address}):`);
        
        // Проверка существования контракта
        const code = await provider.getCode(token.address);
        if (code === '0x') {
          console.log(`     ❌ ОШИБКА: Контракт не найден по адресу ${token.address}`);
          continue;
        }
        console.log(`     ✅ Контракт существует`);

        // Создание экземпляра контракта
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        
        // Получение базовой информации
        const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.totalSupply()
        ]);

        if (name.status === 'fulfilled') {
          console.log(`     Name: ${name.value}`);
        } else {
          console.log(`     ❌ Ошибка получения name: ${name.reason.message}`);
        }

        if (symbol.status === 'fulfilled') {
          console.log(`     Symbol: ${symbol.value}`);
        } else {
          console.log(`     ❌ Ошибка получения symbol: ${symbol.reason.message}`);
        }

        if (decimals.status === 'fulfilled') {
          console.log(`     Decimals: ${decimals.value}`);
        } else {
          console.log(`     ❌ Ошибка получения decimals: ${decimals.reason.message}`);
        }

        if (totalSupply.status === 'fulfilled') {
          const supply = ethers.formatEther(totalSupply.value);
          console.log(`     Total Supply: ${supply}`);
        } else {
          console.log(`     ❌ Ошибка получения totalSupply: ${totalSupply.reason.message}`);
        }

        // Проверка баланса тестового аккаунта
        try {
          const balance = await contract.balanceOf(testAccount);
          const balanceFormatted = ethers.formatEther(balance);
          console.log(`     Balance (${testAccount}): ${balanceFormatted}`);
          
          if (balance === 0n) {
            console.log(`     ⚠️  Баланс ${token.name} равен 0`);
          } else {
            console.log(`     ✅ Баланс ${token.name} OK`);
          }
        } catch (error) {
          console.log(`     ❌ ОШИБКА получения баланса: ${error.message}`);
        }

      } catch (error) {
        console.log(`     ❌ КРИТИЧЕСКАЯ ОШИБКА для ${token.name}: ${error.message}`);
      }
    }

    // 4. Проверка RPC endpoints
    console.log('\n🌐 4. ПРОВЕРКА RPC ENDPOINTS:');
    const rpcUrls = [
      'https://bsc-testnet.bnb.org/v1/',
      'https://data-seed-prebsc-1-s1.binance.org:8545/',
      'https://data-seed-prebsc-2-s1.binance.org:8545/'
    ];

    for (const rpcUrl of rpcUrls) {
      try {
        const testProvider = new ethers.JsonRpcProvider(rpcUrl);
        const blockNumber = await testProvider.getBlockNumber();
        console.log(`   ✅ ${rpcUrl} - Block: ${blockNumber}`);
      } catch (error) {
        console.log(`   ❌ ${rpcUrl} - Error: ${error.message}`);
      }
    }

    // 5. Проверка LP Locker контракта
    console.log('\n🔒 5. ПРОВЕРКА LP LOCKER КОНТРАКТА:');
    try {
      const lpLockerAddress = CONTRACTS.LP_LOCKER;
      const code = await provider.getCode(lpLockerAddress);
      
      if (code === '0x') {
        console.log(`   ❌ LP Locker контракт не найден по адресу ${lpLockerAddress}`);
      } else {
        console.log(`   ✅ LP Locker контракт существует`);
        
        // Проверка базовых функций
        const LPLOCKER_ABI = [
          "function config() external view returns (tuple(address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint256 maxSlippageBps, uint256 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited))",
          "function getPoolInfo() external view returns (uint256 totalLocked, uint256 totalIssued, uint256 totalDeposited, uint256 availableVG)"
        ];
        
        const lpLocker = new ethers.Contract(lpLockerAddress, LPLOCKER_ABI, provider);
        
        try {
          const config = await lpLocker.config();
          console.log(`   Config loaded successfully`);
          console.log(`   Authority: ${config.authority}`);
          console.log(`   VG Token: ${config.vgTokenAddress}`);
          console.log(`   VC Token: ${config.vcTokenAddress}`);
        } catch (error) {
          console.log(`   ❌ Ошибка получения config: ${error.message}`);
        }

        try {
          const poolInfo = await lpLocker.getPoolInfo();
          console.log(`   Pool Info loaded successfully`);
          console.log(`   Total Locked: ${ethers.formatEther(poolInfo.totalLocked)}`);
          console.log(`   Available VG: ${ethers.formatEther(poolInfo.availableVG)}`);
        } catch (error) {
          console.log(`   ❌ Ошибка получения poolInfo: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ КРИТИЧЕСКАЯ ОШИБКА LP Locker: ${error.message}`);
    }

    console.log('\n📊 РЕЗЮМЕ ДИАГНОСТИКИ:');
    console.log('='.repeat(60));
    console.log('Если все проверки прошли успешно, проблема может быть в:');
    console.log('1. Frontend не подключается к MetaMask');
    console.log('2. MetaMask не переключен на BSC Testnet');
    console.log('3. Проблемы с CORS или сетевыми запросами');
    console.log('4. Ошибки в Web3Context или Dashboard компонентах');
    console.log('\nПроверьте консоль браузера для дополнительных ошибок.');

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ДИАГНОСТИКИ:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 