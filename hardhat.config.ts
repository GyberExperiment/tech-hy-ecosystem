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
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY) ? [normalizePrivateKey(process.env.PRIVATE_KEY)!] : [],
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    }
  }
};

export default config;