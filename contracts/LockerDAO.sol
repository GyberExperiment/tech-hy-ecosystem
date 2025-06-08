// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import { LPLockerGovernor } from "./LPLockerGovernor.sol";

contract StakingDAO is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    address public lpLocker;
    address public governor;
    address public token;

    event LPLockertUpgraded(address newImplementation);

    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor");
        _;
    }

    function initialize(address _token, address _lpLocker) public initializer {
        __Ownable_init(_msgSender());
        __UUPSUpgradeable_init();

        require(_token != address(0), "Token address zero");
        require(_lpLocker != address(0), "LPLocker address zero");

        token = _token;
        lpLocker = _lpLocker;

        governor = address(new LPLockerGovernor(IVotes(_token), address(this)));
    }
    function upgradeLPLocker(address newImplementation) external onlyGovernor {
        require(newImplementation.code.length > 0, "Not a contract");
        UUPSUpgradeable(lpLocker).upgradeToAndCall(newImplementation, "");
        emit LPLockertUpgraded(newImplementation);
    }

    function _authorizeUpgrade(address) internal override onlyGovernor {}
}
