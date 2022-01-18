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
    const sigTypes = [
      "address",
      "uint256",
      "address",
      "uint256",
      "uint256",
      "address",
      "address",
      "string",
      "string",
    ];

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

    it("mints new token and sends amount to owner", async function () {
      const salt = new Date().getTime();
      const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
        minter.address,
        salt,
        tokenAddress,
        amount,
        fee,
        projectContract.address,
        minter.address,
        "P1",
        "",
      ]);

      const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));
      const ownerBalance = await owner.getBalance();
      expect(await projectContract.balanceOf(minter.address)).to.equal(0);
      await contract
        .connect(minter)
        .mint(
          [
            salt,
            tokenAddress,
            amount,
            fee,
            projectContract.address,
            minter.address,
            "P1",
            "",
          ],
          sig,
          {
            value: amount,
          }
        );

      expect(await projectContract.ownerOf(1)).to.equal(minter.address);
      expect(await owner.getBalance()).to.equal(ownerBalance.add(amount));
      expect(await projectContract.balanceOf(minter.address)).to.equal(1);
      const hashOrderToSign = await contract
        .connect(minter)
        .hashOrderToSign([
          salt,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);
      expect(await contract.finalized(hashOrderToSign)).to.eq(true);
    });

    describe("when projectRecipient set", function () {
      let projectRecipient;
      beforeEach(async function () {
        projectRecipient = addrs[5];
        await contract.setProjectRecipient(
          projectContract.address,
          projectRecipient.address
        );
      });

      it("sends amount to projectRecipient", async function () {
        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);

        const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));
        const projectRecipientBalance = await projectRecipient.getBalance();
        expect(await projectContract.balanceOf(minter.address)).to.equal(0);
        await contract
          .connect(minter)
          .mint(
            [
              salt,
              tokenAddress,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "P1",
              "",
            ],
            sig,
            {
              value: amount,
            }
          );

        expect(await projectContract.ownerOf(1)).to.equal(minter.address);
        expect(await projectRecipient.getBalance()).to.equal(
          projectRecipientBalance.add(amount)
        );
        expect(await projectContract.balanceOf(minter.address)).to.equal(1);
      });
    });

    describe("when has fee", function () {
      let projectRecipient;
      let feeRecipient;

      beforeEach(async function () {
        fee = ethers.utils.parseUnits("0.35", "ether");
        projectRecipient = addrs[5];
        await contract.setProjectRecipient(
          projectContract.address,
          projectRecipient.address
        );
        feeRecipient = addrs[4];
        await contract.setFeeRecipient(feeRecipient.address);
      });

      it("sends amount - fee to projectRecipient, fee to feeRecipient", async function () {
        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);

        const sig = await owner.signMessage(ethers.utils.arrayify(orderHash));
        const projectRecipientBalance = await projectRecipient.getBalance();
        const feeRecipientBalance = await feeRecipient.getBalance();
        expect(await projectContract.balanceOf(minter.address)).to.equal(0);
        await contract
          .connect(minter)
          .mint(
            [
              salt,
              tokenAddress,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "P1",
              "",
            ],
            sig,
            {
              value: amount,
            }
          );

        expect(await projectContract.ownerOf(1)).to.equal(minter.address);
        expect(await projectContract.balanceOf(minter.address)).to.equal(1);
        expect(await projectRecipient.getBalance()).to.equal(
          projectRecipientBalance.add(amount.sub(fee))
        );
        expect(await feeRecipient.getBalance()).to.equal(
          feeRecipientBalance.add(fee)
        );
        // expect(
        //   await ethers.getDefaultProvider().getBalance(contract.address)
        // ).to.equal(0);
      });
    });

    describe("when fee is greater than amount", function () {
      it("reverts 400", async function () {
        const salt = new Date().getTime();
        fee = ethers.utils.parseUnits("0.76", "ether");
        const hash = ethers.utils.solidityKeccak256(sigTypes, [
          salt,
          minter.address,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);
        const sig = await addrs[10].signMessage(ethers.utils.arrayify(hash));

        await expect(
          contract
            .connect(minter)
            .mint(
              [
                salt,
                tokenAddress,
                amount,
                fee,
                projectContract.address,
                minter.address,
                "P1",
                "",
              ],
              sig,
              { value: amount }
            )
        ).to.be.revertedWith("400");
      });
    });

    describe("when tx value less than amount and order token is zeroAddress", function () {
      it("reverts 400", async function () {
        const salt = new Date().getTime();
        const hash = ethers.utils.solidityKeccak256(sigTypes, [
          salt,
          minter.address,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "p1",
          "",
        ]);
        const sig = await owner.signMessage(ethers.utils.arrayify(hash));

        await expect(
          contract
            .connect(minter)
            .mint(
              [
                salt,
                tokenAddress,
                amount,
                fee,
                projectContract.address,
                minter.address,
                "P1",
                "",
              ],
              sig,
              { value: ethers.utils.parseUnits("0.74", "ether") }
            )
        ).to.be.revertedWith("400");
      });
    });

    describe("when invalid verifier", function () {
      it("reverts 401", async function () {
        const salt = new Date().getTime();
        const hash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);
        const sig = await addrs[10].signMessage(ethers.utils.arrayify(hash));

        await expect(
          contract
            .connect(minter)
            .mint(
              [
                salt,
                tokenAddress,
                amount,
                fee,
                projectContract.address,
                minter.address,
                "P1",
                "",
              ],
              sig,
              { value: amount }
            )
        ).to.be.revertedWith("401");
      });
    });

    describe("when sig was used", function () {
      it("reverts 403", async function () {
        const salt = new Date().getTime();
        const hash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);
        const sig = await owner.signMessage(ethers.utils.arrayify(hash));
        await contract
          .connect(minter)
          .mint(
            [
              salt,
              tokenAddress,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "P1",
              "",
            ],
            sig,
            { value: amount }
          );

        await expect(
          contract
            .connect(minter)
            .mint(
              [
                salt,
                tokenAddress,
                amount,
                fee,
                projectContract.address,
                minter.address,
                "P1",
                "",
              ],
              sig,
              { value: amount }
            )
        ).to.be.revertedWith("403");
      });
    });

    describe("when minter does not have enough amount", function () {
      it("throw exception", async function () {
        const salt = new Date().getTime();
        const hash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);
        const sig = await owner.signMessage(ethers.utils.arrayify(hash));
        await minter.sendTransaction({
          to: addrs[11].address,
          value: (
            await minter.getBalance()
          ).sub(ethers.utils.parseUnits("0.63", "ether")),
        });

        try {
          await contract
            .connect(minter)
            .mint(
              [
                salt,
                tokenAddress,
                amount,
                fee,
                projectContract.address,
                minter.address,
                "P1",
                "",
              ],
              sig,
              { value: amount }
            );
        } catch (error) {
          expect(error.message).to.include("sender doesn\'t have enough funds to send tx");
        }
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

      it("mints new nft and sends token amount to projectRecipient", async function () {
        const salt = new Date().getTime();
        const hash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
          tokenAddress,
          amount,
          fee,
          projectContract.address,
          minter.address,
          "P1",
          "",
        ]);
        const sig = await owner.signMessage(ethers.utils.arrayify(hash));

        const minterBalance = await tokenContract.balanceOf(minter.address);
        const ownerBalance = await tokenContract.balanceOf(owner.address);
        await contract
          .connect(minter)
          .mint(
            [
              salt,
              tokenAddress,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "P1",
              "",
            ],
            sig
          );

        expect(await projectContract.ownerOf(1)).to.equal(minter.address);
        expect(await tokenContract.balanceOf(minter.address)).to.equal(
          minterBalance.sub(amount)
        );
        expect(await tokenContract.balanceOf(owner.address)).to.equal(
          ownerBalance.add(amount)
        );
      });

      describe("when allowance amount is not enough", function () {
        it("reverts ERC20", async function () {
          await tokenContract
            .connect(minter)
            .approve(
              contract.address,
              amount.sub(ethers.utils.parseUnits("0.3", "ether"))
            );

          const salt = new Date().getTime();
          const hash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
            tokenAddress,
            amount,
            fee,
            projectContract.address,
            minter.address,
            "P1",
            "",
          ]);
          const sig = await owner.signMessage(ethers.utils.arrayify(hash));
          const hashOrderToSign = await contract
            .connect(minter)
            .hashOrderToSign([
              salt,
              tokenAddress,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "P1",
              "",
            ]);

          expect(await contract.finalized(hashOrderToSign)).to.eq(false);
          await expect(
            contract
              .connect(minter)
              .mint(
                [
                  salt,
                  tokenAddress,
                  amount,
                  fee,
                  projectContract.address,
                  minter.address,
                  "P1",
                  "",
                ],
                sig
              )
          ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
      });

      describe("when token is not ERC20", function () {
        it("reverts SafeERC20: low-level call failed", async function () {
          const salt = new Date().getTime();
          const hash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
            contract.address,
            amount,
            fee,
            projectContract.address,
            minter.address,
            "P1",
            "",
          ]);
          const sig = await owner.signMessage(ethers.utils.arrayify(hash));

          await expect(
            contract
              .connect(minter)
              .mint(
                [
                  salt,
                  contract.address,
                  amount,
                  fee,
                  projectContract.address,
                  minter.address,
                  "P1",
                  "",
                ],
                sig
              )
          ).to.be.revertedWith("SafeERC20: low-level call failed");
        });

        describe("when tokenAdress is non-contract", function () {
          it("reverts Address: call to non-contract", async function () {
            const salt = new Date().getTime();
            const hash = ethers.utils.solidityKeccak256(sigTypes, [
              minter.address,
              salt,
              addrs[6].address,
              amount,
              fee,
              projectContract.address,
              minter.address,
              "P1",
              "",
            ]);
            const sig = await owner.signMessage(ethers.utils.arrayify(hash));

            await expect(
              contract
                .connect(minter)
                .mint(
                  [
                    salt,
                    addrs[6].address,
                    amount,
                    fee,
                    projectContract.address,
                    minter.address,
                    "P1",
                    "",
                  ],
                  sig
                )
            ).to.be.revertedWith("Address: call to non-contract");
          });
        });
      });
    });
  });
});
