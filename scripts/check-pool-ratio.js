const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔍 Проверка соотношения VC/BNB в пуле...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Получаем адреса контрактов
  const CONTRACTS = {
    LP_LOCKER: deployedContracts.LP_LOCKER_PROXY,
    VC_TOKEN: deployedContracts.VC_TOKEN,
  };

  // Получаем контракты
  const LPLocker = await ethers.getContractAt('LPLocker', CONTRACTS.LP_LOCKER);
  const VCToken = await ethers.getContractAt('VCToken', CONTRACTS.VC_TOKEN);

  try {
    // 1. Получаем конфигурацию
    const config = await LPLocker.config();
    console.log('📋 Конфигурация:');
    console.log('LP Token Address:', config.lpTokenAddress);
    console.log('VC Token Address:', config.vcTokenAddress);
    console.log();

    // 2. Проверяем LP токен как пару
    const lpToken = await ethers.getContractAt([
      "function token0() external view returns (address)",
      "function token1() external view returns (address)", 
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function totalSupply() external view returns (uint256)"
    ], config.lpTokenAddress);

    console.log('🏊 Анализ LP пула:');
    const token0 = await lpToken.token0();
    const token1 = await lpToken.token1();
    const reserves = await lpToken.getReserves();
    const totalSupply = await lpToken.totalSupply();

    console.log('Token0:', token0);
    console.log('Token1:', token1);
    console.log('Reserve0:', ethers.formatEther(reserves.reserve0));
    console.log('Reserve1:', ethers.formatEther(reserves.reserve1));
    console.log('Total Supply:', ethers.formatEther(totalSupply), 'LP');
    console.log();

    // 3. Определяем какой токен VC, какой WBNB
    let vcReserve, bnbReserve;
    if (token0.toLowerCase() === config.vcTokenAddress.toLowerCase()) {
      vcReserve = reserves.reserve0;
      bnbReserve = reserves.reserve1;
      console.log('VC = Token0, WBNB = Token1');
    } else {
      vcReserve = reserves.reserve1;
      bnbReserve = reserves.reserve0;
      console.log('VC = Token1, WBNB = Token0');
    }

    console.log();
    console.log('💰 Резервы пула:');
    console.log('VC Reserve:', ethers.formatEther(vcReserve), 'VC');
    console.log('BNB Reserve:', ethers.formatEther(bnbReserve), 'BNB');
    console.log();

    // 4. Рассчитываем текущее соотношение
    if (vcReserve > 0 && bnbReserve > 0) {
      const vcPerBnb = Number(ethers.formatEther(vcReserve)) / Number(ethers.formatEther(bnbReserve));
      const bnbPerVc = Number(ethers.formatEther(bnbReserve)) / Number(ethers.formatEther(vcReserve));
      
      console.log('📊 Текущее соотношение:');
      console.log('1 BNB =', vcPerBnb.toFixed(6), 'VC');
      console.log('1 VC =', bnbPerVc.toFixed(6), 'BNB');
      console.log();

      // 5. Рассчитываем правильные параметры для earnVG
      console.log('🎯 Правильные параметры для earnVG:');
      
      // Если хотим добавить 1 VC, сколько нужно BNB?
      const vcAmount = 1;
      const requiredBnb = vcAmount * bnbPerVc;
      
      console.log('Для добавления', vcAmount, 'VC нужно:', requiredBnb.toFixed(6), 'BNB');
      
      // Или если хотим добавить 0.01 BNB, сколько нужно VC?
      const bnbAmount = 0.01;
      const requiredVc = bnbAmount * vcPerBnb;
      
      console.log('Для добавления', bnbAmount, 'BNB нужно:', requiredVc.toFixed(6), 'VC');
      console.log();

      // 6. Предлагаем варианты
      console.log('💡 Варианты для earnVG:');
      console.log('Вариант 1:');
      console.log('  VC Amount:', vcAmount, 'VC');
      console.log('  BNB Amount:', requiredBnb.toFixed(6), 'BNB');
      console.log();
      console.log('Вариант 2:');
      console.log('  VC Amount:', requiredVc.toFixed(6), 'VC');
      console.log('  BNB Amount:', bnbAmount, 'BNB');
      console.log();

      // 7. Проверяем минимальные требования
      console.log('⚠️  Проверка минимальных требований:');
      const minVc = Number(ethers.formatEther(config.minVcAmount));
      const minBnb = Number(ethers.formatEther(config.minBnbAmount));
      
      console.log('Минимум VC:', minVc, 'VC');
      console.log('Минимум BNB:', minBnb, 'BNB');
      
      // Проверяем вариант 1
      const variant1OK = vcAmount >= minVc && requiredBnb >= minBnb;
      console.log('Вариант 1 подходит:', variant1OK);
      
      // Проверяем вариант 2
      const variant2OK = requiredVc >= minVc && bnbAmount >= minBnb;
      console.log('Вариант 2 подходит:', variant2OK);
      
      if (!variant1OK && !variant2OK) {
        console.log('❌ Оба варианта не подходят под минимальные требования!');
        
        // Рассчитываем минимальный вариант
        const minRequiredBnb = Math.max(minBnb, minVc * bnbPerVc);
        const minRequiredVc = Math.max(minVc, minBnb * vcPerBnb);
        
        console.log();
        console.log('🔧 Минимальный рабочий вариант:');
        console.log('  VC Amount:', minRequiredVc.toFixed(6), 'VC');
        console.log('  BNB Amount:', minRequiredBnb.toFixed(6), 'BNB');
      }

    } else {
      console.log('❌ Пул пустой или один из резервов равен 0');
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