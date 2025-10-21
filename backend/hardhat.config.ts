import 'dotenv/config';
import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatVerify],
  solidity: {
    profiles: {
      default: {
        version: "0.8.27",
      },
      production: {
        version: "0.8.27",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    bscMainnet: {
      type: "http",
      chainType: "l1",
      url: configVariable("BSC_RPC_URL"),
      accounts: [configVariable("BSC_PRIVATE_KEY")],
      chainId: 56,
      gasPrice: 5000000000, // 5 gwei
    },
  },
  verify: {
    etherscan: {
      // Use BSCSCAN_API_KEY for BSC (Etherscan-compatible)
      apiKey: configVariable("BSCSCAN_API_KEY"),
    },
  },
};

export default config;
