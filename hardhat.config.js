require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    doma: {
      url: "DOMA_TESTNET_RPC_URL",  
      accounts: ["0xYOUR_PRIVATE_KEY"] 
    }
  }
};