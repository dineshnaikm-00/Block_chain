# DAO Content Moderation Smart Contracts

This directory contains the Solidity smart contracts for the Decentralized Autonomous Organization (DAO) content moderation platform.

## Contracts Overview

### 1. GovernanceToken.sol
ERC20 token contract for DAO governance rights.

**Features:**
- Standard ERC20 implementation with 1 billion max supply
- Token locking mechanism for active votes
- Prevents transfer of locked tokens
- Minting capability for token distribution

**Key Functions:**
- `mint(address to, uint256 amount)` - Mint new tokens (owner only)
- `lockTokens(uint256 amount)` - Lock tokens for voting
- `unlockTokens(uint256 amount)` - Unlock tokens after voting
- `availableBalance(address account)` - Get unlocked token balance

### 2. ReputationSystem.sol
Manages user reputation and voting power multipliers.

**Features:**
- Tracks voting accuracy and consistency
- Rewards users who vote with the majority
- Up to 2x voting power multiplier based on reputation
- Consecutive correct vote streak bonuses
- Linear scaling from 1x to 2x multiplier

**Key Functions:**
- `recordVote(address user, bool votedWithMajority)` - Update reputation after vote
- `getVotingMultiplier(address user)` - Get current multiplier (100-200 basis points)
- `getAccuracy(address user)` - Get voting accuracy percentage
- `getReputationDetails(address user)` - Get full reputation data

**Reputation Formula:**
- Base gain: 10 points for majority vote
- Consecutive bonus: +10 points per consecutive correct vote
- Penalty: -5 points for minority vote (resets streak)
- Max reputation: 1000 points = 2x multiplier

### 3. ContentModerationDAO.sol
Main DAO contract implementing quadratic voting for content moderation.

**Features:**
- Quadratic voting cost: votes² tokens
- Reputation-based voting power multipliers
- 7-day voting period per proposal
- 20% quorum requirement
- 50% approval threshold
- Automatic proposal execution
- Token locking during voting period

**Proposal Types:**
- `APPROVE` - Approve content for publication
- `REMOVE` - Remove existing content
- `POLICY` - Change moderation policies

**Key Functions:**
- `createProposal(...)` - Create new moderation proposal
- `vote(uint256 proposalId, bool approve, uint256 voteCount)` - Cast votes
- `executeProposal(uint256 proposalId)` - Execute proposal after deadline
- `calculateVoteCost(uint256 voteCount)` - Preview vote cost
- `calculateVotingPower(address voter, uint256 voteCount)` - Preview voting power

**Voting Mechanics:**
```
Token Cost = votes² × 10^18
Weighted Power = votes × (reputation_multiplier / 100)
```

Example:
- 5 votes with 1.5x multiplier = 25 tokens cost, 7.5 weighted voting power
- 10 votes with 2x multiplier = 100 tokens cost, 20 weighted voting power

## Deployment Order

1. Deploy `GovernanceToken.sol`
2. Deploy `ReputationSystem.sol`
3. Deploy `ContentModerationDAO.sol` with addresses from steps 1-2

## Environment Setup

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Hardhat Configuration (hardhat.config.js)
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

