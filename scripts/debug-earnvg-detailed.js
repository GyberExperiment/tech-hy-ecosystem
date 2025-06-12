const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔍 Детальная диагностика earnVG...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  // Получаем адреса контрактов
  const CONTRACTS = {
    VG_TOKEN: deployedContracts.VG_TOKEN,
    LP_LOCKER: deployedContracts.LP_LOCKER_PROXY,
    VC_TOKEN: deployedContracts.VC_TOKEN,
  };

  // Получаем контракты
  const VGToken = await ethers.getContractAt('VGToken', CONTRACTS.VG_TOKEN);
  const LPLocker = await ethers.getContractAt('LPLocker', CONTRACTS.LP_LOCKER);
  const VCToken = await ethers.getContractAt('VCToken', CONTRACTS.VC_TOKEN);

  console.log('📋 Контракты:');
  console.log('VG Token:', CONTRACTS.VG_TOKEN);
  console.log('LP Locker:', CONTRACTS.LP_LOCKER);
  console.log('VC Token:', CONTRACTS.VC_TOKEN);
  console.log();

  try {
    // 1. Проверяем конфигурацию
    console.log('⚙️ Конфигурация LPLocker:');
    const config = await LPLocker.config();
    console.log('stakingVaultAddress:', config.stakingVaultAddress);
    console.log('vgTokenAddress:', config.vgTokenAddress);
    console.log('vcTokenAddress:', config.vcTokenAddress);
    console.log('minVcAmount:', ethers.formatEther(config.minVcAmount), 'VC');
    console.log('minBnbAmount:', ethers.formatEther(config.minBnbAmount), 'BNB');
    console.log('maxSlippageBps:', config.maxSlippageBps.toString(), 'BPS');
    console.log('mevProtectionEnabled:', config.mevProtectionEnabled);
    console.log();

    // 2. Проверяем балансы
    console.log('💰 Балансы:');
    const vgBalance = await VGToken.balanceOf(deployer.address);
    const vcBalance = await VCToken.balanceOf(deployer.address);
    const bnbBalance = await deployer.provider.getBalance(deployer.address);
    const vaultVGBalance = await VGToken.balanceOf(config.stakingVaultAddress);
    
    console.log('User VG balance:', ethers.formatEther(vgBalance), 'VG');
    console.log('User VC balance:', ethers.formatEther(vcBalance), 'VC');
    console.log('User BNB balance:', ethers.formatEther(bnbBalance), 'BNB');
    console.log('Vault VG balance:', ethers.formatEther(vaultVGBalance), 'VG');
    console.log();

    // 3. Параметры для тестирования
    const vcAmount = ethers.parseEther('1'); // 1 VC
    const bnbAmount = ethers.parseEther('0.001'); // 0.001 BNB
    const slippageBps = 1000; // 10%

    console.log('🎯 Параметры для earnVG:');
    console.log('VC Amount:', ethers.formatEther(vcAmount), 'VC');
    console.log('BNB Amount:', ethers.formatEther(bnbAmount), 'BNB');
    console.log('Slippage BPS:', slippageBps);
    console.log();

    // 4. Проверяем все условия earnVG
    console.log('✅ Проверка условий earnVG:');
    
    // Проверка 1: VC amount >= minVcAmount
    const vcAmountOK = vcAmount >= config.minVcAmount;
    console.log('VC amount >= minVcAmount:', vcAmountOK, 
      `(${ethers.formatEther(vcAmount)} >= ${ethers.formatEther(config.minVcAmount)})`);
    
    // Проверка 2: BNB amount >= minBnbAmount
    const bnbAmountOK = bnbAmount >= config.minBnbAmount;
    console.log('BNB amount >= minBnbAmount:', bnbAmountOK,
      `(${ethers.formatEther(bnbAmount)} >= ${ethers.formatEther(config.minBnbAmount)})`);
    
    // Проверка 3: slippage <= maxSlippage
    const slippageOK = slippageBps <= config.maxSlippageBps;
    console.log('Slippage <= maxSlippage:', slippageOK,
      `(${slippageBps} <= ${config.maxSlippageBps})`);
    
    // Проверка 4: VC allowance
    const vcAllowance = await VCToken.allowance(deployer.address, CONTRACTS.LP_LOCKER);
    const allowanceOK = vcAllowance >= vcAmount;
    console.log('VC allowance sufficient:', allowanceOK,
      `(${ethers.formatEther(vcAllowance)} >= ${ethers.formatEther(vcAmount)})`);
    
    // Проверка 5: User VC balance
    const vcBalanceOK = vcBalance >= vcAmount;
    console.log('User VC balance sufficient:', vcBalanceOK,
      `(${ethers.formatEther(vcBalance)} >= ${ethers.formatEther(vcAmount)})`);
    
    // Проверка 6: User BNB balance
    const bnbBalanceOK = bnbBalance >= bnbAmount;
    console.log('User BNB balance sufficient:', bnbBalanceOK,
      `(${ethers.formatEther(bnbBalance)} >= ${ethers.formatEther(bnbAmount)})`);
    
    // Проверка 7: Vault VG balance
    const expectedLp = (vcAmount * bnbAmount) / config.lpDivisor;
    const expectedVgReward = expectedLp * BigInt(config.lpToVgRatio);
    const vaultBalanceOK = vaultVGBalance >= expectedVgReward;
    console.log('Vault VG balance sufficient:', vaultBalanceOK,
      `(${ethers.formatEther(vaultVGBalance)} >= ${ethers.formatEther(expectedVgReward)})`);
    
    console.log();
    console.log('📊 Расчеты:');
    console.log('Expected LP:', ethers.formatEther(expectedLp), 'LP');
    console.log('Expected VG reward:', ethers.formatEther(expectedVgReward), 'VG');
    console.log('LP Divisor:', config.lpDivisor.toString());
    console.log('LP to VG Ratio:', config.lpToVgRatio.toString());
    console.log();

    // 8. Проверяем vault архитектуру
    console.log('🏦 Vault архитектура:');
    console.log('Vault address:', config.stakingVaultAddress);
    console.log('LPLocker address:', CONTRACTS.LP_LOCKER);
    console.log('Vault == LPLocker:', config.stakingVaultAddress.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase());
    console.log('Should use transfer:', config.stakingVaultAddress.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase());
    console.log();

    // 9. Если все условия выполнены, пробуем симуляцию
    if (vcAmountOK && bnbAmountOK && slippageOK && allowanceOK && vcBalanceOK && bnbBalanceOK && vaultBalanceOK) {
      console.log('✅ Все условия выполнены! Пробуем симуляцию...');
      
      try {
        // Симуляция без отправки транзакции
        const result = await LPLocker.earnVG.staticCall(vcAmount, bnbAmount, slippageBps, {
          value: bnbAmount,
          from: deployer.address
        });
        console.log('✅ Симуляция прошла успешно!');
      } catch (simError) {
        console.log('❌ Симуляция failed:', simError.message);
        
        // Пробуем понять причину
        if (simError.message.includes('revert')) {
          console.log('🔍 Возможные причины revert:');
          console.log('1. MEV protection активна');
          console.log('2. PancakeSwap router проблемы');
          console.log('3. Slippage protection сработала');
          console.log('4. Недостаточная ликвидность в пуле');
        }
      }
    } else {
      console.log('❌ Не все условия выполнены!');
    }

  } catch (error) {
    console.error('❌ Ошибка диагностики:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 