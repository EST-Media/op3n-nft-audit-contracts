const hre = require("hardhat");

async function main() {
  const contractClass = "NFTPackageTrade";
  const contractFactory = await hre.ethers.getContractFactory(contractClass);

  const contract = await contractFactory.deploy();
  await contract.deployed();
  const [owner] = await hre.ethers.getSigners();
  await contract.initialize(owner.address);

  console.log(contractClass, contract.address);
  console.log("-----------------Verify Contract-----------------");
  console.log(
    "hh verify",
    contract.address,
    "--contract contracts/" +
      contractClass +
      ".sol:" +
      contractClass +
      " --network",
    hre.network.name
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
