const { ethers } = require("hardhat");

async function main() {
  const verifierAddress = "0xFcE33744f429aB77Eb84f0cC0829876167C343c2"; // این رو از deployVerifier.js بگیری

  console.log("Deploying WhoisZKBridge...");
  const Bridge = await ethers.getContractFactory("WhoisZKBridge");
  const bridge = await Bridge.deploy(verifierAddress);

  await bridge.waitForDeployment();
  console.log("WhoisZKBridge deployed at:", await bridge.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
