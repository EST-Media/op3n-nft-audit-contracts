const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTPackageMinter contract", function () {
  let contract;
  let owner;
  let addrs;

  beforeEach(async function () {
    [owner, ...addrs] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTPackageMinter");
    contract = await contractFactory.deploy();
  });

  describe("#initialize", function () {
    it("inits right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("sets owner is minter", async function () {
      expect(await contract.isMinter(owner.address)).to.equal(true);
    });
  });

  describe("#setMinter", function () {
    it("sets minter", async function () {
      const minter = addrs[1].address;
      expect(await contract.isMinter(minter)).to.equal(false);
      await contract.setMinter(minter);
      expect(await contract.isMinter(minter)).to.equal(true);
    });

    describe("when call func is not owner", function () {
      it("reverts", async function () {
        const minter = addrs[1].address;
        expect(await contract.isMinter(minter)).to.equal(false);
        await expect(
          contract.connect(addrs[0]).setMinter(minter)
        ).to.be.revertedWith("");
        expect(await contract.isMinter(minter)).to.equal(false);
      });
    });
  });

  describe("#setMinters", function () {
    it("sets minter", async function () {
      const minter = addrs[1].address;
      expect(await contract.isMinter(minter)).to.equal(false);
      await contract.setMinters([minter]);
      expect(await contract.isMinter(minter)).to.equal(true);
    });

    describe("when call func is not owner", function () {
      it("reverts", async function () {
        const minter = addrs[1].address;
        expect(await contract.isMinter(minter)).to.equal(false);
        await expect(
          contract.connect(addrs[0]).setMinters([minter])
        ).to.be.revertedWith("");
        expect(await contract.isMinter(minter)).to.equal(false);
      });
    });
  });

  describe("#revokeMinter", function () {
    it("sets minter", async function () {
      const minter = addrs[1].address;
      await contract.setMinter(minter);
      expect(await contract.isMinter(minter)).to.equal(true);
      await contract.revokeMinter(minter);
      expect(await contract.isMinter(minter)).to.equal(false);
    });

    describe("when call func is not owner", function () {
      it("reverts", async function () {
        const minter = addrs[1].address;
        await contract.setMinter(minter);
        expect(await contract.isMinter(minter)).to.equal(true);
        await expect(
          contract.connect(addrs[0]).revokeMinter(minter)
        ).to.be.revertedWith("");
        expect(await contract.isMinter(minter)).to.equal(true);
      });
    });
  });

  describe("#revokeMinters", function () {
    it("sets minter", async function () {
      const minter = addrs[1].address;
      await contract.setMinter(minter);
      expect(await contract.isMinter(minter)).to.equal(true);
      await contract.revokeMinters([minter]);
      expect(await contract.isMinter(minter)).to.equal(false);
    });

    describe("when call func is not owner", function () {
      it("reverts", async function () {
        const minter = addrs[1].address;
        await contract.setMinter(minter);
        expect(await contract.isMinter(minter)).to.equal(true);
        await expect(
          contract.connect(addrs[0]).revokeMinters([minter])
        ).to.be.revertedWith("");
        expect(await contract.isMinter(minter)).to.equal(true);
      });
    });
  });

  describe("#mint", function () {
    let projectOwner;
    let projectContract;
    let minter;

    beforeEach(async function () {
      projectOwner = addrs[0];
      const contractFactory = await ethers.getContractFactory(
        "NFTPackage",
        projectOwner
      );

      projectContract = await contractFactory.deploy();
      await projectContract.initialize(
        "NFTPackage NFT",
        "NFTPackage",
        projectOwner.address
      );
      await projectContract.setPackage(["P1", "PD1", 2, "#09f"]);
      await projectContract.grantRole(
        await projectContract.MINTER_ROLE(),
        contract.address
      );

      minter = addrs[1];
      await contract.setMinter(minter.address);
    });

    it("mints token", async function () {
      const mint = addrs[2].address;
      expect(await projectContract.balanceOf(mint)).to.equal(0);
      await contract
        .connect(minter)
        .mint(projectContract.address, mint, "P1", "");
      expect(await projectContract.balanceOf(mint)).to.equal(1);
    });

    describe("when call func is not minter", function () {
      it("reverts", async function () {
        const mint = addrs[2].address;
        expect(await projectContract.balanceOf(mint)).to.equal(0);
        await expect(
          contract
            .connect(addrs[3])
            .mint(projectContract.address, mint, "P1", "")
        ).to.be.revertedWith("403");
        expect(await projectContract.balanceOf(mint)).to.equal(0);
      });
    });
  });
});
