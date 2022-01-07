const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();

  const contractClass = "NFTPackageMinter";
  const artifact = await hre.artifacts.readArtifact(contractClass);
  const contract = new hre.ethers.Contract(
    "0x5f66e92F0c4e391df0375FFb067839ACCB74a59d",
    artifact.abi,
    owner
  );

  const tx = await contract.setMinter(
    "0x6a86DDfCabe6789CCcd2673A080195b48ed7D8a5"
  );
  const receipt = await tx.wait();
  console.log(receipt);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
