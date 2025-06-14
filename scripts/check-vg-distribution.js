const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Анализ распределения VG токенов...\n');

  const [deployer] = await ethers.getSigners();
  
  // Адреса контрактов
  const contracts = {
    VG_TOKEN: "0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d",
    VG_TOKEN_VOTES: "0xA2aFF77bBaD0Fc5039698D9dc695bDE32A25CBeA", 
    LP_LOCKER: "0x9269baba99cE0388Daf814E351b4d556fA728D32",
  };

  const vgToken = await ethers.getContractAt("VGToken", contracts.VG_TOKEN);
  
  console.log('📊 Полное распределение VG токенов:');
  console.log('='.repeat(50));
  
  // Проверяем основные адреса
  const addresses = [
    { name: 'Deployer (ты)', address: deployer.address },
    { name: 'LP Locker Contract', address: contracts.LP_LOCKER },
    { name: 'VG Votes Contract', address: contracts.VG_TOKEN_VOTES },
    { name: 'Zero Address (burned)', address: '0x0000000000000000000000000000000000000000' }
  ];
  
  let totalChecked = 0n;
  
  for (const addr of addresses) {
    try {
      const balance = await vgToken.balanceOf(addr.address);
      const formatted = ethers.formatEther(balance);
      console.log(`${addr.name}: ${formatted} VG`);
      totalChecked += balance;
    } catch (error) {
      console.log(`${addr.name}: Ошибка - ${error.message}`);
    }
  }
  
  console.log('\n📈 Общая информация:');
  console.log('='.repeat(30));
  
  try {
    const totalSupply = await vgToken.totalSupply();
    const owner = await vgToken.owner();
    
    console.log(`Total Supply: ${ethers.formatEther(totalSupply)} VG`);
    console.log(`Owner: ${owner}`);
    console.log(`Проверено: ${ethers.formatEther(totalChecked)} VG`);
    console.log(`Не найдено: ${ethers.formatEther(totalSupply - totalChecked)} VG`);
    
    // Проверяем может ли owner минтить токены
    console.log('\n🔍 Проверка прав owner:');
    if (owner === deployer.address) {
      console.log('✅ Ты являешься owner VG контракта');
      console.log('💡 Можешь заминтить дополнительные VG токены для vault');
    } else {
      console.log(`❌ Owner: ${owner}, но ты: ${deployer.address}`);
    }
    
  } catch (error) {
    console.log(`Ошибка получения totalSupply: ${error.message}`);
  }
  
  console.log('\n🎯 Рекомендации:');
  console.log('='.repeat(20));
  console.log('1. VG Vault имеет только 20 VG - этого недостаточно для earnVG');
  console.log('2. Нужно заминтить больше VG токенов для vault');
  console.log('3. Или перевести VG из VGVotes контракта в LP Locker');
  console.log('4. Рекомендуемый баланс vault: 10,000,000+ VG для наград');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }); 