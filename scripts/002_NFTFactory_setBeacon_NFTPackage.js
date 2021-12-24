const hre = require("hardhat");

if (!process.env.NFTFACTORY) {
  console.error("Please set NFTFACTORY");
  process.exit(0);
}

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const contractClass = "NFTFactory";
  const artifact = await hre.artifacts.readArtifact(contractClass);
  const contract = new hre.ethers.Contract(
    process.env.NFTFACTORY,
    artifact.abi,
    owner
  );

  let tokenContractFactory = null;
  let tokenContract = null;
  let tx = null;

  tokenContractFactory = await hre.ethers.getContractFactory("NFTPackage");
  tokenContract = await tokenContractFactory.deploy();
  await tokenContract.deployTransaction.wait();
  tx = await contract.setBeacon(
    "NFTPackage",
    tokenContract.address,
    owner.address
  );
  await tx.wait();
  console.log(
    "hh verify",
    tokenContract.address,
    "--contract contracts/NFTPackage.sol:NFTPackage",
    "--network",
    hre.network.name
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
