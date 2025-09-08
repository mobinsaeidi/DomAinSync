require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const DOMA_RPC_URL = process.env.RPC_URL || "https://rpc-testnet.doma.xyz"; 

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    domaTestnet: {
      url: DOMA_RPC_URL,
      chainId: 97476,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
