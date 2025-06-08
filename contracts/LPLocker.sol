// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPancakeRouter02 } from "./interfaces/IPancakeRouter02.sol";
import { IVGToken } from "./interfaces/IVGToken.sol";
import "hardhat/console.sol";
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

    event VGTokensEarned(
        address indexed user,
        uint256 lpAmount,
        uint256 vgAmount,
        uint256 bnbAmount,
        uint256 vcAmount,
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
            require(
                block.number > lastUserTxBlock[msg.sender] ||
                    userTxCountInBlock[msg.sender] < config.maxTxPerUserPerBlock,
                "MEV protection violated"
            );

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

        config.authority = IVGToken(initConfig.vgTokenAddress)._OWNER_();
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

        uint256 expectedLp = (vcAmount * bnbAmount) / config.lpDivisor;
        uint256 minLpAmount = (expectedLp * (10000 - slippageBps)) / 10000;

        vcToken.approve(config.pancakeRouter, vcAmount);

        (, , uint liquidity) = IPancakeRouter02(config.pancakeRouter).addLiquidityETH{
            value: bnbAmount
        }(config.vcTokenAddress, vcAmount, 0, 0, address(this), block.timestamp + 300);
        require(liquidity >= minLpAmount, "Slippage exceeded");
        config.totalLockedLp += liquidity;

        uint256 vgReward = liquidity * config.lpToVgRatio;
        IERC20 vgToken = IERC20(config.vgTokenAddress);

        require(
            vgToken.balanceOf(config.stakingVaultAddress) >= vgReward,
            "Insufficient VG tokens"
        );

        vgToken.transferFrom(config.stakingVaultAddress, msg.sender, vgReward);
        config.totalVgIssued += vgReward;

        emit VGTokensEarned(msg.sender, liquidity, vgReward, bnbAmount, vcAmount, block.timestamp);
    }

    function depositVGTokens(uint256 amount) external onlyAuthority {
        IERC20 vgToken = IERC20(config.vgTokenAddress);

        vgToken.transferFrom(msg.sender, config.stakingVaultAddress, amount);
        config.totalVgDeposited += amount;
        emit VGTokensDeposited(msg.sender, amount, config.totalVgDeposited, block.timestamp);
    }

    function updateRates(uint256 newLpToVgRatio, uint256 newLpDivisor) external onlyAuthority {
        config.lpToVgRatio = newLpToVgRatio;
        config.lpDivisor = newLpDivisor;
        emit ConfigurationUpdated(msg.sender, "Rates", block.timestamp);
    }

    function updatePancakeConfig(address newRouter, address newLpToken) external onlyAuthority {
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
            vgToken.balanceOf(config.stakingVaultAddress)
        );
    }

    function transferAuthority(address newAuthority) external onlyAuthority {
        require(newAuthority != address(0), "Invalid address");
        emit AuthorityTransferred(config.authority, newAuthority, block.timestamp);
        config.authority = newAuthority;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
