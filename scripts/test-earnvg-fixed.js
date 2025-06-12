const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🧪 Тестирование earnVG с исправленными параметрами...\n');

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
    // 1. Получаем минимальные требования
    const config = await LPLocker.config();
    console.log('⚙️ Минимальные требования:');
    console.log('minVcAmount:', ethers.formatEther(config.minVcAmount), 'VC');
    console.log('minBnbAmount:', ethers.formatEther(config.minBnbAmount), 'BNB');
    console.log();

    // 2. Проверяем балансы ДО транзакции
    console.log('💰 Балансы ДО earnVG:');
    const vgBalanceBefore = await VGToken.balanceOf(deployer.address);
    const vcBalanceBefore = await VCToken.balanceOf(deployer.address);
    const bnbBalanceBefore = await deployer.provider.getBalance(deployer.address);
    const vaultBalanceBefore = await VGToken.balanceOf(config.stakingVaultAddress);
    
    console.log('VG balance:', ethers.formatEther(vgBalanceBefore), 'VG');
    console.log('VC balance:', ethers.formatEther(vcBalanceBefore), 'VC');
    console.log('BNB balance:', ethers.formatEther(bnbBalanceBefore), 'BNB');
    console.log('Vault VG balance:', ethers.formatEther(vaultBalanceBefore), 'VG');
    console.log();

    // 3. ИСПРАВЛЕННЫЕ параметры для earnVG
    const vcAmount = ethers.parseEther('1'); // 1 VC (>= 1 VC минимум)
    const bnbAmount = ethers.parseEther('0.01'); // 0.01 BNB (>= 0.01 BNB минимум)
    const slippageBps = 1000; // 10%

    console.log('🎯 ИСПРАВЛЕННЫЕ параметры earnVG:');
    console.log('VC Amount:', ethers.formatEther(vcAmount), 'VC');
    console.log('BNB Amount:', ethers.formatEther(bnbAmount), 'BNB');
    console.log('Slippage:', slippageBps / 100, '%');
    console.log();

    // 4. Проверяем allowance VC
    console.log('🔐 Проверка allowance:');
    const vcAllowance = await VCToken.allowance(deployer.address, CONTRACTS.LP_LOCKER);
    console.log('Current VC allowance:', ethers.formatEther(vcAllowance), 'VC');
    
    if (vcAllowance < vcAmount) {
      console.log('📝 Approving VC tokens...');
      const approveTx = await VCToken.approve(CONTRACTS.LP_LOCKER, vcAmount);
      await approveTx.wait();
      console.log('✅ VC tokens approved');
    } else {
      console.log('✅ VC allowance sufficient');
    }
    console.log();

    // 5. Проверяем что у нас достаточно BNB
    if (bnbBalanceBefore < bnbAmount) {
      console.log('❌ Недостаточно BNB!');
      console.log('Требуется:', ethers.formatEther(bnbAmount), 'BNB');
      console.log('Доступно:', ethers.formatEther(bnbBalanceBefore), 'BNB');
      return;
    }

    // 6. Выполняем earnVG с правильными параметрами
    console.log('🚀 Выполнение earnVG с правильными параметрами...');
    const tx = await LPLocker.earnVG(vcAmount, bnbAmount, slippageBps, {
      value: bnbAmount,
      gasLimit: 500000,
    });
    
    console.log('Transaction hash:', tx.hash);
    console.log('⏳ Ожидание подтверждения...');
    
    const receipt = await tx.wait();
    console.log('✅ Транзакция подтверждена!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log();

    // 7. Проверяем балансы ПОСЛЕ транзакции
    console.log('💰 Балансы ПОСЛЕ earnVG:');
    const vgBalanceAfter = await VGToken.balanceOf(deployer.address);
    const vcBalanceAfter = await VCToken.balanceOf(deployer.address);
    const bnbBalanceAfter = await deployer.provider.getBalance(deployer.address);
    const vaultBalanceAfter = await VGToken.balanceOf(config.stakingVaultAddress);
    
    console.log('VG balance:', ethers.formatEther(vgBalanceAfter), 'VG');
    console.log('VC balance:', ethers.formatEther(vcBalanceAfter), 'VC');
    console.log('BNB balance:', ethers.formatEther(bnbBalanceAfter), 'BNB');
    console.log('Vault VG balance:', ethers.formatEther(vaultBalanceAfter), 'VG');
    console.log();

    // 8. Рассчитываем изменения
    console.log('📊 Изменения балансов:');
    const vgDiff = vgBalanceAfter - vgBalanceBefore;
    const vcDiff = vcBalanceBefore - vcBalanceAfter;
    const bnbDiff = bnbBalanceBefore - bnbBalanceAfter;
    const vaultDiff = vaultBalanceBefore - vaultBalanceAfter;
    
    console.log('VG получено:', ethers.formatEther(vgDiff), 'VG');
    console.log('VC потрачено:', ethers.formatEther(vcDiff), 'VC');
    console.log('BNB потрачено:', ethers.formatEther(bnbDiff), 'BNB (включая gas)');
    console.log('VG из vault:', ethers.formatEther(vaultDiff), 'VG');
    console.log();

    // 9. Проверяем события
    console.log('📜 События транзакции:');
    const events = receipt.logs;
    console.log(`Найдено ${events.length} событий в транзакции`);
    
    // Ищем VGTokensEarned событие
    for (const log of events) {
      try {
        const parsed = LPLocker.interface.parseLog(log);
        if (parsed && parsed.name === 'VGTokensEarned') {
          console.log('🎯 VGTokensEarned событие:');
          console.log('  User:', parsed.args.user);
          console.log('  LP Amount:', ethers.formatEther(parsed.args.lpAmount), 'LP');
          console.log('  VG Reward:', ethers.formatEther(parsed.args.vgReward), 'VG');
          console.log('  VC Amount:', ethers.formatEther(parsed.args.vcAmount), 'VC');
          console.log('  BNB Amount:', ethers.formatEther(parsed.args.bnbAmount), 'BNB');
        }
      } catch (e) {
        // Игнорируем события других контрактов
      }
    }

    if (vgDiff > 0) {
      console.log('\n🎉 SUCCESS: VG токены успешно получены!');
      console.log('🏦 Новая архитектура Contract Vault работает!');
    } else {
      console.log('\n❌ PROBLEM: VG токены не получены');
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 