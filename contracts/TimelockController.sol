// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title LPLockerTimelock
 * @dev Timelock контроллер для защиты критических операций LPLocker
 */
contract LPLockerTimelock is TimelockController {
    
    event CriticalOperationScheduled(
        bytes32 indexed id,
        uint256 indexed delay,
        address target,
        string operation
    );

    constructor(
        uint256 minDelay,        // Минимальная задержка (например, 1 день = 86400 секунд)
        address[] memory proposers,  // Адреса которые могут предлагать операции
        address[] memory executors,  // Адреса которые могут выполнять операции
        address admin            // Администратор timelock (может быть address(0))
    ) TimelockController(minDelay, proposers, executors, admin) {}

    /**
     * @dev Функция для планирования критических операций с дополнительным логированием
     */
    function scheduleCriticalOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay,
        string calldata operationName
    ) external {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        
        schedule(target, value, data, predecessor, salt, delay);
        
        emit CriticalOperationScheduled(id, delay, target, operationName);
    }
} 