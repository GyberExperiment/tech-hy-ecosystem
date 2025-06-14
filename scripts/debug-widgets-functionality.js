const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Диагностика работоспособности виджетов...\n');

  // Подключение к сети
  const [deployer] = await ethers.getSigners();
  const userAccount = "0xe70eC2DeA28CD14B2d392E72F2fE68F8d8799D5E"; // Тестовый аккаунт
  
  console.log('📋 Информация о подключении:');
  console.log(`Deployer: ${deployer.address}`);
  console.log(`User Account: ${userAccount}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}\n`);

  // Адреса контрактов
  const contracts = {
    VC_TOKEN: "0xC88eC091302Eb90e78a4CA361D083330752dfc9A",
    VG_TOKEN: "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d", 
    VG_TOKEN_VOTES: "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA",
    LP_LOCKER: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  };

  // Подключение к контрактам
  const vcToken = await ethers.getContractAt("VCToken", contracts.VC_TOKEN);
  const vgToken = await ethers.getContractAt("VGToken", contracts.VG_TOKEN);
  const vgVotes = await ethers.getContractAt("VGTokenVotes", contracts.VG_TOKEN_VOTES);
  const lpLocker = await ethers.getContractAt("LPLocker", contracts.LP_LOCKER);

  console.log('💰 Проверка балансов пользователя:');
  try {
    const bnbBalance = await ethers.provider.getBalance(userAccount);
    const vcBalance = await vcToken.balanceOf(userAccount);
    const vgBalance = await vgToken.balanceOf(userAccount);
    const vgVotesBalance = await vgVotes.balanceOf(userAccount);
    
    console.log(`BNB: ${ethers.formatEther(bnbBalance)} BNB`);
    console.log(`VC: ${ethers.formatEther(vcBalance)} VC`);
    console.log(`VG: ${ethers.formatEther(vgBalance)} VG`);
    console.log(`VGVotes: ${ethers.formatEther(vgVotesBalance)} VGVotes`);
  } catch (error) {
    console.log(`❌ Ошибка получения балансов: ${error.message}`);
  }
  console.log();

  console.log('⚙️ Проверка конфигурации LPLocker:');
  try {
    const config = await lpLocker.config();
    console.log(`Authority: ${config[0]}`);
    console.log(`VG Token: ${config[1]}`);
    console.log(`VC Token: ${config[2]}`);
    console.log(`Pancake Router: ${config[3]}`);
    console.log(`LP Token: ${config[4]}`);
    console.log(`Staking Vault: ${config[5]}`);
    console.log(`LP Divisor: ${config[6].toString()}`);
    console.log(`LP to VG Ratio: ${config[7].toString()}`);
    console.log(`Min BNB Amount: ${ethers.formatEther(config[8])} BNB`);
    console.log(`Min VC Amount: ${ethers.formatEther(config[9])} VC`);
    console.log(`Max Slippage BPS: ${config[10].toString()} (${(Number(config[10]) / 100).toFixed(1)}%)`);
    console.log(`Default Slippage BPS: ${config[11].toString()} (${(Number(config[11]) / 100).toFixed(1)}%)`);
    console.log(`MEV Protection Enabled: ${config[12]}`);
    console.log(`Min Time Between Txs: ${config[13].toString()} seconds`);
    console.log(`Max Tx Per User Per Block: ${config[14].toString()}`);
    console.log(`Total Locked LP: ${ethers.formatEther(config[15])} LP`);
    console.log(`Total VG Issued: ${ethers.formatEther(config[16])} VG`);
    console.log(`Total VG Deposited: ${ethers.formatEther(config[17])} VG`);
  } catch (error) {
    console.log(`❌ Ошибка получения конфигурации: ${error.message}`);
  }
  console.log();

  console.log('🏦 Проверка VG Vault (для earnVG):');
  try {
    // Staking Vault это сам LP Locker контракт
    const vaultVGBalance = await vgToken.balanceOf(contracts.LP_LOCKER);
    const vaultAllowance = await vgToken.allowance(contracts.LP_LOCKER, contracts.LP_LOCKER);
    
    console.log(`Vault VG Balance: ${ethers.formatEther(vaultVGBalance)} VG`);
    console.log(`Vault Allowance to LPLocker: ${ethers.formatEther(vaultAllowance)} VG`);
    
    if (vaultVGBalance > ethers.parseEther("1000000")) { // 1M VG минимум
      console.log('✅ VG Vault готов для earnVG операций');
    } else {
      console.log('❌ VG Vault не готов - недостаточно VG для наград');
    }
  } catch (error) {
    console.log(`❌ Ошибка проверки VG Vault: ${error.message}`);
  }
  console.log();

  console.log('🔒 Проверка allowances пользователя:');
  try {
    const vcAllowanceToLPLocker = await vcToken.allowance(userAccount, contracts.LP_LOCKER);
    const vgAllowanceToVGVotes = await vgToken.allowance(userAccount, contracts.VG_TOKEN_VOTES);
    
    console.log(`VC allowance to LPLocker: ${ethers.formatEther(vcAllowanceToLPLocker)} VC`);
    console.log(`VG allowance to VGVotes: ${ethers.formatEther(vgAllowanceToVGVotes)} VG`);
  } catch (error) {
    console.log(`❌ Ошибка получения allowances: ${error.message}`);
  }
  console.log();

  console.log('⏰ Проверка MEV Protection для пользователя:');
  try {
    const lastTxTimestamp = await lpLocker.lastUserTxTimestamp(userAccount);
    const lastTxBlock = await lpLocker.lastUserTxBlock(userAccount);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const currentBlock = await ethers.provider.getBlockNumber();
    
    console.log(`Last Tx Timestamp: ${lastTxTimestamp.toString()} (${new Date(Number(lastTxTimestamp) * 1000).toLocaleString()})`);
    console.log(`Last Tx Block: ${lastTxBlock.toString()}`);
    console.log(`Current Timestamp: ${currentTimestamp}`);
    console.log(`Current Block: ${currentBlock}`);
    
    const timeSinceLastTx = currentTimestamp - Number(lastTxTimestamp);
    console.log(`Time since last tx: ${timeSinceLastTx} seconds`);
    
    const config = await lpLocker.config();
    const mevEnabled = config[12];
    const minTimeBetween = Number(config[13]);
    
    if (mevEnabled && timeSinceLastTx < minTimeBetween) {
      console.log(`❌ MEV Protection активна - нужно подождать ${minTimeBetween - timeSinceLastTx} секунд`);
    } else {
      console.log('✅ MEV Protection не блокирует транзакции');
    }
  } catch (error) {
    console.log(`❌ Ошибка проверки MEV Protection: ${error.message}`);
  }
  console.log();

  console.log('🧪 Симуляция earnVG (1000 VC + 0.1 BNB):');
  try {
    const vcAmount = ethers.parseEther("1000");
    const bnbAmount = ethers.parseEther("0.1");
    const slippage = 1000; // 10%
    
    // Проверяем что у пользователя достаточно средств
    const userVCBalance = await vcToken.balanceOf(userAccount);
    const userBNBBalance = await ethers.provider.getBalance(userAccount);
    
    console.log(`Требуется VC: ${ethers.formatEther(vcAmount)} VC`);
    console.log(`Доступно VC: ${ethers.formatEther(userVCBalance)} VC`);
    console.log(`Требуется BNB: ${ethers.formatEther(bnbAmount)} BNB`);
    console.log(`Доступно BNB: ${ethers.formatEther(userBNBBalance)} BNB`);
    
    if (userVCBalance >= vcAmount && userBNBBalance >= bnbAmount) {
      console.log('✅ У пользователя достаточно средств для earnVG');
      
      // Проверяем allowance
      const vcAllowance = await vcToken.allowance(userAccount, contracts.LP_LOCKER);
      if (vcAllowance >= vcAmount) {
        console.log('✅ VC allowance достаточен');
      } else {
        console.log(`❌ Нужен approve VC: ${ethers.formatEther(vcAmount - vcAllowance)} VC`);
      }
    } else {
      console.log('❌ Недостаточно средств для earnVG');
    }
  } catch (error) {
    console.log(`❌ Ошибка симуляции earnVG: ${error.message}`);
  }
  console.log();

  console.log('🔄 Симуляция VG → VGVotes (10 VG):');
  try {
    const vgAmount = ethers.parseEther("10");
    
    const userVGBalance = await vgToken.balanceOf(userAccount);
    console.log(`Требуется VG: ${ethers.formatEther(vgAmount)} VG`);
    console.log(`Доступно VG: ${ethers.formatEther(userVGBalance)} VG`);
    
    if (userVGBalance >= vgAmount) {
      console.log('✅ У пользователя достаточно VG для конвертации');
      
      // Проверяем allowance
      const vgAllowance = await vgToken.allowance(userAccount, contracts.VG_TOKEN_VOTES);
      if (vgAllowance >= vgAmount) {
        console.log('✅ VG allowance достаточен');
      } else {
        console.log(`❌ Нужен approve VG: ${ethers.formatEther(vgAmount - vgAllowance)} VG`);
      }
    } else {
      console.log('❌ Недостаточно VG для конвертации');
    }
  } catch (error) {
    console.log(`❌ Ошибка симуляции VG → VGVotes: ${error.message}`);
  }
  console.log();

  console.log('📊 Итоговая диагностика:');
  console.log('='.repeat(50));
  
  // Проверяем готовность для earnVG
  try {
    const config = await lpLocker.config();
    const vaultBalance = await vgToken.balanceOf(contracts.LP_LOCKER);
    const vaultAllowance = await vgToken.allowance(contracts.LP_LOCKER, contracts.LP_LOCKER);
    const userVCBalance = await vcToken.balanceOf(userAccount);
    const userBNBBalance = await ethers.provider.getBalance(userAccount);
    const mevEnabled = config[12];
    
    console.log('\n🎯 EarnVG Widget:');
    if (vaultBalance > ethers.parseEther("1000000")) { // 1M VG минимум
      console.log('✅ VG Vault готов');
    } else {
      console.log('❌ VG Vault не готов');
    }
    
    if (userVCBalance > 0 && userBNBBalance > ethers.parseEther("0.01")) {
      console.log('✅ У пользователя есть средства');
    } else {
      console.log('❌ У пользователя недостаточно средств');
    }
    
    if (!mevEnabled) {
      console.log('✅ MEV Protection отключена');
    } else {
      console.log('⚠️ MEV Protection включена');
    }
    
    console.log(`Max Slippage: ${(Number(config[10]) / 100).toFixed(1)}%`);
  } catch (error) {
    console.log(`❌ Ошибка диагностики earnVG: ${error.message}`);
  }
  
  // Проверяем готовность для VGConverter
  try {
    const userVGBalance = await vgToken.balanceOf(userAccount);
    const userVGVotesBalance = await vgVotes.balanceOf(userAccount);
    
    console.log('\n🔄 VGConverter Widget:');
    if (userVGBalance > 0) {
      console.log('✅ У пользователя есть VG для конвертации');
    } else {
      console.log('❌ У пользователя нет VG');
    }
    
    if (userVGVotesBalance > 0) {
      console.log('✅ У пользователя есть VGVotes для обратной конвертации');
    } else {
      console.log('❌ У пользователя нет VGVotes');
    }
    
    console.log('✅ VGConverter готов к работе');
  } catch (error) {
    console.log(`❌ Ошибка диагностики VGConverter: ${error.message}`);
  }
  
  console.log('\n🎉 Диагностика завершена!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Ошибка диагностики:', error);
    process.exit(1);
  }); 