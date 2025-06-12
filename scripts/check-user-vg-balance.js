const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔍 Проверка VG баланса пользователя...\n');

  const [deployer] = await ethers.getSigners();
  console.log('User address:', deployer.address);

  // Получаем VG контракт
  const VGToken = await ethers.getContractAt('VGToken', deployedContracts.VG_TOKEN);

  try {
    // Проверяем баланс
    const balance = await VGToken.balanceOf(deployer.address);
    console.log('VG Token Address:', deployedContracts.VG_TOKEN);
    console.log('User VG Balance:', ethers.formatEther(balance), 'VG');
    
    if (balance > 0) {
      console.log('✅ У вас есть VG токены!');
      console.log('💡 Если frontend не показывает баланс, попробуйте:');
      console.log('1. Обновить страницу (F5)');
      console.log('2. Переподключить MetaMask');
      console.log('3. Очистить кэш браузера');
      console.log('4. Проверить что MetaMask подключен к BSC Testnet');
    } else {
      console.log('❌ VG токены не найдены');
    }

    // Проверяем общую информацию о токене
    const totalSupply = await VGToken.totalSupply();
    const name = await VGToken.name();
    const symbol = await VGToken.symbol();
    
    console.log('\n📊 Информация о VG токене:');
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Total Supply:', ethers.formatEther(totalSupply), 'VG');

  } catch (error) {
    console.error('❌ Ошибка проверки баланса:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 