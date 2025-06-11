const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Создание LP пула VC/WBNB на PancakeSwap...\n");

    const VC_TOKEN = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";
    const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
    const PANCAKE_ROUTER = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
    const PANCAKE_FACTORY = "0x6725f303b657a9451d8ba641348b6761a6cc7a17";

    // Получаем signer
    const [deployer] = await ethers.getSigners();
    console.log(`🔑 Deployer: ${deployer.address}`);
    
    // Проверяем балансы
    const vcContract = new ethers.Contract(VC_TOKEN, [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function name() view returns (string)",
        "function symbol() view returns (string)"
    ], deployer);
    
    const vcBalance = await vcContract.balanceOf(deployer.address);
    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    
    console.log(`💰 VC Balance: ${ethers.formatEther(vcBalance)}`);
    console.log(`💰 BNB Balance: ${ethers.formatEther(bnbBalance)}`);
    
    if (vcBalance < ethers.parseEther("1000")) {
        console.log("❌ Недостаточно VC токенов (нужно минимум 1000 VC)");
        return;
    }
    
    if (bnbBalance < ethers.parseEther("0.1")) {
        console.log("❌ Недостаточно BNB (нужно минимум 0.1 BNB)");
        return;
    }

    try {
        // 1. Проверим Factory пул еще раз
        const factoryContract = new ethers.Contract(PANCAKE_FACTORY, [
            "function getPair(address tokenA, address tokenB) external view returns (address pair)",
            "function createPair(address tokenA, address tokenB) external returns (address pair)"
        ], deployer);
        
        let pairAddress = await factoryContract.getPair(VC_TOKEN, WBNB);
        console.log(`🔍 Текущий LP пул: ${pairAddress}`);
        
        if (pairAddress === ethers.ZeroAddress) {
            console.log("📝 Создаем новый LP пул...");
            
            const createTx = await factoryContract.createPair(VC_TOKEN, WBNB);
            console.log(`⏳ Транзакция создания пула: ${createTx.hash}`);
            await createTx.wait();
            
            pairAddress = await factoryContract.getPair(VC_TOKEN, WBNB);
            console.log(`✅ LP пул создан: ${pairAddress}\n`);
        } else {
            console.log("✅ LP пул уже существует\n");
        }

        // 2. Добавляем ликвидность
        console.log("💧 Добавление ликвидности...");
        
        const routerContract = new ethers.Contract(PANCAKE_ROUTER, [
            "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
        ], deployer);

        // Параметры ликвидности
        const vcAmount = ethers.parseEther("1000"); // 1000 VC
        const bnbAmount = ethers.parseEther("0.1");  // 0.1 BNB
        const slippage = 5; // 5%
        const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 минут

        const vcMin = vcAmount * BigInt(100 - slippage) / BigInt(100);
        const bnbMin = bnbAmount * BigInt(100 - slippage) / BigInt(100);

        // Approve VC токены
        console.log("🔐 Одобрение VC токенов...");
        const approveTx = await vcContract.approve(PANCAKE_ROUTER, vcAmount);
        console.log(`⏳ Транзакция approve: ${approveTx.hash}`);
        await approveTx.wait();
        console.log("✅ VC токены одобрены");

        // Добавляем ликвидность
        console.log("💧 Добавление ликвидности к пулу...");
        console.log(`   VC Amount: ${ethers.formatEther(vcAmount)}`);
        console.log(`   BNB Amount: ${ethers.formatEther(bnbAmount)}`);
        console.log(`   VC Min: ${ethers.formatEther(vcMin)}`);
        console.log(`   BNB Min: ${ethers.formatEther(bnbMin)}`);

        const liquidityTx = await routerContract.addLiquidityETH(
            VC_TOKEN,
            vcAmount,
            vcMin,
            bnbMin,
            deployer.address,
            deadline,
            { value: bnbAmount }
        );

        console.log(`⏳ Транзакция ликвидности: ${liquidityTx.hash}`);
        const receipt = await liquidityTx.wait();
        console.log("✅ Ликвидность добавлена успешно!");

        // 3. Проверяем результат
        console.log("\n📊 Проверка результата...");
        const pairContract = new ethers.Contract(pairAddress, [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ], deployer);

        const [reserves, token0, token1, totalSupply] = await Promise.all([
            pairContract.getReserves(),
            pairContract.token0(),
            pairContract.token1(),
            pairContract.totalSupply()
        ]);

        console.log(`   LP Pair Address: ${pairAddress}`);
        console.log(`   Token0: ${token0}`);
        console.log(`   Token1: ${token1}`);
        console.log(`   Reserve0: ${ethers.formatEther(reserves[0])}`);
        console.log(`   Reserve1: ${ethers.formatEther(reserves[1])}`);
        console.log(`   Total LP Supply: ${ethers.formatEther(totalSupply)}`);

        // 4. Обновляем deployed-ecosystem.json
        console.log("\n📝 Обновление deployed-ecosystem.json...");
        
        const fs = require('fs');
        const deployedData = JSON.parse(fs.readFileSync('deployed-ecosystem.json', 'utf8'));
        
        deployedData.LP_TOKEN = pairAddress;
        deployedData.LAST_UPDATED = new Date().toISOString();
        deployedData.UPDATE_NOTE = `Real VC/WBNB LP pool created on PancakeSwap`;
        deployedData.UPDATE_TRANSACTION = liquidityTx.hash;
        deployedData.LP_POOL_INFO = {
            PAIR_ADDRESS: pairAddress,
            TOKEN0: token0,
            TOKEN1: token1,
            INITIAL_VC_LIQUIDITY: ethers.formatEther(vcAmount),
            INITIAL_BNB_LIQUIDITY: ethers.formatEther(bnbAmount),
            TOTAL_LP_SUPPLY: ethers.formatEther(totalSupply)
        };
        
        fs.writeFileSync('deployed-ecosystem.json', JSON.stringify(deployedData, null, 2));
        console.log("✅ deployed-ecosystem.json обновлен");

        console.log("\n🎉 LP пул VC/WBNB успешно создан и настроен!");
        console.log(`🔗 LP Token Address: ${pairAddress}`);
        console.log(`📊 BSCScan: https://testnet.bscscan.com/address/${pairAddress}`);

    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 