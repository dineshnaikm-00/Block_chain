// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationSystem
 * @dev Manages user reputation scores and voting power multipliers
 * Users who consistently vote with the majority earn reputation
 * Reputation grants up to 2x voting power multiplier
 */
contract ReputationSystem is Ownable {
    struct UserReputation {
        uint256 score;              // Current reputation score
        uint256 totalVotes;         // Total number of votes cast
        uint256 majorityVotes;      // Number of times voted with majority
        uint256 consecutiveCorrect; // Consecutive correct votes
        uint256 lastUpdateTime;     // Last time reputation was updated
    }
    
    // Mapping from user address to reputation data
    mapping(address => UserReputation) public reputations;
    
    // Reputation milestones for multiplier calculation
    uint256 public constant BASE_MULTIPLIER = 100; // 1.00x (in basis points)
    uint256 public constant MAX_MULTIPLIER = 200;  // 2.00x (in basis points)
    uint256 public constant REPUTATION_THRESHOLD = 1000; // Max reputation for 2x multiplier
    
    // Consecutive vote bonus
    uint256 public constant CONSECUTIVE_BONUS = 10; // Bonus per consecutive correct vote
    
    event ReputationUpdated(address indexed user, uint256 newScore, uint256 multiplier);
    event MajorityVoteRecorded(address indexed user, bool votedWithMajority);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Record a vote and update reputation based on whether it matched the majority
     * @param user Address of the voter
     * @param votedWithMajority Whether the user voted with the winning side
     */
    function recordVote(address user, bool votedWithMajority) external onlyOwner {
        UserReputation storage rep = reputations[user];
        
        rep.totalVotes++;
        
        if (votedWithMajority) {
            rep.majorityVotes++;
            rep.consecutiveCorrect++;
            
            // Award reputation: base points + consecutive bonus
            uint256 reputationGain = 10 + (rep.consecutiveCorrect * CONSECUTIVE_BONUS);
            rep.score += reputationGain;
            
            // Cap at max reputation
            if (rep.score > REPUTATION_THRESHOLD) {
                rep.score = REPUTATION_THRESHOLD;
            }
        } else {
            // Reset consecutive streak and slightly decrease reputation
            rep.consecutiveCorrect = 0;
            if (rep.score > 5) {
                rep.score -= 5;
            } else {
                rep.score = 0;
            }
        }
        
        rep.lastUpdateTime = block.timestamp;
        
        uint256 multiplier = getVotingMultiplier(user);
        emit ReputationUpdated(user, rep.score, multiplier);
        emit MajorityVoteRecorded(user, votedWithMajority);
    }
    
    /**
     * @dev Calculate voting power multiplier based on reputation
     * @param user Address to check
     * @return Multiplier in basis points (100 = 1x, 200 = 2x)
     */
    function getVotingMultiplier(address user) public view returns (uint256) {
        UserReputation memory rep = reputations[user];
        
        if (rep.score == 0) {
            return BASE_MULTIPLIER;
        }
        
        // Linear scaling from 1x to 2x based on reputation
        // Formula: 100 + (score / REPUTATION_THRESHOLD * 100)
        uint256 multiplier = BASE_MULTIPLIER + ((rep.score * 100) / REPUTATION_THRESHOLD);
        
        if (multiplier > MAX_MULTIPLIER) {
            multiplier = MAX_MULTIPLIER;
        }
        
        return multiplier;
    }
    
    /**
     * @dev Get user's accuracy percentage
     * @param user Address to check
     * @return Accuracy percentage (0-100)
     */
    function getAccuracy(address user) external view returns (uint256) {
        UserReputation memory rep = reputations[user];
        
        if (rep.totalVotes == 0) {
            return 0;
        }
        
        return (rep.majorityVotes * 100) / rep.totalVotes;
    }
    
    /**
     * @dev Get full reputation details for a user
     * @param user Address to check
     * @return score Current reputation score
     * @return totalVotes Total number of votes cast
     * @return majorityVotes Number of majority votes
     * @return consecutiveCorrect Current streak of correct votes
     * @return multiplier Current voting power multiplier
     */
    function getReputationDetails(address user) external view returns (
        uint256 score,
        uint256 totalVotes,
        uint256 majorityVotes,
        uint256 consecutiveCorrect,
        uint256 multiplier
    ) {
        UserReputation memory rep = reputations[user];
        return (
            rep.score,
            rep.totalVotes,
            rep.majorityVotes,
            rep.consecutiveCorrect,
            getVotingMultiplier(user)
        );
    }
    
    /**
     * @dev Get leaderboard data (called externally to sort)
     * @param user Address to check
     * @return Reputation score
     */
    function getScore(address user) external view returns (uint256) {
        return reputations[user].score;
    }
}
