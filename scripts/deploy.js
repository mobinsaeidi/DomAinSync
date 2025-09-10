const { ethers } = require("hardhat");

async function main() {
  const Contract = await ethers.getContractFactory("DomainDualIdentity");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();
  console.log("Contract deployed at:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
