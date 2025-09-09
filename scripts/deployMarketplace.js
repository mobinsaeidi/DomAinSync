const { ethers } = require("hardhat");

async function main() {
  
  const domainDualIdentityAddress = "0xFcE33744f429aB77Eb84f0cC0829876167C343c2";

  console.log("Deploying DomainMarketplace.");
  const Marketplace = await ethers.getContractFactory("DomainMarketplace");
  const marketplace = await Marketplace.deploy(domainDualIdentityAddress);

  await marketplace.waitForDeployment();

  console.log("DomainMarketplace deployed at:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
