const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Groth16Verifier...");

  const VerifierFactory = await ethers.getContractFactory("Groth16Verifier");

  const verifier = await VerifierFactory.deploy();
  await verifier.waitForDeployment();

  console.log("Groth16Verifier deployed at:", await verifier.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
