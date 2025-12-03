// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 token used for DAO governance voting rights
 */
contract GovernanceToken is ERC20, Ownable {
    // Maximum supply cap
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    
    // Mapping to track token locks for voting
    mapping(address => uint256) public lockedTokens;
    
    event TokensLocked(address indexed user, uint256 amount);
    event TokensUnlocked(address indexed user, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("DAO Governance Token", "DGOV") Ownable(msg.sender) {
        // Mint initial supply to contract deployer
        _mint(msg.sender, 100000000 * 10**18); // 100 million initial supply
    }
    
    /**
     * @dev Mint new tokens (only owner can mint)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Lock tokens for voting purposes
     * @param amount Amount of tokens to lock
     */
    function lockTokens(uint256 amount) external {
        require(balanceOf(msg.sender) - lockedTokens[msg.sender] >= amount, "Insufficient unlocked balance");
        lockedTokens[msg.sender] += amount;
        emit TokensLocked(msg.sender, amount);
    }
    
    /**
     * @dev Unlock tokens after voting
     * @param amount Amount of tokens to unlock
     */
    function unlockTokens(uint256 amount) external {
        require(lockedTokens[msg.sender] >= amount, "Insufficient locked tokens");
        lockedTokens[msg.sender] -= amount;
        emit TokensUnlocked(msg.sender, amount);
    }
    
    /**
     * @dev Get available (unlocked) balance for an address
     * @param account Address to check
     * @return Available balance
     */
    function availableBalance(address account) external view returns (uint256) {
        return balanceOf(account) - lockedTokens[account];
    }
    
    /**
     * @dev Override transfer to prevent transferring locked tokens
     */
    function _update(address from, address to, uint256 amount) internal virtual override {
        if (from != address(0)) { // Not minting
            require(balanceOf(from) - lockedTokens[from] >= amount, "Cannot transfer locked tokens");
        }
        super._update(from, to, amount);
    }
}
