const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔍 Проверка последних транзакций earnVG...\n');

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
    // 1. Проверяем последние события VGTokensEarned
    console.log('🎯 Последние события VGTokensEarned:');
    try {
      const earnedFilter = LPLocker.filters.VGTokensEarned();
      const earnedEvents = await LPLocker.queryFilter(earnedFilter, -1000); // Последние 1000 блоков
      
      console.log(`Найдено ${earnedEvents.length} VGTokensEarned событий:`);
      earnedEvents.slice(-5).forEach((event, index) => {
        console.log(`${index + 1}. User: ${event.args.user}`);
        console.log(`   LP Amount: ${ethers.formatEther(event.args.lpAmount)} LP`);
        console.log(`   VG Reward: ${ethers.formatEther(event.args.vgReward)} VG`);
        console.log(`   Block: ${event.blockNumber}`);
        console.log(`   Tx Hash: ${event.transactionHash}`);
        console.log();
      });
    } catch (error) {
      console.log('Ошибка получения VGTokensEarned событий:', error.message);
    }

    // 2. Проверяем последние события VG Transfer
    console.log('💸 Последние события VG Transfer:');
    try {
      const transferFilter = VGToken.filters.Transfer();
      const transferEvents = await VGToken.queryFilter(transferFilter, -1000); // Последние 1000 блоков
      
      console.log(`Найдено ${transferEvents.length} Transfer событий:`);
      transferEvents.slice(-10).forEach((event, index) => {
        console.log(`${index + 1}. From: ${event.args.from.slice(0, 8)}...${event.args.from.slice(-6)}`);
        console.log(`   To: ${event.args.to.slice(0, 8)}...${event.args.to.slice(-6)}`);
        console.log(`   Amount: ${ethers.formatEther(event.args.value)} VG`);
        console.log(`   Block: ${event.blockNumber}`);
        console.log(`   Tx Hash: ${event.transactionHash}`);
        console.log();
      });
    } catch (error) {
      console.log('Ошибка получения Transfer событий:', error.message);
    }

    // 3. Проверяем текущий баланс пользователя
    console.log('👤 Текущий баланс пользователя:');
    const userVGBalance = await VGToken.balanceOf(deployer.address);
    console.log('User VG balance:', ethers.formatEther(userVGBalance), 'VG');
    console.log();

    // 4. Симулируем earnVG транзакцию (без отправки)
    console.log('🧪 Симуляция earnVG транзакции:');
    try {
      const vcAmount = ethers.parseEther('1'); // 1 VC
      const bnbAmount = ethers.parseEther('0.001'); // 0.001 BNB
      const slippageBps = 1000; // 10%

      // Проверяем балансы перед симуляцией
      const VCToken = await ethers.getContractAt('VCToken', deployedContracts.VC_TOKEN);
      const vcBalance = await VCToken.balanceOf(deployer.address);
      const bnbBalance = await deployer.provider.getBalance(deployer.address);

      console.log('VC balance:', ethers.formatEther(vcBalance), 'VC');
      console.log('BNB balance:', ethers.formatEther(bnbBalance), 'BNB');

      if (vcBalance >= vcAmount && bnbBalance >= bnbAmount) {
        console.log('✅ Достаточно токенов для earnVG');
        
        // Проверяем allowance VC
        const vcAllowance = await VCToken.allowance(deployer.address, CONTRACTS.LP_LOCKER);
        console.log('VC allowance:', ethers.formatEther(vcAllowance), 'VC');
        
        if (vcAllowance >= vcAmount) {
          console.log('✅ VC allowance достаточен');
        } else {
          console.log('❌ Нужно approve VC токены');
        }
      } else {
        console.log('❌ Недостаточно токенов для earnVG');
      }

    } catch (error) {
      console.log('Ошибка симуляции:', error.message);
    }

  } catch (error) {
    console.error('❌ Ошибка проверки:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 