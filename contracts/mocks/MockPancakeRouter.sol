// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockPancakeRouter {
    uint256 private returnAmount0;
    uint256 private returnAmount1;
    uint256 private returnLiquidity;

    function setAddLiquidityResult(uint256 amount0, uint256 amount1, uint256 liquidity) external {
        returnAmount0 = amount0;
        returnAmount1 = amount1;
        returnLiquidity = liquidity;
    }

    function addLiquidityETH(
        address /* token */,
        uint256 /* amountTokenDesired */,
        uint256 /* amountTokenMin */,
        uint256 /* amountETHMin */,
        address /* to */,
        uint256 /* deadline */
    ) external payable returns (uint256, uint256, uint256) {
        return (returnAmount0, returnAmount1, returnLiquidity);
    }
}