## Deployment Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying DAO Content Moderation Contracts...");

  // Deploy Governance Token
  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy();
  await governanceToken.waitForDeployment();
  const tokenAddress = await governanceToken.getAddress();
  console.log("GovernanceToken deployed to:", tokenAddress);

  // Deploy Reputation System
  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  const reputationAddress = await reputationSystem.getAddress();
  console.log("ReputationSystem deployed to:", reputationAddress);

  // Deploy DAO
  const ContentModerationDAO = await hre.ethers.getContractFactory("ContentModerationDAO");
  const dao = await ContentModerationDAO.deploy(tokenAddress, reputationAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("ContentModerationDAO deployed to:", daoAddress);

  // Transfer ownership of ReputationSystem to DAO
  const tx = await reputationSystem.transferOwnership(daoAddress);
  await tx.wait();
  console.log("ReputationSystem ownership transferred to DAO");

  // Distribute initial tokens
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDistributing initial tokens...");
  
  const distributionAmount = hre.ethers.parseEther("10000");
  const accounts = await hre.ethers.getSigners();
  
  for (let i = 1; i < Math.min(accounts.length, 10); i++) {
    const tx = await governanceToken.transfer(accounts[i].address, distributionAmount);
    await tx.wait();
    console.log(`Distributed 10,000 tokens to ${accounts[i].address}`);
  }

  console.log("\n✅ Deployment complete!");
  console.log("\nContract Addresses:");
  console.log("===================");
  console.log("GovernanceToken:", tokenAddress);
  console.log("ReputationSystem:", reputationAddress);
  console.log("ContentModerationDAO:", daoAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Testing

Create `test/DAO.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Content Moderation DAO", function () {
  let governanceToken, reputationSystem, dao;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy contracts
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy();

    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputationSystem = await ReputationSystem.deploy();

    const DAO = await ethers.getContractFactory("ContentModerationDAO");
    dao = await DAO.deploy(
      await governanceToken.getAddress(),
      await reputationSystem.getAddress()
    );

    // Transfer ownership
    await reputationSystem.transferOwnership(await dao.getAddress());

    // Distribute tokens
    const amount = ethers.parseEther("100000");
    await governanceToken.transfer(addr1.address, amount);
    await governanceToken.transfer(addr2.address, amount);
    await governanceToken.transfer(addr3.address, amount);
  });

  describe("Governance Token", function () {
    it("Should have correct initial supply", async function () {
      const expectedSupply = ethers.parseEther("100000000");
      expect(await governanceToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should lock and unlock tokens", async function () {
      const lockAmount = ethers.parseEther("1000");
      await governanceToken.connect(addr1).lockTokens(lockAmount);
      
      expect(await governanceToken.lockedTokens(addr1.address)).to.equal(lockAmount);
      
      await governanceToken.connect(addr1).unlockTokens(lockAmount);
      expect(await governanceToken.lockedTokens(addr1.address)).to.equal(0);
    });
  });

  describe("Reputation System", function () {
    it("Should start with base multiplier", async function () {
      const multiplier = await reputationSystem.getVotingMultiplier(addr1.address);
      expect(multiplier).to.equal(100); // 1x
    });

    it("Should increase reputation for majority votes", async function () {
      // Simulate DAO recording votes
      await reputationSystem.recordVote(addr1.address, true);
      
      const details = await reputationSystem.getReputationDetails(addr1.address);
      expect(details[0]).to.be.gt(0); // score > 0
      expect(details[4]).to.be.gt(100); // multiplier > 1x
    });
  });

  describe("DAO Proposals", function () {
    it("Should create proposal with sufficient tokens", async function () {
      await dao.connect(addr1).createProposal(
        0, // APPROVE
        "Test Proposal",
        "Test Description",
        "https://example.com/content",
        "image"
      );

      const proposal = await dao.getProposal(1);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.proposer).to.equal(addr1.address);
    });

    it("Should calculate quadratic vote cost correctly", async function () {
      const cost = await dao.calculateVoteCost(5);
      expect(cost).to.equal(ethers.parseEther("25")); // 5² = 25
    });

    it("Should allow voting on active proposal", async function () {
      await dao.connect(addr1).createProposal(
        0, "Test", "Description", "url", "image"
      );

      await dao.connect(addr2).vote(1, true, 3);
      
      const vote = await dao.getVote(1, addr2.address);
      expect(vote.hasVoted).to.be.true;
      expect(vote.approve).to.be.true;
      expect(vote.voteCount).to.equal(3);
    });
  });
});
```

## Usage Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet (e.g., Sepolia)
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Integration with Frontend

Update your frontend to interact with deployed contracts:

```javascript
import { ethers } from 'ethers';
import GovernanceTokenABI from './contracts/GovernanceToken.json';
import ContentModerationDAOABI from './contracts/ContentModerationDAO.json';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const tokenContract = new ethers.Contract(TOKEN_ADDRESS, GovernanceTokenABI.abi, signer);
const daoContract = new ethers.Contract(DAO_ADDRESS, ContentModerationDAOABI.abi, signer);

// Create proposal
const tx = await daoContract.createProposal(
  0, // APPROVE
  "Content Title",
  "Description",
  "https://...",
  "image"
);
await tx.wait();

// Vote on proposal
const voteTx = await daoContract.vote(proposalId, true, 5);
await voteTx.wait();
```

## Security Considerations

1. **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuard`
2. **Token Locking**: Prevents double voting and token manipulation
3. **Access Control**: Owner-only functions for critical operations
4. **Overflow Protection**: Solidity 0.8.x has built-in overflow checks
5. **Input Validation**: All functions validate inputs

## License

MIT License - See LICENSE file for details
