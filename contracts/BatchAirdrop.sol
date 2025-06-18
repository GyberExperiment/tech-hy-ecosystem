// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BatchAirdrop
 * @dev Optimized contract for batch token distribution (airdrop)
 * @notice Allows efficient distribution of tokens to multiple recipients
 */
contract BatchAirdrop is Ownable, ReentrancyGuard {
    // Events
    event BatchAirdropExecuted(
        address indexed token,
        uint256 recipients,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event SingleAirdropExecuted(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    // State variables
    mapping(address => bool) public authorizedOperators;
    mapping(address => mapping(address => uint256)) public totalAirdropped; // token => recipient => amount
    
    // Modifiers
    modifier onlyAuthorized() {
        require(
            owner() == msg.sender || authorizedOperators[msg.sender],
            "BatchAirdrop: not authorized"
        );
        _;
    }

    /**
     * @dev Constructor sets the deployer as owner
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Add/remove authorized operators
     * @param operator Address to authorize/deauthorize
     * @param authorized True to authorize, false to deauthorize
     */
    function setAuthorizedOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
    }

    /**
     * @notice Execute batch airdrop with same amount for all recipients
     * @param token Address of the token to distribute
     * @param recipients Array of recipient addresses
     * @param amount Amount to send to each recipient
     */
    function batchAirdropSameAmount(
        address token,
        address[] calldata recipients,
        uint256 amount
    ) external onlyAuthorized nonReentrant {
        require(token != address(0), "BatchAirdrop: invalid token");
        require(recipients.length > 0, "BatchAirdrop: empty recipients");
        require(amount > 0, "BatchAirdrop: invalid amount");
        require(recipients.length <= 200, "BatchAirdrop: too many recipients");

        IERC20 tokenContract = IERC20(token);
        uint256 totalAmount = amount * recipients.length;
        
        // Check balance
        require(
            tokenContract.balanceOf(address(this)) >= totalAmount,
            "BatchAirdrop: insufficient balance"
        );

        // Execute transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            require(recipient != address(0), "BatchAirdrop: invalid recipient");
            
            bool success = tokenContract.transfer(recipient, amount);
            require(success, "BatchAirdrop: transfer failed");
            
            totalAirdropped[token][recipient] += amount;
            
            emit SingleAirdropExecuted(token, recipient, amount, block.timestamp);
        }

        emit BatchAirdropExecuted(token, recipients.length, totalAmount, block.timestamp);
    }

    /**
     * @notice Execute batch airdrop with different amounts for each recipient
     * @param token Address of the token to distribute
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send (must match recipients length)
     */
    function batchAirdropDifferentAmounts(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyAuthorized nonReentrant {
        require(token != address(0), "BatchAirdrop: invalid token");
        require(recipients.length > 0, "BatchAirdrop: empty recipients");
        require(recipients.length == amounts.length, "BatchAirdrop: length mismatch");
        require(recipients.length <= 100, "BatchAirdrop: too many recipients");

        IERC20 tokenContract = IERC20(token);
        uint256 totalAmount = 0;
        
        // Calculate total amount needed
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "BatchAirdrop: invalid amount");
            totalAmount += amounts[i];
        }
        
        // Check balance
        require(
            tokenContract.balanceOf(address(this)) >= totalAmount,
            "BatchAirdrop: insufficient balance"
        );

        // Execute transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];
            
            require(recipient != address(0), "BatchAirdrop: invalid recipient");
            
            bool success = tokenContract.transfer(recipient, amount);
            require(success, "BatchAirdrop: transfer failed");
            
            totalAirdropped[token][recipient] += amount;
            
            emit SingleAirdropExecuted(token, recipient, amount, block.timestamp);
        }

        emit BatchAirdropExecuted(token, recipients.length, totalAmount, block.timestamp);
    }

    /**
     * @notice Optimized batch airdrop using assembly for gas efficiency
     * @param token Address of the token to distribute
     * @param recipients Array of recipient addresses
     * @param amount Amount to send to each recipient
     */
    function batchAirdropOptimized(
        address token,
        address[] calldata recipients,
        uint256 amount
    ) external onlyAuthorized nonReentrant {
        require(token != address(0), "BatchAirdrop: invalid token");
        require(recipients.length > 0, "BatchAirdrop: empty recipients");
        require(amount > 0, "BatchAirdrop: invalid amount");
        require(recipients.length <= 500, "BatchAirdrop: too many recipients");

        IERC20 tokenContract = IERC20(token);
        uint256 totalAmount = amount * recipients.length;
        
        // Check balance
        require(
            tokenContract.balanceOf(address(this)) >= totalAmount,
            "BatchAirdrop: insufficient balance"
        );

        // Prepare transfer function selector
        bytes4 transferSelector = bytes4(keccak256("transfer(address,uint256)"));
        
        bool allSuccessful = true;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            require(recipient != address(0), "BatchAirdrop: invalid recipient");
            
            // Call transfer using low-level call for gas optimization
            (bool success, ) = token.call(
                abi.encodeWithSelector(transferSelector, recipient, amount)
            );
            
            if (success) {
                totalAirdropped[token][recipient] += amount;
                emit SingleAirdropExecuted(token, recipient, amount, block.timestamp);
            } else {
                allSuccessful = false;
            }
        }
        
        require(allSuccessful, "BatchAirdrop: some transfers failed");
        emit BatchAirdropExecuted(token, recipients.length, totalAmount, block.timestamp);
    }

    /**
     * @notice Emergency function to withdraw tokens
     * @param token Address of token to withdraw
     * @param amount Amount to withdraw (0 = all)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        
        if (amount == 0 || amount > balance) {
            amount = balance;
        }
        
        require(amount > 0, "BatchAirdrop: no balance");
        bool success = tokenContract.transfer(owner(), amount);
        require(success, "BatchAirdrop: withdraw failed");
    }

    /**
     * @notice Get contract's token balance
     * @param token Address of token to check
     * @return balance Current balance
     */
    function getTokenBalance(address token) external view returns (uint256 balance) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get total amount airdropped to a recipient for a specific token
     * @param token Address of token
     * @param recipient Address of recipient
     * @return amount Total amount airdropped
     */
    function getTotalAirdropped(address token, address recipient) external view returns (uint256 amount) {
        return totalAirdropped[token][recipient];
    }

    /**
     * @notice Check if address is authorized operator
     * @param operator Address to check
     * @return authorized True if authorized
     */
    function isAuthorizedOperator(address operator) external view returns (bool authorized) {
        return authorizedOperators[operator] || operator == owner();
    }

    /**
     * @notice Estimate gas cost for batch airdrop
     * @param recipientsCount Number of recipients
     * @return gasEstimate Estimated gas cost
     */
    function estimateGasCost(uint256 recipientsCount) external pure returns (uint256 gasEstimate) {
        // Base cost + (transfer cost * recipients)
        uint256 baseCost = 50000; // Contract overhead
        uint256 transferCost = 25000; // Cost per transfer
        return baseCost + (transferCost * recipientsCount);
    }
} 