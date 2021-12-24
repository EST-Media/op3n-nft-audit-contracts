const hre = require("hardhat");

async function main() {
  const contractClass = "NFTFactory";
  const contractFactory = await hre.ethers.getContractFactory(contractClass);

  const contract = await contractFactory.deploy();
  await contract.deployed();
  await contract.initialize();

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
