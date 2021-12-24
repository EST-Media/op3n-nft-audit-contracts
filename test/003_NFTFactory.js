const { expect } = require("chai");
const { ethers } = require("hardhat");
const abi = require("../artifacts/contracts/NFTTestV1.sol/NFTTestV1.json");
const upgradeableABI = require("../artifacts/@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol/UpgradeableBeacon.json");

describe("NFTFactory contract", function () {
  let contract;
  let owner;
  let addrs;

  beforeEach(async function () {
    [owner, ...addrs] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTFactory");
    contract = await contractFactory.deploy();
    await contract.initialize();
  });

  describe("#initialize", function () {
    describe("#when call initialize again", function () {
      it("reverts", async function () {
        await expect(contract.initialize()).to.be.revertedWith("Initializable");
      });
    });
  });

  describe("#setBeacon", function () {
    it("creates new beacon", async function () {
      expect(await contract.beacons("NFTPackage")).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      const tokenContractFactory = await ethers.getContractFactory("NFTTestV1");
      const tokenContract = await tokenContractFactory.deploy();
      const tx = await contract.setBeacon(
        "NFTPackage",
        tokenContract.address,
        owner.address
      );
      const receipt = await tx.wait();
      expect(await contract.beacons("NFTPackage")).to.equal(
        receipt.logs[0].address
      );
      const beacon = new ethers.Contract(
        receipt.logs[0].address,
        upgradeableABI.abi,
        owner
      );
      expect(await beacon.owner()).to.equal(owner.address);
      expect(await beacon.implementation()).to.equal(tokenContract.address);

      // const proxyContract = new ethers.Contract(proxyAddress, abi.abi, owner);
      // console.log(await contract.deployTransaction);
      // console.log(receipt.events[2].args);
    });

    // describe("when beacon exists", function () {
    //   it("reverts", async function () {
    //     let tokenContractFactory = await ethers.getContractFactory("NFTTestV1");
    //     let tokenContract = await tokenContractFactory.deploy();
    //     const tx = await contract.setBeacon(
    //       "NFTPackage",
    //       tokenContract.address,
    //       owner.address
    //     );
    //     await tx.wait();

    //     tokenContractFactory = await ethers.getContractFactory("NFTTestV2");
    //     tokenContract = await tokenContractFactory.deploy();
    //     await expect(
    //       contract.setBeacon(
    //         "NFTPackage",
    //         tokenContract.address,
    //         owner.address
    //       )
    //     ).to.be.revertedWith("");
    //   });
    // });

    describe("when call with not owner", function () {
      it("reverts", async function () {
        const tokenContractFactory = await ethers.getContractFactory(
          "NFTTestV1"
        );
        const tokenContract = await tokenContractFactory.deploy();
        await expect(
          contract
            .connect(addrs[0])
            .setBeacon("NFTPackage", tokenContract.address, owner.address)
        ).to.be.revertedWith("");
      });
    });
  });

  describe("#createProxy", function () {
    it("returns proxy token with right init", async function () {
      const tokenContractFactory = await ethers.getContractFactory("NFTTestV1");
      const tokenContract = await tokenContractFactory.deploy();
      await contract.setBeacon(
        "NFTPackage",
        tokenContract.address,
        owner.address
      );

      const initArgs = ["TOKEN NAME", "TOKEN", owner.address];
      const data = tokenContract.interface.encodeFunctionData(
        "initialize",
        initArgs
      );

      const tx = await contract.createProxy("NFTPackage", data);
      const receipt = await tx.wait();
      const proxyAddress = receipt.logs[0].address;
      const proxyContract = new ethers.Contract(proxyAddress, abi.abi, owner);

      // init right data
      expect(await proxyContract.name()).to.equal("TOKEN NAME");
      expect(await proxyContract.symbol()).to.equal("TOKEN");
      expect(await proxyContract.owner()).to.equal(owner.address);
      expect(await proxyContract.version()).to.equal("v1");
    });

    describe("when beacon does not exist", function () {
      it("returns proxy token with right init", async function () {
        const tokenContractFactory = await ethers.getContractFactory(
          "NFTTestV1"
        );
        const initArgs = ["TOKEN NAME", "TOKEN", owner.address];
        const data = tokenContractFactory.interface.encodeFunctionData(
          "initialize",
          initArgs
        );

        await expect(
          contract.createProxy("NFTPackage", data)
        ).to.be.revertedWith("");
      });
    });

    describe("when call with not owner", function () {
      it("reverts", async function () {
        const tokenContractFactory = await ethers.getContractFactory(
          "NFTTestV1"
        );
        const tokenContract = await tokenContractFactory.deploy();
        await contract.setBeacon(
          "NFTPackage",
          tokenContract.address,
          owner.address
        );

        const initArgs = ["TOKEN NAME", "TOKEN", owner.address];
        const data = tokenContract.interface.encodeFunctionData(
          "initialize",
          initArgs
        );

        const tx = await contract.createProxy("NFTPackage", data);
        const receipt = await tx.wait();
        const proxyAddress = receipt.logs[0].address;
        const proxyContract = new ethers.Contract(proxyAddress, abi.abi, owner);
        expect(await proxyContract.name()).to.equal("TOKEN NAME");

        await expect(
          contract.connect(addrs[0]).createProxy("NFTPackage", data)
        ).to.be.revertedWith("");
      });
    });
  });
});
