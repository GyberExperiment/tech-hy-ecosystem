const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Проверка контракта 0x77DedB52EC6260daC4011313DBEE09616d30d122...\n");

    const contractAddress = "0x77DedB52EC6260daC4011313DBEE09616d30d122";

    try {
        // Проверка существования контракта
        const code = await ethers.provider.getCode(contractAddress);
        
        if (code === "0x") {
            console.log("❌ Контракт НЕ СУЩЕСТВУЕТ (EOA или не развернут)");
            return;
        }
        
        console.log("✅ Контракт существует");
        console.log(`   Размер bytecode: ${(code.length - 2) / 2} bytes\n`);

        // Попробуем стандартные ERC20 функции
        console.log("🔍 Проверка ERC20 функций...");
        const erc20ABI = [
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function decimals() external view returns (uint8)",
            "function totalSupply() external view returns (uint256)"
        ];
        
        const contract = new ethers.Contract(contractAddress, erc20ABI, ethers.provider);
        
        try {
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply()
            ]);
            
            console.log(`   Name: ${name}`);
            console.log(`   Symbol: ${symbol}`);
            console.log(`   Decimals: ${decimals}`);
            console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}\n`);
            
        } catch (error) {
            console.log(`❌ Не ERC20 токен: ${error.message}\n`);
        }

        // Попробуем LP pair функции
        console.log("🔍 Проверка LP Pair функций...");
        const pairABI = [
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
        ];
        
        const pairContract = new ethers.Contract(contractAddress, pairABI, ethers.provider);
        
        try {
            const [token0, token1, reserves] = await Promise.all([
                pairContract.token0(),
                pairContract.token1(),
                pairContract.getReserves()
            ]);
            
            console.log(`   Token0: ${token0}`);
            console.log(`   Token1: ${token1}`);
            console.log(`   Reserve0: ${ethers.formatEther(reserves[0])}`);
            console.log(`   Reserve1: ${ethers.formatEther(reserves[1])}`);
            console.log("✅ Это LP Pair контракт!\n");
            
        } catch (error) {
            console.log(`❌ Не LP Pair: ${error.message}\n`);
        }

        // Проверим LPLocker функции
        console.log("🔍 Проверка LPLocker функций...");
        const lpLockerABI = [
            "function getPoolInfo() external view returns (uint256, uint256, uint256, uint256)",
            "function config() external view returns (tuple(address,address,address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bool,uint256,uint8,uint256,uint256,uint256))"
        ];
        
        const lpLockerContract = new ethers.Contract(contractAddress, lpLockerABI, ethers.provider);
        
        try {
            const poolInfo = await lpLockerContract.getPoolInfo();
            console.log(`   Pool Info: ${poolInfo}`);
            console.log("✅ Это может быть LPLocker контракт!\n");
            
        } catch (error) {
            console.log(`❌ Не LPLocker: ${error.message}\n`);
        }

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