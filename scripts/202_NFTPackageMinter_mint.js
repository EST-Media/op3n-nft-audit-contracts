const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const contractClass = "NFTPackageMinter";
  const artifact = await hre.artifacts.readArtifact(contractClass);
  const contract = new hre.ethers.Contract(
    "0xC2063efc8403762f7B68417f629a7Ee524101582",
    artifact.abi,
    owner
  );

  const tx = await contract.mint(
    "0x36b60d5e27e6578c9eb86b2340dd528440631699",
    "0x6a86DDfCabe6789CCcd2673A080195b48ed7D8a5",
    "AVAX Package 1",
    ""
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
