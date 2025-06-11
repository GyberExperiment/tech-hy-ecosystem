// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title VGTokenVotes
 * @dev ERC20Votes wrapper для VGToken, используется для governance голосований
 * 
 * Пользователи могут:
 * - deposit VG tokens → получить VGVotes для голосования
 * - withdraw VGVotes → получить обратно VG tokens
 * 
 * Соотношение 1:1 - 1 VG = 1 VGVotes
 */
contract VGTokenVotes is ERC20, ERC20Permit, ERC20Votes, ReentrancyGuard {
    
    IERC20 public immutable underlyingToken; // VGToken
    
    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);

    constructor(
        address _underlyingToken
    ) 
        ERC20("Value Governance Votes", "VGVotes") 
        ERC20Permit("Value Governance Votes")
    {
        require(_underlyingToken != address(0), "VGTokenVotes: zero address");
        underlyingToken = IERC20(_underlyingToken);
    }

    /**
     * @dev Wrap VG tokens into VGVotes for voting
     * @param amount Amount of VG tokens to wrap
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "VGTokenVotes: deposit amount zero");
        
        // Transfer VG tokens from user to this contract
        underlyingToken.transferFrom(msg.sender, address(this), amount);
        
        // Mint VGVotes 1:1
        _mint(msg.sender, amount);
        
        emit Deposit(msg.sender, amount);
    }

    /**
     * @dev Unwrap VGVotes back to VG tokens
     * @param amount Amount of VGVotes to unwrap
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "VGTokenVotes: withdraw amount zero");
        require(balanceOf(msg.sender) >= amount, "VGTokenVotes: insufficient balance");
        
        // Burn VGVotes
        _burn(msg.sender, amount);
        
        // Transfer VG tokens back to user
        underlyingToken.transfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @dev Get exchange rate (always 1:1)
     */
    function exchangeRate() external pure returns (uint256) {
        return 1e18; // 1:1 ratio
    }

    /**
     * @dev Get total VG tokens held by this contract
     */
    function totalAssets() external view returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }

    /**
     * @dev Delegate voting power to another address
     * Users should call this after depositing to participate in voting
     */
    function delegateVotingPower(address delegatee) external {
        _delegate(msg.sender, delegatee);
    }

    /**
     * @dev Self-delegate voting power (most common case)
     */
    function enableVoting() external {
        _delegate(msg.sender, msg.sender);
    }

    // Required overrides for multiple inheritance compatibility
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
} 