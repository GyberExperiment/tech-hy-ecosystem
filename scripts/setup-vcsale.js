const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🔧 Setting up VCSaleContract with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Загружаем информацию о развернутых контрактах
  const deployedData = fs.readFileSync("deployed-ecosystem.json", "utf8");
  const deployedContracts = JSON.parse(deployedData);

  const vcTokenAddress = deployedContracts.VC_TOKEN;
  const vcsaleAddress = deployedContracts.VCSaleContract;

  console.log("📍 VC Token Address:", vcTokenAddress);
  console.log("📍 VCSale Contract Address:", vcsaleAddress);

  // Подключаемся к контрактам
  const vcToken = await ethers.getContractAt("VCToken", vcTokenAddress);
  const vcsaleContract = await ethers.getContractAt("VCSaleContract", vcsaleAddress);

  // Проверяем текущее состояние
  console.log("\n📊 Current State:");
  console.log("   - Deployer VC Balance:", ethers.formatEther(await vcToken.balanceOf(deployer.address)), "VC");
  console.log("   - Contract VC Balance:", ethers.formatEther(await vcToken.balanceOf(vcsaleAddress)), "VC");
  
  const saleConfig = await vcsaleContract.saleConfig();
  console.log("   - Sale Active:", saleConfig.saleActive);
  console.log("   - Price per VC:", ethers.formatEther(saleConfig.pricePerVC), "BNB");

  // Шаг 1: Добавляем VC токены в контракт (если нужно)
  const contractBalance = await vcToken.balanceOf(vcsaleAddress);
  const desiredBalance = ethers.parseEther("10000"); // 10K VC для тестирования

  if (contractBalance < desiredBalance) {
    console.log("\n💰 Adding VC tokens to contract...");
    const amountToAdd = desiredBalance - contractBalance;
    
    // Проверяем баланс deployer'а
    const deployerBalance = await vcToken.balanceOf(deployer.address);
    console.log("   - Amount needed:", ethers.formatEther(amountToAdd), "VC");
    console.log("   - Deployer balance:", ethers.formatEther(deployerBalance), "VC");

    if (deployerBalance < amountToAdd) {
      console.log("⚠️  Insufficient VC balance. Minting more VC...");
      const mintAmount = amountToAdd - deployerBalance + ethers.parseEther("1000"); // Extra buffer
      await vcToken.mintTo(deployer.address, mintAmount);
      console.log("✅ Minted", ethers.formatEther(mintAmount), "VC");
    }

    // Approve VC tokens
    console.log("   - Approving VC tokens...");
    const approveTx = await vcToken.approve(vcsaleAddress, amountToAdd);
    await approveTx.wait();
    console.log("   - Approval confirmed");
    
    // Проверяем что approve действительно сработал
    const allowance = await vcToken.allowance(deployer.address, vcsaleAddress);
    console.log("   - Allowance set:", ethers.formatEther(allowance), "VC");
    
    if (allowance < amountToAdd) {
      throw new Error("Approve failed - insufficient allowance");
    }
    
    // Deposit VC tokens
    console.log("   - Depositing VC tokens...");
    const depositTx = await vcsaleContract.depositVCTokens(amountToAdd);
    await depositTx.wait();
    console.log("   - Deposit confirmed");
    
    console.log("✅ Added", ethers.formatEther(amountToAdd), "VC to contract");
  } else {
    console.log("✅ Contract already has sufficient VC tokens");
  }

  // Шаг 2: Активируем продажу (если не активна)
  if (!saleConfig.saleActive) {
    console.log("\n⚡ Activating sale...");
    const activateTx = await vcsaleContract.setSaleActive(true);
    await activateTx.wait();
    console.log("✅ Sale activated!");
  } else {
    console.log("✅ Sale is already active");
  }

  // Финальная проверка состояния
  console.log("\n📈 Final State:");
  const finalContractBalance = await vcToken.balanceOf(vcsaleAddress);
  const finalSaleConfig = await vcsaleContract.saleConfig();
  const stats = await vcsaleContract.getSaleStats();

  console.log("   - Contract VC Balance:", ethers.formatEther(finalContractBalance), "VC");
  console.log("   - Sale Active:", finalSaleConfig.saleActive);
  console.log("   - Available for Sale:", ethers.formatEther(stats.currentVCBalance), "VC");
  console.log("   - Price per VC:", ethers.formatEther(stats.pricePerVC), "BNB");
  console.log("   - Min Purchase:", ethers.formatEther(finalSaleConfig.minPurchaseAmount), "VC");
  console.log("   - Max Purchase:", ethers.formatEther(finalSaleConfig.maxPurchaseAmount), "VC");

  // Тестируем функцию canPurchase
  console.log("\n🧪 Testing purchase eligibility...");
  const testAmount = ethers.parseEther("10"); // 10 VC
  const [canPurchase, reason] = await vcsaleContract.canPurchase(deployer.address, testAmount);
  console.log("   - Can purchase 10 VC:", canPurchase);
  if (!canPurchase) {
    console.log("   - Reason:", reason);
  }

  // Показываем сколько BNB нужно для тестовой покупки
  if (canPurchase) {
    const requiredBNB = await vcsaleContract.calculateBNBAmount(testAmount);
    console.log("   - Required BNB for 10 VC:", ethers.formatEther(requiredBNB), "BNB");
  }

  console.log("\n🎯 VCSaleContract setup completed!");
  console.log("🌐 Contract URL:", `https://testnet.bscscan.com/address/${vcsaleAddress}`);
  console.log("\n📋 Ready for frontend testing:");
  console.log("1. 🌐 Start frontend: npm run dev");
  console.log("2. 🔗 Connect wallet to BSC Testnet");
  console.log("3. 💰 Ensure wallet has BNB for gas + purchase");
  console.log("4. 🧪 Test VCSale widget functionality");
  
  console.log("\n⚠️  Security Features Active:");
  console.log("🔐 MEV Protection: 60 second cooldown between purchases");
  console.log("⚡ Circuit Breaker: Auto-stop if >100K VC sold per hour");
  console.log("📊 Daily Limits: Max 1M VC sales per day");
  console.log("🛡️  Role-based access control enforced");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }); 