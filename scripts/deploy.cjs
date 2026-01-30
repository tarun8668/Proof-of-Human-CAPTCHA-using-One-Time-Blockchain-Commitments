const hre = require("hardhat");

async function main() {
  console.log("Deploying HumanCommitment contract...");

  const HumanCommitment = await hre.ethers.getContractFactory("HumanCommitment");
  const contract = await HumanCommitment.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("HumanCommitment deployed to:", address);
  console.log("Please update services/contractService.ts with this address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
