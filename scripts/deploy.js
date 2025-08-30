const hre = require("hardhat");

async function main() {
  const ContractFactory = await hre.ethers.getContractFactory("DomainDualIdentity");

  console.log("Deploying DomainDualIdentity...");
  const contract = await ContractFactory.deploy();


  await contract.waitForDeployment();

  console.log(`DomainDualIdentity deployed to: ${contract.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
