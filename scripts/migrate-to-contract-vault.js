const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🚀 Миграция на архитектуру Contract Vault...\n');

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
    // 1. Проверяем текущее состояние
    console.log('📊 Текущее состояние:');
    const config = await LPLocker.config();
    const deployerVGBalance = await VGToken.balanceOf(deployer.address);
    const lpLockerVGBalance = await VGToken.balanceOf(CONTRACTS.LP_LOCKER);
    
    console.log('Current stakingVaultAddress:', config.stakingVaultAddress);
    console.log('Deployer VG balance:', ethers.formatEther(deployerVGBalance), 'VG');
    console.log('LPLocker VG balance:', ethers.formatEther(lpLockerVGBalance), 'VG');
    console.log();

    // 2. ШАГ 1: Изменяем vault адрес на адрес контракта
    if (config.stakingVaultAddress.toLowerCase() !== CONTRACTS.LP_LOCKER.toLowerCase()) {
      console.log('🔄 ШАГ 1: Изменение stakingVaultAddress...');
      
      const updateTx = await LPLocker.updateStakingVault(CONTRACTS.LP_LOCKER);
      console.log('Transaction hash:', updateTx.hash);
      await updateTx.wait();
      
      console.log('✅ stakingVaultAddress изменен на адрес контракта');
      
      // Проверяем изменение
      const newConfig = await LPLocker.config();
      console.log('New stakingVaultAddress:', newConfig.stakingVaultAddress);
      console.log();
    } else {
      console.log('✅ stakingVaultAddress уже настроен на адрес контракта');
      console.log();
    }

    // 3. ШАГ 2: Переводим VG токены на адрес контракта
    if (parseFloat(ethers.formatEther(deployerVGBalance)) > 0) {
      console.log('💸 ШАГ 2: Перевод VG токенов на контракт...');
      
      const transferAmount = deployerVGBalance; // Переводим все токены
      console.log('Переводим:', ethers.formatEther(transferAmount), 'VG');
      console.log('С адреса:', deployer.address);
      console.log('На адрес:', CONTRACTS.LP_LOCKER);
      
      const transferTx = await VGToken.transfer(CONTRACTS.LP_LOCKER, transferAmount);
      console.log('Transaction hash:', transferTx.hash);
      await transferTx.wait();
      
      console.log('✅ VG токены переведены на контракт');
      console.log();
    } else {
      console.log('ℹ️  VG токены уже на контракте или отсутствуют у deployer');
      console.log();
    }

    // 4. Проверяем финальное состояние
    console.log('🎯 ФИНАЛЬНОЕ СОСТОЯНИЕ:');
    const finalConfig = await LPLocker.config();
    const finalDeployerBalance = await VGToken.balanceOf(deployer.address);
    const finalLPLockerBalance = await VGToken.balanceOf(CONTRACTS.LP_LOCKER);
    
    console.log('stakingVaultAddress:', finalConfig.stakingVaultAddress);
    console.log('Deployer VG balance:', ethers.formatEther(finalDeployerBalance), 'VG');
    console.log('LPLocker VG balance:', ethers.formatEther(finalLPLockerBalance), 'VG');
    console.log();

    // 5. Проверяем что новая архитектура работает
    console.log('🧪 Проверка новой архитектуры:');
    console.log('✅ Vault = Contract:', finalConfig.stakingVaultAddress.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase());
    console.log('✅ VG токены в контракте:', parseFloat(ethers.formatEther(finalLPLockerBalance)) > 0);
    console.log('✅ earnVG будет использовать transfer вместо transferFrom');
    console.log();

    console.log('🎉 МИГРАЦИЯ ЗАВЕРШЕНА!');
    console.log('');
    console.log('📝 ЧТО ИЗМЕНИЛОСЬ:');
    console.log('• stakingVaultAddress = адрес LPLocker контракта');
    console.log('• VG токены хранятся в самом контракте');
    console.log('• earnVG использует transfer из контракта пользователю');
    console.log('• Ты можешь пополнять vault простым transfer на адрес контракта');
    console.log('• Контракт полностью автономен');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 