const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Проверка ликвидности LP пула VC/WBNB...\n");

    const LP_PAIR = "0x79E3Ad7535A3aD1315e8434182d1dc74fCb09944";
    const VC_TOKEN = "0xC88eC091302Eb90e78a4CA361D083330752dfc9A";
    const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    try {
        const pairABI = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)",
            "function balanceOf(address owner) external view returns (uint256)"
        ];
        
        const pairContract = new ethers.Contract(LP_PAIR, pairABI, ethers.provider);
        
        const [reserves, token0, token1, totalSupply] = await Promise.all([
            pairContract.getReserves(),
            pairContract.token0(),
            pairContract.token1(),
            pairContract.totalSupply()
        ]);
        
        console.log("📊 LP Pool Information:");
        console.log(`   Pair Address: ${LP_PAIR}`);
        console.log(`   Token0: ${token0}`);
        console.log(`   Token1: ${token1}`);
        console.log(`   Reserve0: ${ethers.formatEther(reserves[0])}`);
        console.log(`   Reserve1: ${ethers.formatEther(reserves[1])}`);
        console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);
        console.log(`   Last Update: ${new Date(reserves[2] * 1000).toISOString()}`);
        
        // Определяем какой токен какой
        const isVC0 = token0.toLowerCase() === VC_TOKEN.toLowerCase();
        const vcReserve = isVC0 ? reserves[0] : reserves[1];
        const wbnbReserve = isVC0 ? reserves[1] : reserves[0];
        
        console.log("\n💰 Token Details:");
        console.log(`   VC Reserve: ${ethers.formatEther(vcReserve)} VC`);
        console.log(`   WBNB Reserve: ${ethers.formatEther(wbnbReserve)} WBNB`);
        
        // Рассчитываем цены
        if (vcReserve > 0n && wbnbReserve > 0n) {
            const vcPriceInWBNB = Number(ethers.formatEther(wbnbReserve)) / Number(ethers.formatEther(vcReserve));
            const wbnbPriceInVC = Number(ethers.formatEther(vcReserve)) / Number(ethers.formatEther(wbnbReserve));
            
            console.log("\n💱 Current Prices:");
            console.log(`   1 VC = ${vcPriceInWBNB.toFixed(8)} WBNB`);
            console.log(`   1 WBNB = ${wbnbPriceInVC.toFixed(2)} VC`);
        }
        
        // Проверяем ликвидность
        if (reserves[0] === 0n && reserves[1] === 0n) {
            console.log("\n❌ LP пул БЕЗ ЛИКВИДНОСТИ!");
        } else {
            console.log("\n✅ LP пул содержит ликвидность!");
        }
        
        // Проверяем что токены правильные
        const expectedTokens = [VC_TOKEN.toLowerCase(), WBNB.toLowerCase()].sort();
        const actualTokens = [token0.toLowerCase(), token1.toLowerCase()].sort();
        
        if (expectedTokens[0] === actualTokens[0] && expectedTokens[1] === actualTokens[1]) {
            console.log("✅ LP пул содержит правильные токены (VC + WBNB)");
        } else {
            console.log("❌ LP пул содержит неправильные токены!");
        }
        
        console.log("\n🔗 Links:");
        console.log(`   BSCScan: https://testnet.bscscan.com/address/${LP_PAIR}`);
        console.log(`   PancakeSwap: https://pancakeswap.finance/info/pools/${LP_PAIR}`);

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