import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

// Функция для нормализации приватного ключа
function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (key.startsWith('0x')) return key;
  if (key.length === 64) return '0x' + key;
  return undefined;
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",  // Updated to match highest OpenZeppelin requirement
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 5000000000, // 5 gwei
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY) ? [normalizePrivateKey(process.env.PRIVATE_KEY)!] : [],
    },
    bscTestnet: {
      url: "https://bsc-testnet-dataseed.bnbchain.org",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY) ? [normalizePrivateKey(process.env.PRIVATE_KEY)!] : [],
    }
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    }
  }
};

export default config;