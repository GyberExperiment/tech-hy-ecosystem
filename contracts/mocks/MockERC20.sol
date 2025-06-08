// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    address public _OWNER_;
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _OWNER_ = msg.sender;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
