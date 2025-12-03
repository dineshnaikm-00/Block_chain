/**
 * Deployment script for DAO Content Moderation Smart Contracts
 * 
 * This script deploys all three contracts in the correct order:
 * 1. GovernanceToken
 * 2. ReputationSystem
 * 3. ContentModerationDAO
 * 
 * It also performs initial setup including token distribution
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting DAO Content Moderation Deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // 1. Deploy Governance Token
  console.log("📝 Deploying GovernanceToken...");
  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy();
  await governanceToken.waitForDeployment();
  const tokenAddress = await governanceToken.getAddress();
  console.log("✅ GovernanceToken deployed to:", tokenAddress);

  // 2. Deploy Reputation System
  console.log("\n📝 Deploying ReputationSystem...");
  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  const reputationAddress = await reputationSystem.getAddress();
  console.log("✅ ReputationSystem deployed to:", reputationAddress);

  // 3. Deploy DAO
  console.log("\n📝 Deploying ContentModerationDAO...");
  const ContentModerationDAO = await hre.ethers.getContractFactory("ContentModerationDAO");
  const dao = await ContentModerationDAO.deploy(tokenAddress, reputationAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ ContentModerationDAO deployed to:", daoAddress);

  // 4. Setup: Transfer ReputationSystem ownership to DAO
  console.log("\n⚙️  Setting up contract permissions...");
  const transferTx = await reputationSystem.transferOwnership(daoAddress);
  await transferTx.wait();
  console.log("✅ ReputationSystem ownership transferred to DAO");

  // 5. Distribute initial tokens to test accounts
  console.log("\n💰 Distributing initial tokens...");
  const accounts = await hre.ethers.getSigners();
  const distributionAmount = hre.ethers.parseEther("10000"); // 10,000 tokens per account

  for (let i = 1; i < Math.min(accounts.length, 10); i++) {
    try {
      const tx = await governanceToken.transfer(accounts[i].address, distributionAmount);
      await tx.wait();
      console.log(`  ✓ Distributed 10,000 DGOV tokens to ${accounts[i].address}`);
    } catch (error) {
      console.log(`  ✗ Failed to distribute to ${accounts[i].address}`);
    }
  }

  // 6. Verify initial state
  console.log("\n🔍 Verifying deployment...");
  const totalSupply = await governanceToken.totalSupply();
  const deployerBalance = await governanceToken.balanceOf(deployer.address);
  const proposalCount = await dao.proposalCount();

  console.log("  Total token supply:", hre.ethers.formatEther(totalSupply), "DGOV");
  console.log("  Deployer balance:", hre.ethers.formatEther(deployerBalance), "DGOV");
  console.log("  Initial proposal count:", proposalCount.toString());

  // 7. Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   GovernanceToken:        ", tokenAddress);
  console.log("   ReputationSystem:       ", reputationAddress);
  console.log("   ContentModerationDAO:   ", daoAddress);
  
  console.log("\n📊 Network Information:");
  console.log("   Network:", hre.network.name);
  console.log("   Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());

  console.log("\n💡 Next Steps:");
  console.log("   1. Save the contract addresses above");
  console.log("   2. Update your frontend configuration with these addresses");
  console.log("   3. Import ABIs from artifacts/contracts/*.json");
  console.log("   4. Connect MetaMask to the network");
  console.log("   5. Start creating proposals and voting!");

  console.log("\n🔧 Useful Commands:");
  console.log("   Verify on Etherscan:");
  console.log("   npx hardhat verify --network <network> <address>");
  console.log("\n   Run tests:");
  console.log("   npx hardhat test");
  console.log("\n");

  // Return deployment info for potential scripting use
  return {
    governanceToken: tokenAddress,
    reputationSystem: reputationAddress,
    dao: daoAddress,
    deployer: deployer.address
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

module.exports = main;
