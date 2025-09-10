const { ethers } = require("hardhat");

async function main() {
  
  const domainDualIdentityAddress = "0x96bd117d50F1ca299E37D40AE979aE6716DB1";

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
