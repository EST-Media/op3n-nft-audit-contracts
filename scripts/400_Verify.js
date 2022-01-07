const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const tokenContractFactory = await hre.ethers.getContractFactory(
    "NFTPackage"
  );
  const initArgs = ["Testing", "TestingFuij", owner.address];
  const data = tokenContractFactory.interface.encodeFunctionData(
    "initialize",
    initArgs
  );

  const proxy = "0xe27a504a4395bfa155c3aff3ed88a563f101d7a0";
  const beacon = "0x773a2c4e4361d685AAf29940191f61C6E70943B5";
  console.log("hh verify", proxy, beacon, data, "--network", hre.network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
