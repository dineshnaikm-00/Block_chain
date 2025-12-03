// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GovernanceToken.sol";
import "./ReputationSystem.sol";

/**
 * @title ContentModerationDAO
 * @dev Main DAO contract for content moderation with quadratic voting
 * Implements exponential vote costs (votes²) and reputation-based multipliers
 */
contract ContentModerationDAO is Ownable, ReentrancyGuard {
    GovernanceToken public governanceToken;
    ReputationSystem public reputationSystem;
    
    enum ProposalType { APPROVE, REMOVE, POLICY }
    enum ProposalStatus { Active, Executed, Rejected, Expired }
    
    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;
        string contentUrl;
        string contentType;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 approveVotes;      // Weighted votes for approval
        uint256 rejectVotes;       // Weighted votes for rejection
        ProposalStatus status;
        bool executed;
        mapping(address => Vote) votes;
        address[] voters;
    }
    
    struct Vote {
        bool hasVoted;
        bool approve;
        uint256 voteCount;         // Number of votes cast
        uint256 weightedPower;     // Actual voting power after multiplier
        uint256 tokensCost;        // Tokens spent for voting
    }
    
    // Proposal storage
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Voting parameters
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant QUORUM_PERCENTAGE = 20; // 20% of total supply needed
    uint256 public constant APPROVAL_THRESHOLD = 50; // 50% approval needed
    
    // Minimum tokens required to create a proposal
    uint256 public constant PROPOSAL_THRESHOLD = 1000 * 10**18; // 1000 tokens
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string title,
        uint256 deadline
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool approve,
        uint256 voteCount,
        uint256 weightedPower,
        uint256 tokensCost
    );
    
    event ProposalExecuted(uint256 indexed proposalId, bool approved);
    event ProposalExpired(uint256 indexed proposalId);
    
    constructor(
        address _governanceToken,
        address _reputationSystem
    ) Ownable(msg.sender) {
        governanceToken = GovernanceToken(_governanceToken);
        reputationSystem = ReputationSystem(_reputationSystem);
    }
    
    /**
     * @dev Create a new moderation proposal
     * @param proposalType Type of proposal (APPROVE, REMOVE, POLICY)
     * @param title Proposal title
     * @param description Detailed description
     * @param contentUrl URL or identifier of content
     * @param contentType Type of content (image, video, text, etc.)
     */
    function createProposal(
        ProposalType proposalType,
        string memory title,
        string memory description,
        string memory contentUrl,
        string memory contentType
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= PROPOSAL_THRESHOLD,
            "Insufficient tokens to create proposal"
        );
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.proposalType = proposalType;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.contentUrl = contentUrl;
        newProposal.contentType = contentType;
        newProposal.createdAt = block.timestamp;
        newProposal.votingDeadline = block.timestamp + VOTING_PERIOD;
        newProposal.status = ProposalStatus.Active;
        newProposal.executed = false;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            proposalType,
            title,
            newProposal.votingDeadline
        );
        
        return proposalId;
    }
    
    /**
     * @dev Cast votes on a proposal with quadratic cost
     * @param proposalId ID of the proposal
     * @param approve True to approve, false to reject
     * @param voteCount Number of votes to cast
     */
    function vote(
        uint256 proposalId,
        bool approve,
        uint256 voteCount
    ) external nonReentrant {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.votingDeadline, "Voting period ended");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");
        require(voteCount > 0, "Vote count must be positive");
        
        // Calculate quadratic cost: votes²
        uint256 tokensCost = voteCount * voteCount * 10**18;
        
        require(
            governanceToken.balanceOf(msg.sender) >= tokensCost,
            "Insufficient tokens for vote cost"
        );
        
        // Get reputation multiplier (100 = 1x, 200 = 2x)
        uint256 multiplier = reputationSystem.getVotingMultiplier(msg.sender);
        
        // Calculate weighted voting power
        uint256 weightedPower = (voteCount * multiplier) / 100;
        
        // Lock tokens for voting
        governanceToken.lockTokens(tokensCost);
        
        // Record the vote
        Vote storage userVote = proposal.votes[msg.sender];
        userVote.hasVoted = true;
        userVote.approve = approve;
        userVote.voteCount = voteCount;
        userVote.weightedPower = weightedPower;
        userVote.tokensCost = tokensCost;
        
        proposal.voters.push(msg.sender);
        
        // Add weighted power to appropriate tally
        if (approve) {
            proposal.approveVotes += weightedPower;
        } else {
            proposal.rejectVotes += weightedPower;
        }
        
        emit VoteCast(proposalId, msg.sender, approve, voteCount, weightedPower, tokensCost);
    }
    
    /**
     * @dev Execute a proposal after voting period ends
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.votingDeadline, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        
        // Calculate total votes
        uint256 totalVotes = proposal.approveVotes + proposal.rejectVotes;
        
        // Check quorum
        uint256 quorumRequired = (governanceToken.totalSupply() * QUORUM_PERCENTAGE) / 100;
        
        bool approved = false;
        
        if (totalVotes >= quorumRequired) {
            // Check if approval threshold met
            uint256 approvalPercentage = (proposal.approveVotes * 100) / totalVotes;
            approved = approvalPercentage >= APPROVAL_THRESHOLD;
            
            proposal.status = approved ? ProposalStatus.Executed : ProposalStatus.Rejected;
        } else {
            // Quorum not met
            proposal.status = ProposalStatus.Expired;
            emit ProposalExpired(proposalId);
        }
        
        proposal.executed = true;
        
        // Update reputation for all voters based on majority outcome
        bool majorityApproved = proposal.approveVotes > proposal.rejectVotes;
        
        for (uint256 i = 0; i < proposal.voters.length; i++) {
            address voter = proposal.voters[i];
            Vote storage userVote = proposal.votes[voter];
            
            // Unlock tokens
            governanceToken.unlockTokens(userVote.tokensCost);
            
            // Update reputation based on whether they voted with majority
            bool votedWithMajority = userVote.approve == majorityApproved;
            reputationSystem.recordVote(voter, votedWithMajority);
        }
        
        emit ProposalExecuted(proposalId, approved);
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        ProposalType proposalType,
        string memory title,
        string memory description,
        string memory contentUrl,
        string memory contentType,
        uint256 createdAt,
        uint256 votingDeadline,
        uint256 approveVotes,
        uint256 rejectVotes,
        ProposalStatus status,
        bool executed
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.id,
            proposal.proposer,
            proposal.proposalType,
            proposal.title,
            proposal.description,
            proposal.contentUrl,
            proposal.contentType,
            proposal.createdAt,
            proposal.votingDeadline,
            proposal.approveVotes,
            proposal.rejectVotes,
            proposal.status,
            proposal.executed
        );
    }
    
    /**
     * @dev Get vote details for a user on a proposal
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     */
    function getVote(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        bool approve,
        uint256 voteCount,
        uint256 weightedPower,
        uint256 tokensCost
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        Vote storage userVote = proposals[proposalId].votes[voter];
        
        return (
            userVote.hasVoted,
            userVote.approve,
            userVote.voteCount,
            userVote.weightedPower,
            userVote.tokensCost
        );
    }
    
    /**
     * @dev Get all voters for a proposal
     * @param proposalId ID of the proposal
     */
    function getVoters(uint256 proposalId) external view returns (address[] memory) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[proposalId].voters;
    }
    
    /**
     * @dev Calculate quadratic voting cost for given number of votes
     * @param voteCount Number of votes
     * @return Token cost
     */
    function calculateVoteCost(uint256 voteCount) external pure returns (uint256) {
        return voteCount * voteCount * 10**18;
    }
    
    /**
     * @dev Calculate effective voting power with reputation multiplier
     * @param voter Address of the voter
     * @param voteCount Number of votes
     * @return Weighted voting power
     */
    function calculateVotingPower(address voter, uint256 voteCount) external view returns (uint256) {
        uint256 multiplier = reputationSystem.getVotingMultiplier(voter);
        return (voteCount * multiplier) / 100;
    }
}
