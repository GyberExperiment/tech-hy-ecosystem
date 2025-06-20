// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Governor } from "@openzeppelin/contracts/governance/Governor.sol";
import { GovernorSettings } from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import { GovernorVotes, IVotes } from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import { GovernorVotesQuorumFraction } from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import { GovernorCountingSimple } from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";

contract LPLockerGovernor is
    Governor,
    GovernorSettings,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorCountingSimple
{
    address public dao;

    constructor(
        IVotes _token,
        address _dao
    )
        Governor("LPLockerGovernor")
        GovernorSettings(
            6575,        // Voting delay: ~1 день (BSC ~3 sec blocks)
            201600,      // Voting period: ~1 неделя 
            10000e18     // Proposal threshold: 10,000 токенов
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(10) // 10% quorum (было 4%)
    {
        require(_dao != address(0), "DAO address zero");
        dao = _dao;
    }

    function proposeUpgrade(address newImplementation) public returns (uint256) {
        address[] memory targets = new address[](1);
        targets[0] = dao;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("upgradeLPLocker(address)", newImplementation);

        return propose(targets, values, calldatas, "Upgrade LPLocker");
    }

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function quorum(
        uint256 blockNumber
    ) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }
}
