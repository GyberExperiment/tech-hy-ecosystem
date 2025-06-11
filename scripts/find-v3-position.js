const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Поиск V3 позиции #216 через NonfungiblePositionManager...\n");

    const VC_TOKEN = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";
    const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
    
    // PancakeSwap V3 NonfungiblePositionManager на BSC Testnet
    const POSITION_MANAGER = "0x427bF5b37357632377eCbEC9de3626C71A5396c1";
    const V3_FACTORY = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865";

    try {
        const positionManagerABI = [
            "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
            "function ownerOf(uint256 tokenId) external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ];
        
        const positionManager = new ethers.Contract(POSITION_MANAGER, positionManagerABI, ethers.provider);
        
        console.log("🔍 Проверка позиции #216...");
        
        try {
            // Проверяем позицию #216
            const position = await positionManager.positions(216);
            const owner = await positionManager.ownerOf(216);
            
            console.log("✅ Позиция #216 найдена!");
            console.log(`   Owner: ${owner}`);
            console.log(`   Token0: ${position[2]}`);
            console.log(`   Token1: ${position[3]}`);
            console.log(`   Fee Tier: ${position[4]} (${position[4]/10000}%)`);
            console.log(`   Tick Lower: ${position[5]}`);
            console.log(`   Tick Upper: ${position[6]}`);
            console.log(`   Liquidity: ${position[7]}`);
            
            // Теперь найдем адрес пула через factory
            if (position[2] && position[3] && position[4]) {
                const v3FactoryABI = [
                    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
                ];
                
                const v3Factory = new ethers.Contract(V3_FACTORY, v3FactoryABI, ethers.provider);
                const poolAddress = await v3Factory.getPool(position[2], position[3], position[4]);
                
                console.log(`\n📊 Pool Information:`);
                console.log(`   Pool Address: ${poolAddress}`);
                
                if (poolAddress !== ethers.ZeroAddress) {
                    // Проверим состояние пула
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
                    console.log(`   Total Liquidity: ${liquidity}`);
                    console.log(`   SqrtPriceX96: ${slot0[0]}`);
                    console.log(`   Current Tick: ${slot0[1]}`);
                    
                    // Проверяем что это правильные токены
                    const expectedTokens = [VC_TOKEN.toLowerCase(), WBNB.toLowerCase()].sort();
                    const actualTokens = [token0.toLowerCase(), token1.toLowerCase()].sort();
                    
                    if (expectedTokens[0] === actualTokens[0] && expectedTokens[1] === actualTokens[1]) {
                        console.log("\n✅ Это правильный пул VC/WBNB!");
                        
                        // Рассчитываем цену
                        if (slot0[0] > 0n) {
                            const sqrtPriceX96 = slot0[0];
                            const price = (Number(sqrtPriceX96) / (2 ** 96)) ** 2;
                            
                            // Учитываем порядок токенов и decimals
                            const isVC0 = token0.toLowerCase() === VC_TOKEN.toLowerCase();
                            if (isVC0) {
                                const vcPriceInWBNB = price;
                                const wbnbPriceInVC = 1 / price;
                                console.log(`\n💱 Current Prices:`);
                                console.log(`   1 VC = ${vcPriceInWBNB.toFixed(10)} WBNB`);
                                console.log(`   1 WBNB = ${wbnbPriceInVC.toFixed(0)} VC`);
                            } else {
                                const wbnbPriceInVC = price;
                                const vcPriceInWBNB = 1 / price;
                                console.log(`\n💱 Current Prices:`);
                                console.log(`   1 WBNB = ${wbnbPriceInVC.toFixed(0)} VC`);
                                console.log(`   1 VC = ${vcPriceInWBNB.toFixed(10)} WBNB`);
                            }
                        }
                        
                        console.log(`\n🔗 Links:`);
                        console.log(`   BSCScan: https://testnet.bscscan.com/address/${poolAddress}`);
                        console.log(`   Position: https://pancakeswap.finance/liquidity/position/infinityCl/216?chain=bscTestnet`);
                        
                        console.log(`\n✅ НАЙДЕН ПРАВИЛЬНЫЙ V3 POOL:`);
                        console.log(`   Address: ${poolAddress}`);
                        console.log(`   Fee Tier: ${poolFee/10000}%`);
                        console.log(`   Liquidity: ${liquidity}`);
                        
                    } else {
                        console.log("\n❌ Это не VC/WBNB пул");
                    }
                    
                } else {
                    console.log("❌ Пул не найден в factory");
                }
            }
            
        } catch (error) {
            console.log(`❌ Позиция #216 не найдена или ошибка: ${error.message}`);
            
            // Попробуем найти общее количество позиций
            try {
                const totalSupply = await positionManager.totalSupply();
                console.log(`\n📊 Общее количество позиций: ${totalSupply}`);
                console.log("💡 Возможно позиция #216 не существует или сожжена");
            } catch (e) {
                console.log("❌ Не удалось получить totalSupply");
            }
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