const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTPackage contract", function () {
  let contract;
  let owner;
  let addrs;

  beforeEach(async function () {
    [owner, ...addrs] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTPackage");
    contract = await contractFactory.deploy();
    await contract.initialize("NFT Package", "NFTPackage", owner.address);
    await contract.setPackage(["P1", "PD1", 2, "#09f"]);
    await contract.setPackage(["P2", "PD2", 1, "#09f"]);
    await contract.setPackage(["P3", "PD3", 4, ""]);
  });

  describe("#initialize", function () {
    describe("#when call initialize again", function () {
      it("reverts with Initializable: contract is already initialized", async function () {
        await expect(
          contract.initialize("NFTPackage 1", "NFTPackage1", owner.address)
        ).to.be.revertedWith("Initializable");
      });
    });
  });

  describe("#packages", function () {
    it("returns a package", async function () {
      let pkg = await contract.packages("P1");
      expect(pkg.name).to.equal("P1");
      expect(pkg.desc).to.equal("PD1");
      expect(pkg.totalSupply).to.equal(2);
      expect(pkg.cover).to.equal("#09f");

      pkg = await contract.packages("P2");
      expect(pkg.name).to.equal("P2");
      expect(pkg.desc).to.equal("PD2");
      expect(pkg.totalSupply).to.equal(1);
      expect(pkg.cover).to.equal("#09f");
    });
  });

  describe("#setPackage", function () {
    it("creates or updates", async function () {
      await contract.setPackage(["P4", "PD4", 2, ""]);
      let pkg = await contract.packages("P4");
      expect(pkg.name).to.equal("P4");
      expect(pkg.desc).to.equal("PD4");
      expect(pkg.totalSupply).to.equal(2);

      await contract.setPackage(["P3", "PD31", 22, "ABC"]);
      pkg = await contract.packages("P3");
      expect(pkg.name).to.equal("P3");
      expect(pkg.desc).to.equal("PD31");
      expect(pkg.totalSupply).to.equal(22);
      expect(pkg.cover).to.equal("ABC");
    });

    describe("when package minted", function () {
      it("reverts", async function () {
        await contract.mintTo(addrs[3].address, "P3", "");
        await expect(
          contract.setPackage(["P3", "PD31", 22, "ABC"])
        ).to.be.revertedWith("400");

        await contract.setPackage(["P4", "PD4", 2, ""]);
        const pkg = await contract.packages("P4");
        expect(pkg.name).to.equal("P4");
        expect(pkg.desc).to.equal("PD4");
        expect(pkg.totalSupply).to.equal(2);
      });
    });

    describe("when caller does not owner", function () {
      it("reverts", async function () {
        await expect(
          contract.connect(addrs[1]).setPackage(["P3", "PD31", 22, "ABC"])
        ).to.be.revertedWith("403");
      });
    });
  });

  describe("#tokenURI", function () {
    it("returns token URI onchain", async function () {
      await contract.mintTo(addrs[0].address, "P1", "");
      expect(await contract.tokenURI(1)).to.equal(
        "data:application/json;base64,eyJuYW1lIjoiIzEiLCJkZXNjcmlwdGlvbiI6IlBEMSIsImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCM2FXUjBhRDBpTnpBd0lpQm9aV2xuYUhROUlqTXdNQ0lnZUcxc2JuTTlJbWgwZEhBNkx5OTNkM2N1ZHpNdWIzSm5Mekl3TURBdmMzWm5JajQ4Y21WamRDQjNhV1IwYUQwaU1UQXdKU0lnYUdWcFoyaDBQU0l4TURBbElpQnpkSGxzWlQwaVptbHNiRG9qTURsbUlpOCtQR2NnYzNSNWJHVTlJbVJ2YldsdVlXNTBMV0poYzJWc2FXNWxPbTFwWkdSc1pUdDBaWGgwTFdGdVkyaHZjanB0YVdSa2JHVTdabTl1ZEMxemFYcGxPakl3TUR0bWIyNTBMWGRsYVdkb2REcGliMnhrT3lJK1BHUmxabk0rUEdacGJIUmxjaUJwWkQwaWMyaGhaRzkzSWo0OFptVkhZWFZ6YzJsaGJrSnNkWElnYzNSa1JHVjJhV0YwYVc5dVBTSXlJRElpSUhKbGMzVnNkRDBpYzJoaFpHOTNJaTgrUEdabFQyWm1jMlYwSUdSNFBTSTJJaUJrZVQwaU5pSXZQand2Wm1sc2RHVnlQand2WkdWbWN6NDhkR1Y0ZENCNFBTSTFNQ1VpSUhrOUlqVTBKU0lnYzNSNWJHVTlJbVpwYkhSbGNqcDFjbXdvSTNOb1lXUnZkeWs3Wm1sc2JEcGliR0ZqYXlJK01Ud3ZkR1Y0ZEQ0OGRHVjRkQ0I0UFNJMU1DVWlJSGs5SWpVMEpTSWdjM1I1YkdVOUltWnBiR3c2ZDJocGRHVWlQakU4TDNSbGVIUStQQzluUGp3dmMzWm5QZz09IiwiYXR0cmlidXRlcyI6W3sidHJhaXRfdHlwZSI6InBhY2thZ2UiLCJ2YWx1ZSI6IlAxIn1dfQ=="
      );
    });

    describe("#when set baseURI", function () {
      it("reverts", async function () {
        await contract.setConfig(["/uri/", ethers.constants.AddressZero]);
        await contract.mintTo(addrs[0].address, "P1", "");
        expect(await contract.tokenURI(1)).to.equal("/uri/1");
      });
    });

    describe("#when mint token with uri", function () {
      it("reverts", async function () {
        await contract.setConfig(["/uri/", ethers.constants.AddressZero]);
        await contract.mintTo(addrs[0].address, "P1", "/uri/99");
        expect(await contract.tokenURI(1)).to.equal("/uri/99");
      });
    });
  });

  describe("#packageTokenCount", function () {
    it("returns package token count", async function () {
      expect(await contract.packageTokenCount("P1")).to.equal(0);
      expect(await contract.packageTokenCount("P2")).to.equal(0);
    });
  });

  describe("#tokenPackage", function () {
    it("returns package token count", async function () {
      const receiver = addrs[0];
      const tokenID = (await contract.tokenCount()) + 1;

      await contract.mintTo(receiver.address, "P1", "");
      expect(await contract.tokenPackage(tokenID)).to.equal("P1");
    });

    describe("when tokenID does not exist", function () {
      it("returns package token count", async function () {
        expect(await contract.tokenPackage(1)).to.equal("");
      });
    });
  });

  describe("#mintTo", function () {
    it("mints token to receiver", async function () {
      const receiver = addrs[0];
      const tokenID = (await contract.tokenCount()) + 1;

      await contract.mintTo(receiver.address, "P1", "");
      expect(await contract.ownerOf(tokenID)).to.equal(receiver.address);
      expect(await contract.tokenCount()).to.equal(1);
      expect(await contract.packageTokenCount("P1")).to.equal(1);
    });

    describe("when mint reach cap", function () {
      it("reverts with ", async function () {
        const receiver = addrs[0];

        await contract.mintTo(receiver.address, "P2", "");
        expect(await contract.tokenCount()).to.equal(1);

        await expect(
          contract.mintTo(receiver.address, "P2", "")
        ).to.be.revertedWith("429");
      });
    });

    describe("when call not minter", function () {
      it("reverts with ", async function () {
        await expect(
          contract.connect(addrs[0]).mintTo(addrs[1].address, "P1", "")
        ).to.be.revertedWith("403");
      });
    });
  });
});
