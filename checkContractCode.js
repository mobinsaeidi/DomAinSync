// checkContractCode.js
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const address = "0xFcE33744f429aB77Eb84f0cC0829876167C343c2";

  const code = await provider.getCode(address);
  console.log(`Code at ${address}:`, code);

  if (code === "0x") {
    console.log("This address has no contract deployed on this network.");
  } else {
    console.log("Contract exists at this address.");
  }
}

main().catch(console.error);
