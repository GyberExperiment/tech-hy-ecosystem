const { ethers } = require('hardhat');
const { log } = require('./logger');

async function main() {
  log.info('🔄 Перевод VG токенов на контракт LPLocker...');
  log.separator();

  // Подключение к сети
  const [deployer] = await ethers.getSigners();
  
  log.info('📋 Информация о подключении:');
  log.info(`Deployer: ${deployer.address}`);
  log.info(`Network: ${(await ethers.provider.getNetwork()).name}`);
  log.info(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  log.separator();

  // Адреса контрактов
  const contracts = {
    VG_TOKEN: "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d", 
    LP_LOCKER: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  };

  // Подключение к контрактам
  const vgToken = await ethers.getContractAt("VGToken", contracts.VG_TOKEN);
  const lpLocker = await ethers.getContractAt("LPLocker", contracts.LP_LOCKER);

  log.info('💰 Проверка текущих балансов:');
  try {
    const deployerVGBalance = await vgToken.balanceOf(deployer.address);
    const contractVGBalance = await vgToken.balanceOf(contracts.LP_LOCKER);
    
    log.info(`Deployer VG Balance: ${ethers.formatEther(deployerVGBalance)} VG`);
    log.info(`LPLocker VG Balance: ${ethers.formatEther(contractVGBalance)} VG`);
    
    if (deployerVGBalance === 0n) {
      log.error('❌ У deployer нет VG токенов для перевода');
      return;
    }
  } catch (error) {
    log.error('❌ Ошибка получения балансов:', error.message);
    return;
  }
  log.separator();

  log.info('⚙️ Проверка конфигурации LPLocker:');
  try {
    const config = await lpLocker.config();
    const stakingVault = config[5];
    
    log.info(`Текущий Staking Vault: ${stakingVault}`);
    log.info(`LPLocker Address: ${contracts.LP_LOCKER}`);
    
    if (stakingVault.toLowerCase() === contracts.LP_LOCKER.toLowerCase()) {
      log.success('✅ Staking Vault правильно указывает на LPLocker контракт');
    } else {
      log.error('❌ Staking Vault указывает на неправильный адрес');
      log.info('🔧 Нужно обновить конфигурацию или перевести токены на правильный адрес');
    }
  } catch (error) {
    log.error('❌ Ошибка получения конфигурации:', error.message);
    return;
  }
  log.separator();

  log.info('🚀 Перевод VG токенов на LPLocker контракт:');
  try {
    const deployerBalance = await vgToken.balanceOf(deployer.address);
    
    // Переводим 80% от баланса deployer'а (оставляем 20% для тестов)
    const transferAmount = (deployerBalance * 80n) / 100n;
    
    console.log(`Переводим: ${ethers.formatEther(transferAmount)} VG`);
    console.log(`Получатель: ${contracts.LP_LOCKER}`);
    
    const tx = await vgToken.transfer(contracts.LP_LOCKER, transferAmount);
    console.log(`Transaction Hash: ${tx.hash}`);
    
    console.log('⏳ Ожидание подтверждения...');
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Перевод успешно выполнен!');
      
      // Проверяем новые балансы
      const newDeployerBalance = await vgToken.balanceOf(deployer.address);
      const newContractBalance = await vgToken.balanceOf(contracts.LP_LOCKER);
      
      console.log('\n📊 Новые балансы:');
      console.log(`Deployer VG Balance: ${ethers.formatEther(newDeployerBalance)} VG`);
      console.log(`LPLocker VG Balance: ${ethers.formatEther(newContractBalance)} VG`);
      
    } else {
      console.log('❌ Транзакция не удалась');
    }
  } catch (error) {
    console.log(`❌ Ошибка перевода: ${error.message}`);
  }
  console.log();

  console.log('🎉 Операция завершена!');
  console.log('💡 Теперь EarnVG виджет должен работать корректно');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }); 