const { ethers, upgrades } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔄 Обновление LPLocker с функцией updateStakingVault...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const LP_LOCKER_PROXY = deployedContracts.LP_LOCKER_PROXY;
  console.log('LP Locker Proxy:', LP_LOCKER_PROXY);
  console.log();

  try {
    // 1. Получаем текущую версию контракта
    console.log('📋 Проверка текущей версии...');
    const currentLPLocker = await ethers.getContractAt('LPLocker', LP_LOCKER_PROXY);
    const config = await currentLPLocker.config();
    console.log('Current stakingVaultAddress:', config.stakingVaultAddress);
    console.log();

    // 2. Подготавливаем новую версию контракта
    console.log('🔧 Подготовка новой версии LPLocker...');
    const LPLockerV2 = await ethers.getContractFactory('LPLocker');
    
    // 3. Выполняем upgrade
    console.log('⬆️  Выполнение upgrade...');
    const upgradedLPLocker = await upgrades.upgradeProxy(LP_LOCKER_PROXY, LPLockerV2);
    await upgradedLPLocker.waitForDeployment();
    
    console.log('✅ Upgrade завершен!');
    console.log('Proxy address:', await upgradedLPLocker.getAddress());
    console.log();

    // 4. Проверяем что новая функция доступна
    console.log('🧪 Проверка новой функции updateStakingVault...');
    try {
      // Пробуем вызвать функцию (dry run)
      const newVaultAddress = LP_LOCKER_PROXY; // Адрес самого контракта
      
      // Проверяем что функция существует
      const functionExists = typeof upgradedLPLocker.updateStakingVault === 'function';
      console.log('updateStakingVault function exists:', functionExists);
      
      if (functionExists) {
        console.log('✅ Функция updateStakingVault успешно добавлена!');
        console.log('Готов к изменению vault адреса на:', newVaultAddress);
      } else {
        console.log('❌ Функция updateStakingVault не найдена');
      }
    } catch (error) {
      console.log('❌ Ошибка проверки функции:', error.message);
    }

    console.log();
    console.log('🎯 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Вызвать updateStakingVault(' + LP_LOCKER_PROXY + ')');
    console.log('2. Перевести VG токены с deployer на LPLocker адрес');
    console.log('3. Проверить что earnVG работает с новой архитектурой');

  } catch (error) {
    console.error('❌ Ошибка upgrade:', error.message);
    
    if (error.message.includes('already initialized')) {
      console.log('ℹ️  Контракт уже инициализирован, это нормально для upgrade');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 