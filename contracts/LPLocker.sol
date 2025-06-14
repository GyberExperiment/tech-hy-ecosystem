// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPancakeRouter02 } from "./interfaces/IPancakeRouter02.sol";
import { IVGToken } from "./interfaces/IVGToken.sol";

contract LPLocker is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    // Структура конфигурации
    struct StakingConfig {
        address authority; // Администратор контракта
        address vgTokenAddress; // Адрес VG токена
        address vcTokenAddress; // Адрес VC токена
        address pancakeRouter; // PancakeSwap V2 Router
        address lpTokenAddress; // LP токен VC/WBNB
        address stakingVaultAddress; // Хранилище VG токенов
        // Параметры расчетов
        uint256 lpDivisor; // Делитель для расчета LP (1,000,000)
        uint256 lpToVgRatio; // Соотношение LP к VG (по умолчанию 10)
        uint256 minBnbAmount; // Минимум BNB (0.01 BNB)
        uint256 minVcAmount; // Минимум VC (1 VC с учетом decimals)
        // Контроль slippage
        uint16 maxSlippageBps; // Максимальный slippage (1000 = 10%)
        uint16 defaultSlippageBps; // По умолчанию (200 = 2%)
        // MEV защита
        bool mevProtectionEnabled; // Включена ли MEV защита
        uint256 minTimeBetweenTxs; // Минимум между транзакциями (секунды)
        uint8 maxTxPerUserPerBlock; // Максимум транзакций на блок
        // Статистика
        uint256 totalLockedLp; // Общее количество заблокированных LP
        uint256 totalVgIssued; // Всего выдано VG токенов
        uint256 totalVgDeposited; // Всего депонировано VG токенов
    }

    struct InitConfig {
        address vgTokenAddress;
        address vcTokenAddress;
        address pancakeRouter;
        address lpTokenAddress;
        address stakingVaultAddress;
        uint256 lpDivisor;
        uint256 lpToVgRatio;
        uint256 minBnbAmount;
        uint256 minVcAmount;
        uint16 maxSlippageBps;
        uint16 defaultSlippageBps;
        bool mevProtectionEnabled;
        uint256 minTimeBetweenTxs;
        uint8 maxTxPerUserPerBlock;
    }
    StakingConfig public config;
    mapping(address => uint256) public lastUserTxBlock;
    mapping(address => uint8) public userTxCountInBlock;
    mapping(address => uint256) public lastUserTxTimestamp;

    event VGTokensEarned(
        address indexed user,
        uint256 lpAmount,
        uint256 vgAmount,
        uint256 bnbAmount,
        uint256 vcAmount,
        uint256 timestamp
    );
    event LPTokensLocked(
        address indexed user,
        uint256 lpAmount,
        uint256 vgAmount,
        uint256 timestamp
    );
    event VGTokensDeposited(
        address indexed depositor,
        uint256 amount,
        uint256 totalDeposited,
        uint256 timestamp
    );
    event ConfigurationUpdated(address indexed authority, string field, uint256 timestamp);
    event AuthorityTransferred(
        address indexed oldAuthority,
        address indexed newAuthority,
        uint256 timestamp
    );
    event MEVProtectionTriggered(address indexed user, uint256 blockNumber, uint256 timestamp);

    modifier onlyAuthority() {
        require(msg.sender == config.authority, "Only authority");
        _;
    }

    modifier mevProtection() {
        if (config.mevProtectionEnabled) {
            // Time-based protection
            require(
                block.timestamp >= lastUserTxTimestamp[msg.sender] + config.minTimeBetweenTxs,
                "Too frequent transactions"
            );
            
            // Block-based protection
            require(
                block.number > lastUserTxBlock[msg.sender] ||
                    userTxCountInBlock[msg.sender] < config.maxTxPerUserPerBlock,
                "MEV protection violated"
            );

            // Update timestamps and counters
            lastUserTxTimestamp[msg.sender] = block.timestamp;
            
            if (block.number > lastUserTxBlock[msg.sender]) {
                lastUserTxBlock[msg.sender] = block.number;
                userTxCountInBlock[msg.sender] = 1;
            } else {
                userTxCountInBlock[msg.sender]++;
            }
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(InitConfig calldata initConfig) public initializer {
        __Ownable_init(_msgSender());
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        // Валидация zero address для всех критических адресов
        require(initConfig.vgTokenAddress != address(0), "VG token address zero");
        require(initConfig.vcTokenAddress != address(0), "VC token address zero");
        require(initConfig.pancakeRouter != address(0), "PancakeRouter address zero");
        require(initConfig.lpTokenAddress != address(0), "LP token address zero");
        require(initConfig.stakingVaultAddress != address(0), "Staking vault address zero");
        
        // Валидация authority address
        address authority = IVGToken(initConfig.vgTokenAddress)._OWNER_();
        require(authority != address(0), "Authority address zero");

        config.authority = authority;
        config.vgTokenAddress = initConfig.vgTokenAddress;
        config.vcTokenAddress = initConfig.vcTokenAddress;
        config.pancakeRouter = initConfig.pancakeRouter;
        config.lpTokenAddress = initConfig.lpTokenAddress;
        config.stakingVaultAddress = initConfig.stakingVaultAddress;
        config.lpDivisor = initConfig.lpDivisor;
        config.lpToVgRatio = initConfig.lpToVgRatio;
        config.minBnbAmount = initConfig.minBnbAmount;
        config.minVcAmount = initConfig.minVcAmount;
        config.maxSlippageBps = initConfig.maxSlippageBps;
        config.defaultSlippageBps = initConfig.defaultSlippageBps;
        config.mevProtectionEnabled = initConfig.mevProtectionEnabled;
        config.minTimeBetweenTxs = initConfig.minTimeBetweenTxs;
        config.maxTxPerUserPerBlock = initConfig.maxTxPerUserPerBlock;
    }

    function earnVG(
        uint256 vcAmount,
        uint256 bnbAmount,
        uint16 slippageBps
    ) external payable mevProtection nonReentrant {
        require(vcAmount >= config.minVcAmount, "VC amount too low");
        require(bnbAmount >= config.minBnbAmount, "BNB amount too low");
        require(msg.value == bnbAmount, "BNB amount mismatch");
        require(slippageBps <= config.maxSlippageBps, "Slippage too high");

        IERC20 vcToken = IERC20(config.vcTokenAddress);
        vcToken.transferFrom(msg.sender, address(this), vcAmount);

        // Расчет минимальных amounts с учетом slippage
        uint256 minVcAmount = (vcAmount * (10000 - slippageBps)) / 10000;
        uint256 minBnbAmount = (bnbAmount * (10000 - slippageBps)) / 10000;
        
        uint256 expectedLp = (vcAmount * bnbAmount) / config.lpDivisor;
        uint256 minLpAmount = (expectedLp * (10000 - slippageBps)) / 10000;

        vcToken.approve(config.pancakeRouter, vcAmount);

        (, , uint liquidity) = IPancakeRouter02(config.pancakeRouter).addLiquidityETH{
            value: bnbAmount
        }(config.vcTokenAddress, vcAmount, minVcAmount, minBnbAmount, address(this), block.timestamp + 300);
        
        require(liquidity >= minLpAmount, "Slippage exceeded");
        config.totalLockedLp += liquidity;

        uint256 vgReward = liquidity * config.lpToVgRatio;
        
        // ✅ Обновленная логика работы с VGVault
        _distributeVGReward(msg.sender, vgReward);
        
        config.totalVgIssued += vgReward;

        emit VGTokensEarned(msg.sender, liquidity, vgReward, bnbAmount, vcAmount, block.timestamp);
    }

    /**
     * @notice Блокирует готовые LP токены VC/BNB и выдает VG награды
     * @param lpAmount Количество LP токенов для блокировки
     * @dev Пользователь должен предварительно одобрить LP токены для этого контракта
     */
    function lockLPTokens(uint256 lpAmount) external mevProtection nonReentrant {
        require(lpAmount > 0, "LP amount must be positive");
        
        IERC20 lpToken = IERC20(config.lpTokenAddress);
        
        // Проверяем баланс пользователя
        require(lpToken.balanceOf(msg.sender) >= lpAmount, "Insufficient LP balance");
        
        // Проверяем allowance
        require(lpToken.allowance(msg.sender, address(this)) >= lpAmount, "Insufficient LP allowance");
        
        // Переводим LP токены от пользователя к контракту (permanent lock)
        lpToken.transferFrom(msg.sender, address(this), lpAmount);
        
        // Обновляем статистику заблокированных LP
        config.totalLockedLp += lpAmount;
        
        // Рассчитываем VG награду (такое же соотношение как в earnVG)
        uint256 vgReward = lpAmount * config.lpToVgRatio;
        
        // ✅ Обновленная логика работы с VGVault
        _distributeVGReward(msg.sender, vgReward);
        
        config.totalVgIssued += vgReward;
        
        emit LPTokensLocked(msg.sender, lpAmount, vgReward, block.timestamp);
    }

    /**
     * @dev Внутренняя функция для выдачи VG токенов
     * @param to Адрес получателя
     * @param amount Количество VG токенов
     */
    function _distributeVGReward(address to, uint256 amount) internal {
        IERC20 vgToken = IERC20(config.vgTokenAddress);
        
        // Проверяем что у контракта достаточно VG токенов
        require(
            vgToken.balanceOf(address(this)) >= amount,
            "Insufficient VG tokens in contract"
        );
        
        // Выдаем VG токены напрямую из контракта
        vgToken.transfer(to, amount);
    }

    function depositVGTokens(uint256 amount) external onlyAuthority {
        IERC20 vgToken = IERC20(config.vgTokenAddress);

        // Переводим VG токены в сам контракт для выдачи наград
        vgToken.transferFrom(msg.sender, address(this), amount);
        config.totalVgDeposited += amount;
        emit VGTokensDeposited(msg.sender, amount, config.totalVgDeposited, block.timestamp);
    }

    function updateRates(uint256 newLpToVgRatio, uint256 newLpDivisor) external onlyAuthority {
        require(newLpToVgRatio > 0, "LP to VG ratio must be positive");
        require(newLpDivisor > 0, "LP divisor must be positive");
        require(newLpDivisor >= 1000, "LP divisor too small");
        
        config.lpToVgRatio = newLpToVgRatio;
        config.lpDivisor = newLpDivisor;
        emit ConfigurationUpdated(msg.sender, "Rates", block.timestamp);
    }

    function updatePancakeConfig(address newRouter, address newLpToken) external onlyAuthority {
        require(newRouter != address(0), "Router address zero");
        require(newLpToken != address(0), "LP token address zero");
        require(newRouter.code.length > 0, "Router not a contract");
        
        config.pancakeRouter = newRouter;
        config.lpTokenAddress = newLpToken;
        emit ConfigurationUpdated(msg.sender, "PancakeConfig", block.timestamp);
    }

    function updateMevProtection(
        bool enabled,
        uint256 minTimeBetweenTxs,
        uint8 maxTxPerBlock
    ) external onlyAuthority {
        config.mevProtectionEnabled = enabled;
        config.minTimeBetweenTxs = minTimeBetweenTxs;
        config.maxTxPerUserPerBlock = maxTxPerBlock;
        emit ConfigurationUpdated(msg.sender, "MEVProtection", block.timestamp);
    }

    function getPoolInfo()
        external
        view
        returns (
            uint256 totalLocked,
            uint256 totalIssued,
            uint256 totalDeposited,
            uint256 availableVG
        )
    {
        IERC20 vgToken = IERC20(config.vgTokenAddress);
        return (
            config.totalLockedLp,
            config.totalVgIssued,
            config.totalVgDeposited,
            vgToken.balanceOf(address(this))
        );
    }

    function transferAuthority(address newAuthority) external onlyAuthority {
        require(newAuthority != address(0), "Invalid address");
        emit AuthorityTransferred(config.authority, newAuthority, block.timestamp);
        config.authority = newAuthority;
    }

    /**
     * @notice Emergency pause - активирует максимальную MEV защиту
     * @dev Только authority может вызвать в критических ситуациях
     */
    function emergencyPause() external onlyAuthority {
        config.mevProtectionEnabled = true;
        config.minTimeBetweenTxs = 86400; // 24 часа между транзакциями
        config.maxTxPerUserPerBlock = 1; // Максимум 1 транзакция на блок
        emit ConfigurationUpdated(msg.sender, "EmergencyPause", block.timestamp);
    }

    /**
     * @notice Emergency unpause - возвращает нормальные параметры MEV защиты
     * @dev Только authority может отменить emergency режим
     */
    function emergencyUnpause() external onlyAuthority {
        config.mevProtectionEnabled = true; // Оставляем защиту включенной
        config.minTimeBetweenTxs = 300; // 5 минут между транзакциями (нормально)
        config.maxTxPerUserPerBlock = 3; // Максимум 3 транзакции на блок (нормально)
        emit ConfigurationUpdated(msg.sender, "EmergencyUnpause", block.timestamp);
    }

    /**
     * @notice Полностью отключает MEV защиту (только для экстренных случаев)
     * @dev Используйте с осторожностью - убирает все ограничения
     */
    function disableMevProtection() external onlyAuthority {
        config.mevProtectionEnabled = false;
        emit ConfigurationUpdated(msg.sender, "MEVProtectionDisabled", block.timestamp);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
