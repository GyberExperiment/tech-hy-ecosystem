// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VCToken
 * @dev Value Coin - токен для стейкинга в LPLocker
 * Обычный ERC20 токен с возможностью минтинга
 */
contract VCToken is ERC20, Ownable {
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18; // 1B VC max supply
    
    event TokensMinted(address indexed to, uint256 amount, string reason);

    constructor(
        address initialOwner
    ) ERC20("Value Coin", "VC") Ownable(initialOwner) {
        // Mint initial supply to owner
        _mint(initialOwner, 100_000_000e18); // 100M VC initial
        emit TokensMinted(initialOwner, 100_000_000e18, "Initial mint");
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     * @param reason Reason for minting (for transparency)
     */
    function mint(address to, uint256 amount, string calldata reason) external onlyOwner {
        _mintWithReason(to, amount, reason);
    }

    /**
     * @dev Convenience function for minting without reason
     */
    function mintTo(address to, uint256 amount) external onlyOwner {
        _mintWithReason(to, amount, "Standard mint");
    }

    /**
     * @dev Internal function to handle minting with reason
     */
    function _mintWithReason(address to, uint256 amount, string memory reason) internal {
        require(to != address(0), "VCToken: mint to zero address");
        require(amount > 0, "VCToken: mint amount zero");
        require(totalSupply() + amount <= MAX_SUPPLY, "VCToken: exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    /**
     * @dev Burn tokens from own balance
     */
    function burn(uint256 amount) external {
        require(amount > 0, "VCToken: burn amount zero");
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Get remaining mintable supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
} 