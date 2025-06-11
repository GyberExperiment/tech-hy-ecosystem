const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Проверка состояния LP пула...\n");

    // Константы из deployed-ecosystem.json
    const DEPLOYED_LP_TOKEN = "0x77DedB52EC6260daC4011313DBEE09616d30d122";
    const VC_TOKEN = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";
    const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
    const PANCAKE_FACTORY = "0x6725f303b657a9451d8ba641348b6761a6cc7a17"; // Исправленный адрес
    const PANCAKE_ROUTER = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

    try {
        // 1. Проверка Factory и получение LP адреса
        console.log("1️⃣ Проверка PancakeSwap Factory...");
        const factoryABI = [
            "function getPair(address tokenA, address tokenB) external view returns (address pair)",
            "function allPairsLength() external view returns (uint256)"
        ];
        
        const factory = new ethers.Contract(PANCAKE_FACTORY, factoryABI, ethers.provider);
        
        try {
            const pairFromFactory = await factory.getPair(VC_TOKEN, WBNB);
            console.log(`   Factory getPair(VC, WBNB): ${pairFromFactory}`);
            console.log(`   Deployed LP Token:         ${DEPLOYED_LP_TOKEN}`);
            console.log(`   Совпадают: ${pairFromFactory.toLowerCase() === DEPLOYED_LP_TOKEN.toLowerCase() ? '✅' : '❌'}\n`);
            
            if (pairFromFactory === ethers.ZeroAddress) {
                console.log("❌ LP пул НЕ СУЩЕСТВУЕТ в PancakeSwap Factory!");
                console.log("🔧 Требуется создать LP пул для пары VC/WBNB\n");
                return;
            }
        } catch (error) {
            console.log(`❌ Ошибка вызова factory.getPair(): ${error.message}\n`);
            return;
        }

        // 2. Проверка LP пула (если существует)
        console.log("2️⃣ Проверка LP пула...");
        const pairABI = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ];
        
        const lpPair = new ethers.Contract(DEPLOYED_LP_TOKEN, pairABI, ethers.provider);
        
        try {
            const [reserves, token0, token1, totalSupply] = await Promise.all([
                lpPair.getReserves(),
                lpPair.token0(),
                lpPair.token1(),
                lpPair.totalSupply()
            ]);
            
            console.log(`   Token0: ${token0}`);
            console.log(`   Token1: ${token1}`);
            console.log(`   Reserve0: ${ethers.formatEther(reserves[0])} ${token0 === VC_TOKEN ? 'VC' : 'WBNB'}`);
            console.log(`   Reserve1: ${ethers.formatEther(reserves[1])} ${token1 === VC_TOKEN ? 'VC' : 'WBNB'}`);
            console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} LP`);
            console.log(`   Timestamp: ${reserves[2]}\n`);
            
            // Проверка что токены правильные
            const expectedTokens = [VC_TOKEN.toLowerCase(), WBNB.toLowerCase()].sort();
            const actualTokens = [token0.toLowerCase(), token1.toLowerCase()].sort();
            
            if (expectedTokens[0] === actualTokens[0] && expectedTokens[1] === actualTokens[1]) {
                console.log("✅ LP пул содержит правильные токены (VC + WBNB)");
            } else {
                console.log("❌ LP пул содержит неправильные токены!");
                console.log(`   Ожидается: VC(${VC_TOKEN}) + WBNB(${WBNB})`);
                console.log(`   Фактически: ${token0} + ${token1}`);
            }
            
            // Проверка ликвидности
            if (reserves[0] === 0n && reserves[1] === 0n) {
                console.log("⚠️  LP пул существует, но БЕЗ ЛИКВИДНОСТИ!");
                console.log("🔧 Требуется добавить ликвидность в пул\n");
            } else {
                console.log("✅ LP пул имеет ликвидность\n");
            }
            
        } catch (error) {
            console.log(`❌ Ошибка чтения LP пула: ${error.message}\n`);
        }

        // 3. Проверка VC и WBNB токенов
        console.log("3️⃣ Проверка токенов...");
        const erc20ABI = [
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function totalSupply() external view returns (uint256)"
        ];
        
        try {
            const vcToken = new ethers.Contract(VC_TOKEN, erc20ABI, ethers.provider);
            const wbnbToken = new ethers.Contract(WBNB, erc20ABI, ethers.provider);
            
            const [vcName, vcSymbol, vcSupply] = await Promise.all([
                vcToken.name(),
                vcToken.symbol(),
                vcToken.totalSupply()
            ]);
            
            const [wbnbName, wbnbSymbol, wbnbSupply] = await Promise.all([
                wbnbToken.name(),
                wbnbToken.symbol(),
                wbnbToken.totalSupply()
            ]);
            
            console.log(`   VC Token:   ${vcName} (${vcSymbol}) - Supply: ${ethers.formatEther(vcSupply)}`);
            console.log(`   WBNB Token: ${wbnbName} (${wbnbSymbol}) - Supply: ${ethers.formatEther(wbnbSupply)}\n`);
            
        } catch (error) {
            console.log(`❌ Ошибка чтения токенов: ${error.message}\n`);
        }

        // 4. Проверка состояния Factory
        console.log("4️⃣ Общая статистика Factory...");
        try {
            const totalPairs = await factory.allPairsLength();
            console.log(`   Всего пар в Factory: ${totalPairs}`);
            
            console.log("\n✅ Диагностика завершена!");
            
        } catch (error) {
            console.log(`❌ Ошибка получения статистики Factory: ${error.message}`);
        }

    } catch (error) {
        console.error("❌ Критическая ошибка:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 