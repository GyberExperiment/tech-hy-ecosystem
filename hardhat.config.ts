import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
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
};

export default config;