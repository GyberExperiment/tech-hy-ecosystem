const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔍 Проверка состояния LP пула VC/WBNB...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Получаем адреса контрактов
  const CONTRACTS = {
    VG_TOKEN: deployedContracts.VG_TOKEN,
    LP_LOCKER: deployedContracts.LP_LOCKER_PROXY,
    VC_TOKEN: deployedContracts.VC_TOKEN,
  };

  // Получаем контракты
  const LPLocker = await ethers.getContractAt('LPLocker', CONTRACTS.LP_LOCKER);
  const VCToken = await ethers.getContractAt('VCToken', CONTRACTS.VC_TOKEN);

  console.log('📋 Контракты:');
  console.log('LP Locker:', CONTRACTS.LP_LOCKER);
  console.log('VC Token:', CONTRACTS.VC_TOKEN);
  console.log();

  try {
    // 1. Получаем конфигурацию
    const config = await LPLocker.config();
    console.log('⚙️ Конфигурация LPLocker:');
    console.log('pancakeRouter:', config.pancakeRouter);
    console.log('lpTokenAddress:', config.lpTokenAddress);
    console.log('vcTokenAddress:', config.vcTokenAddress);
    console.log();

    // 2. Проверяем PancakeSwap Router
    console.log('🥞 PancakeSwap Router:');
    const router = await ethers.getContractAt('IPancakeRouter02', config.pancakeRouter);
    
    try {
      const factory = await router.factory();
      console.log('Factory address:', factory);
      
      const WETH = await router.WETH();
      console.log('WETH address:', WETH);
      console.log();
    } catch (error) {
      console.log('❌ Ошибка получения данных router:', error.message);
    }

    // 3. Проверяем LP токен
    console.log('🪙 LP Token:');
    const lpToken = await ethers.getContractAt('IERC20', config.lpTokenAddress);
    
    try {
      const lpTotalSupply = await lpToken.totalSupply();
      const lpLockerBalance = await lpToken.balanceOf(CONTRACTS.LP_LOCKER);
      
      console.log('LP Total Supply:', ethers.formatEther(lpTotalSupply), 'LP');
      console.log('LPLocker LP balance:', ethers.formatEther(lpLockerBalance), 'LP');
      console.log();
    } catch (error) {
      console.log('❌ Ошибка получения данных LP token:', error.message);
    }

    // 4. Проверяем пул VC/WBNB
    console.log('🏊 Проверка пула VC/WBNB:');
    try {
      const factory = await ethers.getContractAt('IPancakeFactory', await router.factory());
      const WETH = await router.WETH();
      
      const pairAddress = await factory.getPair(config.vcTokenAddress, WETH);
      console.log('Pair address:', pairAddress);
      
      if (pairAddress === ethers.ZeroAddress) {
        console.log('❌ ПРОБЛЕМА: Пул VC/WBNB не существует!');
        console.log('Нужно создать пул или использовать другой router');
        return;
      }
      
      // Проверяем ликвидность в пуле
      const pair = await ethers.getContractAt('IERC20', pairAddress);
      const pairTotalSupply = await pair.totalSupply();
      
      console.log('✅ Пул существует');
      console.log('Pair total supply:', ethers.formatEther(pairTotalSupply), 'LP');
      
      // Проверяем резервы
      const vcBalanceInPair = await VCToken.balanceOf(pairAddress);
      const wethBalanceInPair = await ethers.provider.getBalance(pairAddress);
      
      console.log('VC в пуле:', ethers.formatEther(vcBalanceInPair), 'VC');
      console.log('WBNB в пуле:', ethers.formatEther(wethBalanceInPair), 'WBNB');
      
      if (vcBalanceInPair === 0n || wethBalanceInPair === 0n) {
        console.log('❌ ПРОБЛЕМА: Пул пустой! Нет ликвидности');
      } else {
        console.log('✅ В пуле есть ликвидность');
      }
      
    } catch (error) {
      console.log('❌ Ошибка проверки пула:', error.message);
    }
    console.log();

    // 5. Тестируем addLiquidityETH симуляцию
    console.log('🧪 Тест симуляции addLiquidityETH:');
    const vcAmount = ethers.parseEther('1');
    const bnbAmount = ethers.parseEther('0.01');
    
    try {
      // Проверяем allowance
      const allowance = await VCToken.allowance(deployer.address, config.pancakeRouter);
      console.log('VC allowance to router:', ethers.formatEther(allowance), 'VC');
      
      if (allowance < vcAmount) {
        console.log('📝 Нужно approve VC для router');
      }
      
      // Пробуем симуляцию
      const minVcAmount = (vcAmount * 9000n) / 10000n; // 10% slippage
      const minBnbAmount = (bnbAmount * 9000n) / 10000n;
      
      console.log('Параметры симуляции:');
      console.log('  VC Amount:', ethers.formatEther(vcAmount), 'VC');
      console.log('  BNB Amount:', ethers.formatEther(bnbAmount), 'BNB');
      console.log('  Min VC:', ethers.formatEther(minVcAmount), 'VC');
      console.log('  Min BNB:', ethers.formatEther(minBnbAmount), 'BNB');
      
      // Симуляция addLiquidityETH
      const result = await router.addLiquidityETH.staticCall(
        config.vcTokenAddress,
        vcAmount,
        minVcAmount,
        minBnbAmount,
        deployer.address,
        Math.floor(Date.now() / 1000) + 300,
        { value: bnbAmount }
      );
      
      console.log('✅ Симуляция addLiquidityETH успешна!');
      console.log('Expected liquidity:', ethers.formatEther(result[2]), 'LP');
      
    } catch (simError) {
      console.log('❌ Симуляция addLiquidityETH failed:', simError.message);
      
      if (simError.message.includes('INSUFFICIENT_A_AMOUNT')) {
        console.log('🔍 Проблема: Недостаточно VC токенов');
      } else if (simError.message.includes('INSUFFICIENT_B_AMOUNT')) {
        console.log('🔍 Проблема: Недостаточно BNB');
      } else if (simError.message.includes('INSUFFICIENT_LIQUIDITY')) {
        console.log('🔍 Проблема: Недостаточная ликвидность в пуле');
      } else if (simError.message.includes('EXPIRED')) {
        console.log('🔍 Проблема: Deadline истек');
      }
    }

  } catch (error) {
    console.error('❌ Ошибка проверки:', error.message);
  }
}

// Интерфейс для PancakeFactory
const IPancakeFactory = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 