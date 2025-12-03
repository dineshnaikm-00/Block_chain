const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO Content Moderation System", function () {
  let governanceToken, reputationSystem, dao;
  let owner, addr1, addr2, addr3, addr4, addr5;

  const TOKENS_1000 = ethers.parseEther("1000");
  const TOKENS_10000 = ethers.parseEther("10000");
  const TOKENS_100000 = ethers.parseEther("100000");

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    // Deploy GovernanceToken
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();

    // Deploy ReputationSystem
    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputationSystem = await ReputationSystem.deploy();
    await reputationSystem.waitForDeployment();

    // Deploy DAO
    const DAO = await ethers.getContractFactory("ContentModerationDAO");
    dao = await DAO.deploy(
      await governanceToken.getAddress(),
      await reputationSystem.getAddress()
    );
    await dao.waitForDeployment();

    // Transfer ReputationSystem ownership to DAO
    await reputationSystem.transferOwnership(await dao.getAddress());

    // Distribute tokens to test accounts
    await governanceToken.transfer(addr1.address, TOKENS_100000);
    await governanceToken.transfer(addr2.address, TOKENS_100000);
    await governanceToken.transfer(addr3.address, TOKENS_100000);
    await governanceToken.transfer(addr4.address, TOKENS_100000);
    await governanceToken.transfer(addr5.address, TOKENS_100000);
  });

  describe("GovernanceToken", function () {
    it("Should deploy with correct initial supply", async function () {
      const expectedSupply = ethers.parseEther("100000000"); // 100 million
      expect(await governanceToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should have correct token details", async function () {
      expect(await governanceToken.name()).to.equal("DAO Governance Token");
      expect(await governanceToken.symbol()).to.equal("DGOV");
      expect(await governanceToken.decimals()).to.equal(18);
    });

    it("Should mint new tokens when called by owner", async function () {
      const mintAmount = TOKENS_10000;
      await governanceToken.mint(addr1.address, mintAmount);
      
      const balance = await governanceToken.balanceOf(addr1.address);
      expect(balance).to.equal(TOKENS_100000 + mintAmount);
    });

    it("Should not exceed max supply", async function () {
      const maxSupply = await governanceToken.MAX_SUPPLY();
      const currentSupply = await governanceToken.totalSupply();
      const exceedingAmount = maxSupply - currentSupply + ethers.parseEther("1");

      await expect(
        governanceToken.mint(addr1.address, exceedingAmount)
      ).to.be.revertedWith("Exceeds max supply");
    });

    it("Should lock and unlock tokens correctly", async function () {
      const lockAmount = TOKENS_10000;
      
      await governanceToken.connect(addr1).lockTokens(lockAmount);
      expect(await governanceToken.lockedTokens(addr1.address)).to.equal(lockAmount);
      
      await governanceToken.connect(addr1).unlockTokens(lockAmount);
      expect(await governanceToken.lockedTokens(addr1.address)).to.equal(0);
    });

    it("Should not allow locking more tokens than balance", async function () {
      const balance = await governanceToken.balanceOf(addr1.address);
      const excessAmount = balance + ethers.parseEther("1");

      await expect(
        governanceToken.connect(addr1).lockTokens(excessAmount)
      ).to.be.revertedWith("Insufficient unlocked balance");
    });

    it("Should prevent transfer of locked tokens", async function () {
      const lockAmount = TOKENS_10000;
      await governanceToken.connect(addr1).lockTokens(lockAmount);

      const balance = await governanceToken.balanceOf(addr1.address);
      
      await expect(
        governanceToken.connect(addr1).transfer(addr2.address, balance)
      ).to.be.revertedWith("Cannot transfer locked tokens");
    });

    it("Should return correct available balance", async function () {
      const lockAmount = TOKENS_10000;
      const initialBalance = await governanceToken.balanceOf(addr1.address);
      
      await governanceToken.connect(addr1).lockTokens(lockAmount);
      
      const availableBalance = await governanceToken.availableBalance(addr1.address);
      expect(availableBalance).to.equal(initialBalance - lockAmount);
    });
  });

  describe("ReputationSystem", function () {
    it("Should start with base multiplier of 100 (1x)", async function () {
      const multiplier = await reputationSystem.getVotingMultiplier(addr1.address);
      expect(multiplier).to.equal(100);
    });

    it("Should increase reputation for majority votes", async function () {
      await reputationSystem.recordVote(addr1.address, true);
      
      const details = await reputationSystem.getReputationDetails(addr1.address);
      expect(details[0]).to.be.gt(0); // score > 0
      expect(details[1]).to.equal(1);  // totalVotes = 1
      expect(details[2]).to.equal(1);  // majorityVotes = 1
    });

    it("Should decrease reputation for minority votes", async function () {
      // First vote with majority to gain reputation
      await reputationSystem.recordVote(addr1.address, true);
      const scoreBefore = (await reputationSystem.getReputationDetails(addr1.address))[0];
      
      // Then vote against majority
      await reputationSystem.recordVote(addr1.address, false);
      const scoreAfter = (await reputationSystem.getReputationDetails(addr1.address))[0];
      
      expect(scoreAfter).to.be.lt(scoreBefore);
    });

    it("Should track consecutive correct votes", async function () {
      await reputationSystem.recordVote(addr1.address, true);
      await reputationSystem.recordVote(addr1.address, true);
      await reputationSystem.recordVote(addr1.address, true);
      
      const details = await reputationSystem.getReputationDetails(addr1.address);
      expect(details[3]).to.equal(3); // consecutiveCorrect = 3
    });

    it("Should reset consecutive streak on minority vote", async function () {
      await reputationSystem.recordVote(addr1.address, true);
      await reputationSystem.recordVote(addr1.address, true);
      await reputationSystem.recordVote(addr1.address, false); // Break streak
      
      const details = await reputationSystem.getReputationDetails(addr1.address);
      expect(details[3]).to.equal(0); // consecutiveCorrect reset to 0
    });

    it("Should calculate multiplier correctly", async function () {
      // Simulate multiple majority votes to build reputation
      for (let i = 0; i < 10; i++) {
        await reputationSystem.recordVote(addr1.address, true);
      }
      
      const multiplier = await reputationSystem.getVotingMultiplier(addr1.address);
      expect(multiplier).to.be.gt(100); // Should be > 1x
      expect(multiplier).to.be.lte(200); // Should be <= 2x
    });

    it("Should not exceed max multiplier of 200 (2x)", async function () {
      // Max out reputation
      for (let i = 0; i < 50; i++) {
        await reputationSystem.recordVote(addr1.address, true);
      }
      
      const multiplier = await reputationSystem.getVotingMultiplier(addr1.address);
      expect(multiplier).to.equal(200);
    });

    it("Should calculate accuracy correctly", async function () {
      await reputationSystem.recordVote(addr1.address, true);
      await reputationSystem.recordVote(addr1.address, true);
      await reputationSystem.recordVote(addr1.address, false);
      await reputationSystem.recordVote(addr1.address, false);
      
      const accuracy = await reputationSystem.getAccuracy(addr1.address);
      expect(accuracy).to.equal(50); // 2/4 = 50%
    });
  });

  describe("ContentModerationDAO - Proposal Creation", function () {
    it("Should create proposal with sufficient tokens", async function () {
      await dao.connect(addr1).createProposal(
        0, // APPROVE
        "Test Content Approval",
        "This is a test proposal for content approval",
        "https://example.com/image.jpg",
        "image"
      );

      const proposal = await dao.getProposal(1);
      expect(proposal.title).to.equal("Test Content Approval");
      expect(proposal.proposer).to.equal(addr1.address);
      expect(proposal.status).to.equal(0); // Active
    });

    it("Should not allow proposal creation without sufficient tokens", async function () {
      // Create new account with insufficient tokens
      const [newAccount] = await ethers.getSigners();
      
      await expect(
        dao.connect(newAccount).createProposal(
          0, "Test", "Description", "url", "image"
        )
      ).to.be.revertedWith("Insufficient tokens to create proposal");
    });

    it("Should increment proposal count", async function () {
      await dao.connect(addr1).createProposal(0, "Test 1", "Desc", "url", "image");
      await dao.connect(addr2).createProposal(1, "Test 2", "Desc", "url", "video");
      
      expect(await dao.proposalCount()).to.equal(2);
    });

    it("Should set correct voting deadline", async function () {
      const tx = await dao.connect(addr1).createProposal(
        0, "Test", "Description", "url", "image"
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const proposal = await dao.getProposal(1);
      const expectedDeadline = block.timestamp + (7 * 24 * 60 * 60); // 7 days
      
      expect(proposal.votingDeadline).to.equal(expectedDeadline);
    });
  });

  describe("ContentModerationDAO - Voting", function () {
    beforeEach(async function () {
      // Create a test proposal
      await dao.connect(addr1).createProposal(
        0, "Test Proposal", "Test Description", "https://test.com", "image"
      );
    });

    it("Should calculate quadratic vote cost correctly", async function () {
      expect(await dao.calculateVoteCost(1)).to.equal(ethers.parseEther("1"));   // 1²
      expect(await dao.calculateVoteCost(5)).to.equal(ethers.parseEther("25"));  // 5²
      expect(await dao.calculateVoteCost(10)).to.equal(ethers.parseEther("100")); // 10²
    });

    it("Should allow voting on active proposal", async function () {
      await dao.connect(addr2).vote(1, true, 5);
      
      const vote = await dao.getVote(1, addr2.address);
      expect(vote.hasVoted).to.be.true;
      expect(vote.approve).to.be.true;
      expect(vote.voteCount).to.equal(5);
    });

    it("Should lock tokens when voting", async function () {
      const voteCount = 5;
      const expectedCost = ethers.parseEther("25"); // 5²
      
      await dao.connect(addr2).vote(1, true, voteCount);
      
      const lockedTokens = await governanceToken.lockedTokens(addr2.address);
      expect(lockedTokens).to.equal(expectedCost);
    });

    it("Should apply reputation multiplier to votes", async function () {
      // Give addr2 some reputation
      for (let i = 0; i < 5; i++) {
        await reputationSystem.recordVote(addr2.address, true);
      }
      
      const multiplier = await reputationSystem.getVotingMultiplier(addr2.address);
      const voteCount = 10;
      
      await dao.connect(addr2).vote(1, true, voteCount);
      
      const vote = await dao.getVote(1, addr2.address);
      const expectedPower = (voteCount * multiplier) / 100n;
      expect(vote.weightedPower).to.equal(expectedPower);
    });

    it("Should not allow voting twice", async function () {
      await dao.connect(addr2).vote(1, true, 5);
      
      await expect(
        dao.connect(addr2).vote(1, false, 3)
      ).to.be.revertedWith("Already voted");
    });

    it("Should not allow voting without sufficient tokens", async function () {
      const voteCount = 1000; // Would cost 1,000,000 tokens
      
      await expect(
        dao.connect(addr2).vote(1, true, voteCount)
      ).to.be.revertedWith("Insufficient tokens for vote cost");
    });

    it("Should not allow voting after deadline", async function () {
      // Fast forward past voting deadline
      await time.increase(8 * 24 * 60 * 60); // 8 days
      
      await expect(
        dao.connect(addr2).vote(1, true, 5)
      ).to.be.revertedWith("Voting period ended");
    });

    it("Should track multiple voters", async function () {
      await dao.connect(addr2).vote(1, true, 5);
      await dao.connect(addr3).vote(1, false, 3);
      await dao.connect(addr4).vote(1, true, 7);
      
      const voters = await dao.getVoters(1);
      expect(voters.length).to.equal(3);
      expect(voters).to.include(addr2.address);
      expect(voters).to.include(addr3.address);
      expect(voters).to.include(addr4.address);
    });
  });

  describe("ContentModerationDAO - Proposal Execution", function () {
    beforeEach(async function () {
      // Create a test proposal
      await dao.connect(addr1).createProposal(
        0, "Test Proposal", "Test Description", "https://test.com", "image"
      );
    });

    it("Should not execute before deadline", async function () {
      await dao.connect(addr2).vote(1, true, 10);
      
      await expect(
        dao.executeProposal(1)
      ).to.be.revertedWith("Voting period not ended");
    });

    it("Should execute approved proposal with quorum", async function () {
      // Get enough votes to meet quorum and approval
      await dao.connect(addr2).vote(1, true, 100);
      await dao.connect(addr3).vote(1, true, 100);
      await dao.connect(addr4).vote(1, true, 100);
      
      // Fast forward past deadline
      await time.increase(8 * 24 * 60 * 60);
      
      await dao.executeProposal(1);
      
      const proposal = await dao.getProposal(1);
      expect(proposal.executed).to.be.true;
      expect(proposal.status).to.equal(1); // Executed
    });

    it("Should reject proposal with majority against", async function () {
      await dao.connect(addr2).vote(1, true, 50);
      await dao.connect(addr3).vote(1, false, 100);
      await dao.connect(addr4).vote(1, false, 100);
      
      await time.increase(8 * 24 * 60 * 60);
      await dao.executeProposal(1);
      
      const proposal = await dao.getProposal(1);
      expect(proposal.status).to.equal(2); // Rejected
    });

    it("Should mark as expired if quorum not met", async function () {
      await dao.connect(addr2).vote(1, true, 1); // Very small vote
      
      await time.increase(8 * 24 * 60 * 60);
      await dao.executeProposal(1);
      
      const proposal = await dao.getProposal(1);
      expect(proposal.status).to.equal(3); // Expired
    });

    it("Should unlock tokens after execution", async function () {
      await dao.connect(addr2).vote(1, true, 10);
      
      const lockedBefore = await governanceToken.lockedTokens(addr2.address);
      expect(lockedBefore).to.be.gt(0);
      
      await time.increase(8 * 24 * 60 * 60);
      await dao.executeProposal(1);
      
      const lockedAfter = await governanceToken.lockedTokens(addr2.address);
      expect(lockedAfter).to.equal(0);
    });

    it("Should update voter reputation after execution", async function () {
      await dao.connect(addr2).vote(1, true, 100);
      await dao.connect(addr3).vote(1, false, 50);
      
      const repBefore = await reputationSystem.getScore(addr2.address);
      
      await time.increase(8 * 24 * 60 * 60);
      await dao.executeProposal(1);
      
      const repAfter = await reputationSystem.getScore(addr2.address);
      expect(repAfter).to.be.gt(repBefore);
    });

    it("Should not execute twice", async function () {
      await dao.connect(addr2).vote(1, true, 100);
      
      await time.increase(8 * 24 * 60 * 60);
      await dao.executeProposal(1);
      
      await expect(
        dao.executeProposal(1)
      ).to.be.revertedWith("Proposal already executed");
    });
  });

  describe("ContentModerationDAO - Edge Cases", function () {
    it("Should handle proposal with zero votes", async function () {
      await dao.connect(addr1).createProposal(
        0, "Test", "Description", "url", "image"
      );
      
      await time.increase(8 * 24 * 60 * 60);
      await dao.executeProposal(1);
      
      const proposal = await dao.getProposal(1);
      expect(proposal.status).to.equal(3); // Expired due to no quorum
    });

    it("Should handle exact 50/50 vote split", async function () {
      await dao.connect(addr1).createProposal(
        0, "Test", "Description", "url", "image"
      );
      
      await dao.connect(addr2).vote(1, true, 100);
      await dao.connect(addr3).vote(1, false, 100);
      
      await time.increase(8 * 24 * 60 * 60);
      await dao.executeProposal(1);
      
      const proposal = await dao.getProposal(1);
      // With 50%, it should meet threshold
      expect(proposal.status).to.equal(1); // Executed
    });

    it("Should handle maximum vote count correctly", async function () {
      const maxVotes = 316; // sqrt(100000) approximately
      const cost = await dao.calculateVoteCost(maxVotes);
      
      expect(cost).to.be.lte(TOKENS_100000);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete proposal lifecycle", async function () {
      // 1. Create proposal
      await dao.connect(addr1).createProposal(
        1, "Remove Inappropriate Content", "This content violates community guidelines", 
        "https://example.com/content", "video"
      );
      
      // 2. Multiple users vote
      await dao.connect(addr2).vote(1, true, 10);
      await dao.connect(addr3).vote(1, true, 15);
      await dao.connect(addr4).vote(1, false, 5);
      
      // 3. Wait for voting period
      await time.increase(8 * 24 * 60 * 60);
      
      // 4. Execute proposal
      await dao.executeProposal(1);
      
      // 5. Verify final state
      const proposal = await dao.getProposal(1);
      expect(proposal.executed).to.be.true;
      
      // 6. Verify tokens unlocked
      expect(await governanceToken.lockedTokens(addr2.address)).to.equal(0);
      expect(await governanceToken.lockedTokens(addr3.address)).to.equal(0);
      expect(await governanceToken.lockedTokens(addr4.address)).to.equal(0);
      
      // 7. Verify reputation updated
      const rep2 = await reputationSystem.getScore(addr2.address);
      expect(rep2).to.be.gt(0);
    });

    it("Should handle multiple concurrent proposals", async function () {
      // Create multiple proposals
      await dao.connect(addr1).createProposal(0, "Proposal 1", "Desc 1", "url1", "image");
      await dao.connect(addr2).createProposal(1, "Proposal 2", "Desc 2", "url2", "video");
      await dao.connect(addr3).createProposal(2, "Proposal 3", "Desc 3", "url3", "text");
      
      expect(await dao.proposalCount()).to.equal(3);
      
      // Different users can vote on different proposals
      await dao.connect(addr4).vote(1, true, 5);
      await dao.connect(addr4).vote(2, false, 3);
      // addr4 cannot vote on proposal 1 and 2 again, but can vote on 3
      await dao.connect(addr4).vote(3, true, 7);
      
      const vote1 = await dao.getVote(1, addr4.address);
      const vote2 = await dao.getVote(2, addr4.address);
      const vote3 = await dao.getVote(3, addr4.address);
      
      expect(vote1.hasVoted).to.be.true;
      expect(vote2.hasVoted).to.be.true;
      expect(vote3.hasVoted).to.be.true;
    });
  });
});
