const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DomainDualIdentity (ERC721)", function () {
  let ContractFactory, contract;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    ContractFactory = await ethers.getContractFactory("DomainDualIdentity");
    contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
  });

  it("should have correct name and symbol", async () => {
    expect(await contract.name()).to.equal("DomainDualIdentity");
    expect(await contract.symbol()).to.equal("DDI");
  });

  it("should register a new domain and assign token", async () => {
    const domainName = "example.eth";
    const whois = ethers.encodeBytes32String("whois123");

    await expect(contract.connect(user1).registerDomain(domainName, whois))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, 0);

    expect(await contract.getWhoisHash(domainName)).to.equal(whois);
    expect(await contract.getDomainByTokenId(0)).to.equal(domainName);
    expect(await contract.ownerOf(0)).to.equal(user1.address);
  });

  it("should allow owner to update whois hash", async () => {
    const domainName = "testupdate.eth";
    const whoisOld = ethers.encodeBytes32String("old");
    const whoisNew = ethers.encodeBytes32String("new");

    await contract.connect(user1).registerDomain(domainName, whoisOld);
    await contract.connect(user1).updateWhoisHash(0, whoisNew);

    expect(await contract.getWhoisHash(domainName)).to.equal(whoisNew);
  });

  it("should allow approved account to update whois hash", async () => {
    const domainName = "approved.eth";
    const whoisOne = ethers.encodeBytes32String("h1");
    const whoisTwo = ethers.encodeBytes32String("h2");

    await contract.connect(user1).registerDomain(domainName, whoisOne);
    await contract.connect(user1).approve(user2.address, 0);

    await contract.connect(user2).updateWhoisHash(0, whoisTwo);
    expect(await contract.getWhoisHash(domainName)).to.equal(whoisTwo);
  });

  it("should revert if updater is not owner or approved", async () => {
    const domainName = "noaccess.eth";
    const whois = ethers.encodeBytes32String("w");

    await contract.connect(user1).registerDomain(domainName, whois);
    await expect(
      contract.connect(user2).updateWhoisHash(0, ethers.encodeBytes32String("h"))
    ).to.be.revertedWith("Not owner or approved");
  });

  it("should revert if token does not exist in update", async () => {
    await expect(
      contract.connect(user1).updateWhoisHash(
        999,
        ethers.encodeBytes32String("h")
      )
    ).to.be.revertedWithCustomError(contract, "ERC721NonexistentToken")
      .withArgs(999);
  });

  it("should revert getDomainByTokenId if token does not exist", async () => {
    await expect(
      contract.getDomainByTokenId(55)
    ).to.be.revertedWith("Token does not exist");
  });
});
