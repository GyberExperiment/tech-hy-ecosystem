const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔍 Диагностика VG Rewards...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  console.log('Deployer balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'BNB\n');

  // Получаем адреса контрактов
  const CONTRACTS = {
    VG_TOKEN: deployedContracts.VG_TOKEN,
    LP_LOCKER: deployedContracts.LP_LOCKER_PROXY,
    VC_TOKEN: deployedContracts.VC_TOKEN,
    LP_TOKEN: deployedContracts.LP_TOKEN
  };

  // Получаем контракты
  const VGToken = await ethers.getContractAt('VGToken', CONTRACTS.VG_TOKEN);
  const LPLocker = await ethers.getContractAt('LPLocker', CONTRACTS.LP_LOCKER);
  const VCToken = await ethers.getContractAt('VCToken', CONTRACTS.VC_TOKEN);

  console.log('📋 Контракты:');
  console.log('VG Token:', CONTRACTS.VG_TOKEN);
  console.log('LP Locker:', CONTRACTS.LP_LOCKER);
  console.log('VC Token:', CONTRACTS.VC_TOKEN);
  console.log('LP Token:', CONTRACTS.LP_TOKEN);
  console.log();

  try {
    // 1. Проверяем права доступа
    console.log('🔐 Проверка прав доступа:');
    const vgOwner = await VGToken.owner();
    console.log('VG Token owner:', vgOwner);
    console.log('LP Locker address:', CONTRACTS.LP_LOCKER);
    console.log('LPLocker is VG owner:', vgOwner.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase());
    console.log();

    // 2. Проверяем баланс VG в LPLocker (vault)
    console.log('💰 Баланс VG токенов:');
    const lpLockerVGBalance = await VGToken.balanceOf(CONTRACTS.LP_LOCKER);
    const deployerVGBalance = await VGToken.balanceOf(deployer.address);
    const totalSupply = await VGToken.totalSupply();
    
    console.log('LPLocker VG balance:', ethers.formatEther(lpLockerVGBalance), 'VG');
    console.log('Deployer VG balance:', ethers.formatEther(deployerVGBalance), 'VG');
    console.log('Total VG supply:', ethers.formatEther(totalSupply), 'VG');
    console.log();

    // 3. Проверяем конфигурацию LPLocker
    console.log('⚙️ Конфигурация LPLocker:');
    const config = await LPLocker.config();
    console.log('LP to VG ratio:', config.lpToVgRatio.toString());
    console.log('LP divisor:', config.lpDivisor.toString());
    console.log('Max slippage BPS:', config.maxSlippageBps.toString());
    console.log();

    // 4. Проверяем статистику пула
    console.log('📊 Статистика пула:');
    const poolInfo = await LPLocker.getPoolInfo();
    console.log('Total locked LP:', ethers.formatEther(poolInfo.totalLockedLp), 'LP');
    console.log('Total VG issued:', ethers.formatEther(poolInfo.totalVgIssued), 'VG');
    console.log();

    // 5. Проверяем баланс пользователя
    console.log('👤 Баланс пользователя:');
    const userVCBalance = await VCToken.balanceOf(deployer.address);
    const userBNBBalance = await deployer.provider.getBalance(deployer.address);
    const userVGBalance = await VGToken.balanceOf(deployer.address);
    
    console.log('User VC balance:', ethers.formatEther(userVCBalance), 'VC');
    console.log('User BNB balance:', ethers.formatEther(userBNBBalance), 'BNB');
    console.log('User VG balance:', ethers.formatEther(userVGBalance), 'VG');
    console.log();

    // 6. Тестируем mint функцию (если LPLocker является owner)
    if (vgOwner.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
      console.log('🧪 Тестирование mint функции:');
      try {
        // Пытаемся заминтить 1 VG токен через LPLocker
        const testAmount = ethers.parseEther('1');
        const tx = await LPLocker.connect(deployer).testMint(deployer.address, testAmount);
        await tx.wait();
        console.log('✅ Mint функция работает корректно');
        
        // Проверяем новый баланс
        const newBalance = await VGToken.balanceOf(deployer.address);
        console.log('New VG balance:', ethers.formatEther(newBalance), 'VG');
      } catch (error) {
        console.log('❌ Ошибка mint функции:', error.message);
      }
    } else {
      console.log('❌ LPLocker не является owner VGToken - не может минтить токены!');
    }
    console.log();

    // 7. Проверяем последние события
    console.log('📜 Последние события VG Transfer:');
    try {
      const filter = VGToken.filters.Transfer();
      const events = await VGToken.queryFilter(filter, -100); // Последние 100 блоков
      
      console.log(`Найдено ${events.length} Transfer событий:`);
      events.slice(-5).forEach((event, index) => {
        console.log(`${index + 1}. From: ${event.args.from} To: ${event.args.to} Amount: ${ethers.formatEther(event.args.value)} VG`);
      });
    } catch (error) {
      console.log('Ошибка получения событий:', error.message);
    }

  } catch (error) {
    console.error('❌ Ошибка диагностики:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 