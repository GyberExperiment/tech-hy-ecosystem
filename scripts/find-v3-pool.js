const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Поиск PancakeSwap V3 пула VC/WBNB...\n");

    const VC_TOKEN = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";
    const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
    
    // PancakeSwap V3 Factory на BSC Testnet
    const V3_FACTORY = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865";
    
    // Различные fee tiers для V3 пулов
    const FEE_TIERS = [500, 2500, 10000]; // 0.05%, 0.25%, 1%

    try {
        const v3FactoryABI = [
            "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
        ];
        
        const v3Factory = new ethers.Contract(V3_FACTORY, v3FactoryABI, ethers.provider);
        
        console.log("🔍 Проверка V3 пулов с разными fee tiers...");
        
        for (const fee of FEE_TIERS) {
            try {
                const poolAddress = await v3Factory.getPool(VC_TOKEN, WBNB, fee);
                
                if (poolAddress !== ethers.ZeroAddress) {
                    console.log(`✅ Найден V3 пул с fee ${fee/10000}%: ${poolAddress}`);
                    
                    // Проверяем состояние пула
                    const v3PoolABI = [
                        "function token0() external view returns (address)",
                        "function token1() external view returns (address)",
                        "function fee() external view returns (uint24)",
                        "function liquidity() external view returns (uint128)",
                        "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
                    ];
                    
                    const poolContract = new ethers.Contract(poolAddress, v3PoolABI, ethers.provider);
                    
                    const [token0, token1, poolFee, liquidity, slot0] = await Promise.all([
                        poolContract.token0(),
                        poolContract.token1(),
                        poolContract.fee(),
                        poolContract.liquidity(),
                        poolContract.slot0()
                    ]);
                    
                    console.log(`   Token0: ${token0}`);
                    console.log(`   Token1: ${token1}`);
                    console.log(`   Fee: ${poolFee}`);
                    console.log(`   Liquidity: ${liquidity}`);
                    console.log(`   SqrtPriceX96: ${slot0[0]}`);
                    console.log(`   Current Tick: ${slot0[1]}`);
                    
                    // Рассчитываем цену из sqrtPriceX96
                    if (slot0[0] > 0n) {
                        const sqrtPriceX96 = slot0[0];
                        const price = (Number(sqrtPriceX96) / (2 ** 96)) ** 2;
                        console.log(`   Current Price (raw): ${price}`);
                        
                        // Учитываем порядок токенов
                        const isVC0 = token0.toLowerCase() === VC_TOKEN.toLowerCase();
                        if (isVC0) {
                            const vcPriceInWBNB = price;
                            const wbnbPriceInVC = 1 / price;
                            console.log(`   1 VC = ${vcPriceInWBNB.toFixed(10)} WBNB`);
                            console.log(`   1 WBNB = ${wbnbPriceInVC.toFixed(2)} VC`);
                        } else {
                            const wbnbPriceInVC = price;
                            const vcPriceInWBNB = 1 / price;
                            console.log(`   1 WBNB = ${wbnbPriceInVC.toFixed(2)} VC`);
                            console.log(`   1 VC = ${vcPriceInWBNB.toFixed(10)} WBNB`);
                        }
                    }
                    
                    console.log(`   🔗 BSCScan: https://testnet.bscscan.com/address/${poolAddress}`);
                    console.log(`   🥞 PancakeSwap: https://pancakeswap.finance/liquidity/position/infinityCl/${poolAddress}?chain=bscTestnet\n`);
                    
                } else {
                    console.log(`❌ V3 пул с fee ${fee/10000}% НЕ НАЙДЕН`);
                }
            } catch (error) {
                console.log(`❌ Ошибка проверки fee ${fee}: ${error.message}`);
            }
        }
        
        // Также проверим V2 пул для сравнения
        console.log("\n🔍 Проверка V2 пула для сравнения...");
        const V2_FACTORY = "0x6725f303b657a9451d8ba641348b6761a6cc7a17";
        
        const v2FactoryABI = [
            "function getPair(address tokenA, address tokenB) external view returns (address pair)"
        ];
        
        const v2Factory = new ethers.Contract(V2_FACTORY, v2FactoryABI, ethers.provider);
        const v2PairAddress = await v2Factory.getPair(VC_TOKEN, WBNB);
        
        if (v2PairAddress !== ethers.ZeroAddress) {
            console.log(`✅ V2 пул найден: ${v2PairAddress}`);
        } else {
            console.log("❌ V2 пул НЕ НАЙДЕН");
        }

        console.log("\n💡 Рекомендация:");
        console.log("Если V3 пул найден и имеет ликвидность, используйте его адрес в LP_TOKEN");
        console.log("V3 пулы более эффективны и используются в современных DeFi приложениях");

    } catch (error) {
        console.error("❌ Ошибка:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 