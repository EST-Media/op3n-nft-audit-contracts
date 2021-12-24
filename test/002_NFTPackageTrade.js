const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTPackageTrade contract", function () {
  let contract;
  let owner;
  let addrs;

  beforeEach(async function () {
    [owner, ...addrs] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTPackageTrade");
    contract = await contractFactory.deploy();
    await contract.initialize(owner.address);
  });

  describe("#initialize", function () {
    it("inits right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  describe("#mint", function () {
    let projectOwner;
    let projectContract;
    let minter;
    let tokenAddress;
    let amount;
    let fee;

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
      tokenAddress = ethers.constants.AddressZero;
      amount = ethers.utils.parseUnits("0.75", "ether");
      fee = ethers.utils.parseUnits("0", "ether");
    });

    it("mints new token and sends amount to project creator", async function () {
      const orderHash = ethers.utils.solidityKeccak256(
        [
          "address",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
          "address",
          "string",
          "string",
        ],
        [
          minter.address,
          0,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "",
          "P1",
        ]
      );

      const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));

      const projectOwnerBalance = await projectOwner.getBalance();
      expect(await projectContract.balanceOf(minter.address)).to.equal(0);
      await contract
        .connect(minter)
        .mint(
          [
            tokenAddress,
            amount,
            fee,
            projectContract.address,
            minter.address,
            "",
            "P1",
          ],
          sig,
          {
            value: amount,
          }
        );

      expect(await projectContract.ownerOf(1)).to.equal(minter.address);
      expect(await projectOwner.getBalance()).to.equal(
        projectOwnerBalance.add(amount)
      );
      expect(await projectContract.balanceOf(minter.address)).to.equal(1);
    });

    describe("when invalid verifier", function () {
      it("reverts", async function () {
        const hash = ethers.utils.solidityKeccak256(
          [
            "address",
            "uint256",
            "address",
            "uint256",
            "uint256",
            "address",
            "address",
            "string",
            "string",
          ],
          [
            minter.address,
            0,
            tokenAddress,
            amount,
            fee,
            projectContract.address,
            minter.address,
            "",
            "P1",
          ]
        );
        const sig = await addrs[10].signMessage(ethers.utils.arrayify(hash));

        await expect(
          contract
            .connect(minter)
            .mint(
              [
                tokenAddress,
                amount,
                fee,
                projectContract.address,
                minter.address,
                "",
                "P1",
              ],
              sig,
              { value: amount }
            )
        ).to.be.revertedWith("");
      });
    });

    describe("when tx value less than amount", function () {
      it("reverts", async function () {
        const hash = ethers.utils.solidityKeccak256(
          [
            "address",
            "uint256",
            "address",
            "uint256",
            "uint256",
            "address",
            "address",
            "string",
            "string",
          ],
          [
            minter.address,
            0,
            tokenAddress,
            amount,
            fee,
            projectContract.address,
            minter.address,
            "",
            "P1",
          ]
        );
        const sig = await owner.signMessage(ethers.utils.arrayify(hash));

        await expect(
          contract
            .connect(minter)
            .mint(
              [
                tokenAddress,
                amount,
                fee,
                projectContract.address,
                minter.address,
                "",
                "P1",
              ],
              sig,
              { value: ethers.utils.parseUnits("0.74", "ether") }
            )
        ).to.be.revertedWith("");
      });
    });

    describe("when token is ERC20", function () {
      let tokenOwner;
      let tokenContract;

      beforeEach(async function () {
        tokenOwner = addrs[15];
        const contractFactory = await ethers.getContractFactory(
          "ERC20Sample",
          tokenOwner
        );

        tokenContract = await contractFactory.deploy();
        await tokenContract.initialize(
          "ERC20 Sample",
          "ERC20Sample",
          ethers.utils.parseUnits("100", "ether"),
          tokenOwner.address
        );
        tokenAddress = tokenContract.address;

        await tokenContract.transfer(
          minter.address,
          ethers.utils.parseUnits("50", "ether")
        );
        await tokenContract.connect(minter).approve(contract.address, amount);
      });

      it("mints new nft and sends token amount to project creator", async function () {
        const hash = ethers.utils.solidityKeccak256(
          [
            "address",
            "uint256",
            "address",
            "uint256",
            "uint256",
            "address",
            "address",
            "string",
            "string",
          ],
          [
            minter.address,
            0,
            tokenAddress,
            amount,
            fee,
            projectContract.address,
            minter.address,
            "",
            "P1",
          ]
        );
        const sig = await owner.signMessage(ethers.utils.arrayify(hash));

        const minterBalance = await tokenContract.balanceOf(minter.address);
        const projectOwnerBalance = await tokenContract.balanceOf(
          projectOwner.address
        );
        await contract
          .connect(minter)
          .mint(
            [
              tokenAddress,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "",
              "P1",
            ],
            sig
          );

        expect(await projectContract.ownerOf(1)).to.equal(minter.address);
        expect(await tokenContract.balanceOf(minter.address)).to.equal(
          minterBalance.sub(amount)
        );
        expect(await tokenContract.balanceOf(projectOwner.address)).to.equal(
          projectOwnerBalance.add(amount)
        );
      });

      describe("when token is not ERC20", function () {
        it("reverts", async function () {
          const hash = ethers.utils.solidityKeccak256(
            [
              "address",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
              "address",
              "string",
              "string",
            ],
            [
              minter.address,
              0,
              addrs[6].address,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "",
              "P1",
            ]
          );
          const sig = await owner.signMessage(ethers.utils.arrayify(hash));

          await expect(
            contract
              .connect(minter)
              .mint(
                [
                  addrs[6].address,
                  amount,
                  fee,
                  projectContract.address,
                  minter.address,
                  "",
                  "P1",
                ],
                sig
              )
          ).to.be.revertedWith("Address: call to non-contract");
        });
      });

      describe("when minter approve spending less than amount", function () {
        it("reverts", async function () {
          await tokenContract
            .connect(minter)
            .approve(
              contract.address,
              ethers.utils.parseUnits("0.74", "ether")
            );

          const hash = ethers.utils.solidityKeccak256(
            [
              "address",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
              "address",
              "string",
              "string",
            ],
            [
              minter.address,
              0,
              tokenAddress,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "",
              "P1",
            ]
          );
          const sig = await owner.signMessage(ethers.utils.arrayify(hash));

          await expect(
            contract
              .connect(minter)
              .mint(
                [
                  tokenAddress,
                  amount,
                  fee,
                  projectContract.address,
                  minter.address,
                  "",
                  "P1",
                ],
                sig
              )
          ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
      });
    });
  });
});
