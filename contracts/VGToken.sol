// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VGToken
 * @dev Value Governance Token - обычный ERC20 для наград
 * Для голосований используется VGTokenVotes wrapper
 */
contract VGToken is ERC20, Ownable {
    
    uint256 public constant MAX_SUPPLY = 100_000_000e18; // 100M VG max supply
    
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event OwnershipQueried(address indexed querier, address owner);

    constructor(
        address initialOwner
    ) ERC20("Value Governance", "VG") Ownable(initialOwner) {
        // Mint initial supply to owner (для rewards и distribution)
        _mint(initialOwner, 10_000_000e18); // 10M VG initial
        emit TokensMinted(initialOwner, 10_000_000e18, "Initial mint");
    }

    /**
     * @dev Required by LPLocker - returns contract owner
     * LPLocker использует это для определения authority
     */
    function _OWNER_() external view returns (address) {
        address currentOwner = owner();
        return currentOwner;
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
        require(to != address(0), "VGToken: mint to zero address");
        require(amount > 0, "VGToken: mint amount zero");
        require(totalSupply() + amount <= MAX_SUPPLY, "VGToken: exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    /**
     * @dev Burn tokens from own balance
     */
    function burn(uint256 amount) external {
        require(amount > 0, "VGToken: burn amount zero");
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Get remaining mintable supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
} 