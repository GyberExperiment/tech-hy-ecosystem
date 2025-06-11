const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔧 Исправление VG Token Ownership...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Получаем адреса контрактов
  const CONTRACTS = {
    VG_TOKEN: deployedContracts.VG_TOKEN,
    LP_LOCKER: deployedContracts.LP_LOCKER_PROXY,
  };

  // Получаем контракты
  const VGToken = await ethers.getContractAt('VGToken', CONTRACTS.VG_TOKEN);

  console.log('📋 Контракты:');
  console.log('VG Token:', CONTRACTS.VG_TOKEN);
  console.log('LP Locker:', CONTRACTS.LP_LOCKER);
  console.log();

  try {
    // 1. Проверяем текущий owner
    console.log('🔐 Текущий статус:');
    const currentOwner = await VGToken.owner();
    console.log('Current VG Token owner:', currentOwner);
    console.log('LP Locker address:', CONTRACTS.LP_LOCKER);
    console.log('Is LPLocker already owner:', currentOwner.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase());
    console.log();

    if (currentOwner.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
      console.log('✅ LPLocker уже является owner VGToken');
      return;
    }

    // 2. Передаем ownership LPLocker контракту
    console.log('🔄 Передача ownership...');
    const tx = await VGToken.transferOwnership(CONTRACTS.LP_LOCKER);
    console.log('Transaction hash:', tx.hash);
    
    console.log('⏳ Ожидание подтверждения...');
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Ownership успешно передан!');
      
      // 3. Проверяем новый owner
      const newOwner = await VGToken.owner();
      console.log('New VG Token owner:', newOwner);
      console.log('Transfer successful:', newOwner.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase());
    } else {
      console.log('❌ Транзакция не удалась');
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