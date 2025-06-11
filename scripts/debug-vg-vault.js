const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');

async function main() {
  console.log('🔍 Диагностика VG Vault...\n');

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

  console.log('📋 Контракты:');
  console.log('VG Token:', CONTRACTS.VG_TOKEN);
  console.log('LP Locker:', CONTRACTS.LP_LOCKER);
  console.log();

  try {
    // 1. Получаем конфигурацию LPLocker
    console.log('⚙️ Конфигурация LPLocker:');
    const config = await LPLocker.config();
    console.log('stakingVaultAddress:', config.stakingVaultAddress);
    console.log('vgTokenAddress:', config.vgTokenAddress);
    console.log('LP to VG ratio:', config.lpToVgRatio.toString());
    console.log();

    // 2. Проверяем балансы VG токенов
    console.log('💰 Баланс VG токенов:');
    const deployerVGBalance = await VGToken.balanceOf(deployer.address);
    const lpLockerVGBalance = await VGToken.balanceOf(CONTRACTS.LP_LOCKER);
    const vaultVGBalance = await VGToken.balanceOf(config.stakingVaultAddress);
    const totalSupply = await VGToken.totalSupply();
    
    console.log('Deployer VG balance:', ethers.formatEther(deployerVGBalance), 'VG');
    console.log('LPLocker VG balance:', ethers.formatEther(lpLockerVGBalance), 'VG');
    console.log('Vault VG balance:', ethers.formatEther(vaultVGBalance), 'VG');
    console.log('Total VG supply:', ethers.formatEther(totalSupply), 'VG');
    console.log();

    // 3. Проверяем что vault это за адрес
    console.log('🏦 Информация о Vault:');
    console.log('Vault address:', config.stakingVaultAddress);
    console.log('Vault == Deployer:', config.stakingVaultAddress.toLowerCase() === deployer.address.toLowerCase());
    console.log('Vault == LPLocker:', config.stakingVaultAddress.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase());
    
    // Проверяем код по адресу vault
    const vaultCode = await deployer.provider.getCode(config.stakingVaultAddress);
    console.log('Vault is contract:', vaultCode !== '0x');
    console.log();

    // 4. Проверяем allowance для transferFrom
    console.log('🔐 Allowance для transferFrom:');
    const vaultAllowance = await VGToken.allowance(config.stakingVaultAddress, CONTRACTS.LP_LOCKER);
    console.log('Vault allowance to LPLocker:', ethers.formatEther(vaultAllowance), 'VG');
    console.log();

    // 5. Если VG токены у deployer, а vault пустой - нужно перевести
    if (parseFloat(ethers.formatEther(vaultVGBalance)) === 0 && parseFloat(ethers.formatEther(deployerVGBalance)) > 0) {
      console.log('⚠️  ПРОБЛЕМА: VG токены у deployer, а vault пустой!');
      console.log('💡 РЕШЕНИЕ: Нужно перевести VG токены в vault');
      
      // Предлагаем количество для перевода (например, 50M VG для наград)
      const transferAmount = ethers.parseEther('50000000'); // 50M VG
      console.log('Рекомендуемый перевод:', ethers.formatEther(transferAmount), 'VG в vault');
    }

    // 6. Тестируем earnVG логику
    console.log('🧪 Тест earnVG логики:');
    const testLpAmount = ethers.parseEther('1'); // 1 LP
    const testVgReward = testLpAmount * BigInt(config.lpToVgRatio);
    console.log('За 1 LP токен награда:', ethers.formatEther(testVgReward), 'VG');
    console.log('Vault может выдать награду:', parseFloat(ethers.formatEther(vaultVGBalance)) >= parseFloat(ethers.formatEther(testVgReward)));

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