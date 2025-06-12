const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔄 Изменение VG Vault архитектуры...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Получаем адреса контрактов
  const CONTRACTS = {
    VG_TOKEN: deployedContracts.VG_TOKEN,
    LP_LOCKER: deployedContracts.LP_LOCKER_PROXY,
  };

  // Получаем контракты
  const VGToken = await ethers.getContractAt('VGToken', CONTRACTS.VG_TOKEN);
  const LPLocker = await ethers.getContractAt('LPLocker', CONTRACTS.LP_LOCKER);

  console.log('📋 Контракты:');
  console.log('VG Token:', CONTRACTS.VG_TOKEN);
  console.log('LP Locker:', CONTRACTS.LP_LOCKER);
  console.log();

  try {
    // 1. Проверяем текущую конфигурацию
    console.log('📊 Текущая конфигурация:');
    const config = await LPLocker.config();
    console.log('Current stakingVaultAddress:', config.stakingVaultAddress);
    console.log('LP Locker address:', CONTRACTS.LP_LOCKER);
    console.log('Deployer address:', deployer.address);
    console.log();

    // 2. Проверяем балансы ДО изменения
    console.log('💰 Балансы ДО изменения:');
    const deployerVGBalance = await VGToken.balanceOf(deployer.address);
    const lpLockerVGBalance = await VGToken.balanceOf(CONTRACTS.LP_LOCKER);
    const currentVaultBalance = await VGToken.balanceOf(config.stakingVaultAddress);
    
    console.log('Deployer VG balance:', ethers.formatEther(deployerVGBalance), 'VG');
    console.log('LPLocker VG balance:', ethers.formatEther(lpLockerVGBalance), 'VG');
    console.log('Current vault VG balance:', ethers.formatEther(currentVaultBalance), 'VG');
    console.log();

    if (config.stakingVaultAddress.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
      console.log('✅ Vault уже настроен на адрес контракта!');
      return;
    }

    // 3. ПРОБЛЕМА: Нет функции updateStakingVault в контракте!
    console.log('❌ ПРОБЛЕМА: В контракте LPLocker НЕТ функции updateStakingVault!');
    console.log('');
    console.log('🔧 РЕШЕНИЯ:');
    console.log('1. Добавить функцию updateStakingVault в контракт');
    console.log('2. Обновить контракт через upgrade');
    console.log('3. Или использовать governance для изменения');
    console.log();

    // 4. Показываем что нужно сделать
    console.log('📝 ЧТО НУЖНО СДЕЛАТЬ:');
    console.log('1. Добавить в LPLocker.sol функцию:');
    console.log('   function updateStakingVault(address newVault) external onlyAuthority {');
    console.log('       require(newVault != address(0), "Invalid vault address");');
    console.log('       config.stakingVaultAddress = newVault;');
    console.log('       emit ConfigurationUpdated(msg.sender, "StakingVault", block.timestamp);');
    console.log('   }');
    console.log();
    console.log('2. Обновить контракт через upgrade');
    console.log('3. Вызвать updateStakingVault(' + CONTRACTS.LP_LOCKER + ')');
    console.log('4. Перевести VG токены с deployer на LPLocker адрес');
    console.log();

    // 5. Подготавливаем данные для перевода токенов
    if (parseFloat(ethers.formatEther(deployerVGBalance)) > 0) {
      console.log('💸 Подготовка к переводу VG токенов:');
      console.log('Количество для перевода:', ethers.formatEther(deployerVGBalance), 'VG');
      console.log('С адреса:', deployer.address);
      console.log('На адрес:', CONTRACTS.LP_LOCKER);
      console.log();
      console.log('⚠️  ВНИМАНИЕ: Сначала нужно обновить контракт с функцией updateStakingVault!');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 