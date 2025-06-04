# tech-hy-ecosystem


# Техническое задание на разработку стейкинг контракта для BSC

## 1. Общее описание проекта

**Цель**: Разработка системы ликвидного стейкинга на Binance Smart Chain с интеграцией PancakeSwap для автоматического создания и управления LP позициями.

**Основная механика**: Пользователи предоставляют токены VC и BNB, получают LP токены через PancakeSwap, которые блокируются в контракте. Взамен пользователи получают токены вознаграждения VG.

## 2. Технические требования

### 2.1 Блокчейн и стандарты
- **Сеть**: Binance Smart Chain (BSC)
- **Стандарт токенов**: BEP-20
- **Solidity версия**: ^0.8.19
- **Фреймворк**: Hardhat + OpenZeppelin

### 2.2 Внешние интеграции
- **PancakeSwap V2 Router**: Для добавления ликвидности
- **PancakeSwap LP токены**: Для пары VC/WBNB
- **Опционально**: PancakeSwap V3 для более эффективного управления ликвидностью

## 3. Архитектура контракта

### 3.1 Основные токены
- **VC Token**: Основной токен проекта (BEP-20)
- **VG Token**: Токен вознаграждения (BEP-20) 
- **WBNB**: Wrapped BNB
- **LP Token**: PancakeSwap LP токен для пары VC/WBNB

### 3.2 Структура конфигурации

```solidity
struct StakingConfig {
    address authority;                    // Администратор контракта
    address vgTokenAddress;              // Адрес VG токена
    address vcTokenAddress;              // Адрес VC токена
    address pancakeRouter;               // PancakeSwap V2 Router
    address lpTokenAddress;              // LP токен VC/WBNB
    address stakingVaultAddress;         // Хранилище VG токенов
    
    // Параметры расчетов
    uint256 lpDivisor;                   // Делитель для расчета LP (1,000,000)
    uint256 lpToVgRatio;                 // Соотношение LP к VG (по умолчанию 10)
    uint256 minBnbAmount;                // Минимум BNB (0.01 BNB)
    uint256 minVcAmount;                 // Минимум VC (1 VC с учетом decimals)
    
    // Контроль slippage
    uint16 maxSlippageBps;               // Максимальный slippage (1000 = 10%)
    uint16 defaultSlippageBps;           // По умолчанию (200 = 2%)
    
    // MEV защита
    bool mevProtectionEnabled;           // Включена ли MEV защита
    uint256 minTimeBetweenTxs;          // Минимум между транзакциями (секунды)
    uint8 maxTxPerUserPerBlock;         // Максимум транзакций на блок
    
    // Статистика
    uint256 totalLockedLp;              // Общее количество заблокированных LP
    uint256 totalVgIssued;              // Всего выдано VG токенов
    uint256 totalVgDeposited;           // Всего депонировано VG токенов
    
    // MEV защита - состояние
    mapping(address => uint256) lastUserTxBlock;
    mapping(address => uint8) userTxCountInBlock;
}
```

## 4. Основные функции

### 4.1 Инициализация контракта

```solidity
function initialize(
    address _vgToken,
    address _vcToken, 
    address _pancakeRouter,
    address _lpToken,
    uint256 _lpDivisor,
    uint256 _lpToVgRatio
) external;
```

**Требования**:
- Только owner может вызвать
- Устанавливает все базовые параметры
- Создает хранилище для VG токенов
- Инициализирует MEV защиту (включена по умолчанию)

### 4.2 Основная функция стейкинга

```solidity
function earnVG(
    uint256 vcAmount,
    uint256 bnbAmount,
    uint16 slippageBps
) external payable;
```

**Логика выполнения**:

1. **Валидация входных данных**:
   - `vcAmount >= minVcAmount`
   - `bnbAmount >= minBnbAmount` 
   - `slippageBps <= maxSlippageBps`
   - Проверка балансов пользователя

2. **MEV защита**:
   ```solidity
   require(
       block.number > lastUserTxBlock[msg.sender] || 
       userTxCountInBlock[msg.sender] < maxTxPerUserPerBlock,
       "MEV protection: too many transactions"
   );
   ```

3. **Расчет ожидаемых LP токенов**:
   ```solidity
   uint256 expectedLp = (vcAmount * bnbAmount) / lpDivisor;
   uint256 minLpAmount = (expectedLp * (10000 - slippageBps)) / 10000;
   ```

4. **Добавление ликвидности в PancakeSwap**:
   ```solidity
   IERC20(vcToken).transferFrom(msg.sender, address(this), vcAmount);
   
   (uint256 amountA, uint256 amountB, uint256 liquidity) = 
       IPancakeRouter(pancakeRouter).addLiquidityETH{value: bnbAmount}(
           vcToken,
           vcAmount,
           0, // amountTokenMin - будем контролировать через liquidity
           0, // amountETHMin - будем контролировать через liquidity  
           address(this),
           block.timestamp + 300
       );
   
   require(liquidity >= minLpAmount, "Slippage exceeded");
   ```

5. **Блокировка LP токенов**:
   - LP токены остаются в контракте
   - Обновление `totalLockedLp += liquidity`

6. **Выдача VG токенов**:
   ```solidity
   uint256 vgReward = liquidity * lpToVgRatio;
   require(IERC20(vgToken).balanceOf(stakingVault) >= vgReward, "Insufficient VG tokens");
   
   IERC20(vgToken).transferFrom(stakingVault, msg.sender, vgReward);
   totalVgIssued += vgReward;
   ```

7. **Эмиссия события**:
   ```solidity
   emit VGTokensEarned(msg.sender, liquidity, vgReward, bnbAmount, vcAmount, block.timestamp);
   ```

### 4.3 Административные функции

```solidity
// Депозит VG токенов для выдачи пользователям
function depositVGTokens(uint256 amount) external;

// Обновление параметров расчета
function updateRates(uint256 newLpToVgRatio, uint256 newLpDivisor) external onlyOwner;

// Обновление адресов PancakeSwap
function updatePancakeConfig(address newRouter, address newLpToken) external onlyOwner;

// Обновление MEV защиты
function updateMevProtection(
    bool enabled,
    uint256 minTimeBetweenTxs,
    uint8 maxTxPerBlock
) external onlyOwner;

// Получение информации о пуле
function getPoolInfo() external view returns (
    uint256 totalLocked,
    uint256 totalIssued,
    uint256 totalDeposited,
    uint256 availableVG
);

// Передача прав администратора
function transferAuthority(address newAuthority) external onlyOwner;
```

## 5. События для мониторинга

```solidity
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

event ConfigurationUpdated(
    address indexed authority,
    string field,
    uint256 timestamp
);

event AuthorityTransferred(
    address indexed oldAuthority,
    address indexed newAuthority,
    uint256 timestamp
);

event MEVProtectionTriggered(
    address indexed user,
    uint256 blockNumber,
    uint256 timestamp
);
```

## 6. Безопасность

### 6.1 Защита от ошибок
- **ReentrancyGuard**: Защита от повторного входа
- **SafeMath**: Безопасная арифметика (для версий < 0.8.0)
- **Input validation**: Проверка всех входных параметров
- **Access control**: Модификаторы доступа для административных функций

### 6.2 MEV защита
```solidity
modifier mevProtection() {
    if (mevProtectionEnabled) {
        require(
            block.number > lastUserTxBlock[msg.sender] ||
            userTxCountInBlock[msg.sender] < maxTxPerUserPerBlock,
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
```

### 6.3 Slippage защита
- Расчет минимального количества LP токенов
- Проверка полученного количества после добавления ликвидности
- Configurable slippage limits

### 6.4 Аудит требования
- Использование проверенных библиотек (OpenZeppelin)
- Comprehensive unit tests (coverage > 95%)
- Integration tests с форками BSC
- Static analysis (Slither, MythX)

## 7. Дополнительные возможности

### 7.1 Поддержка нескольких пулов
```solidity
struct PoolConfig {
    address tokenA;
    address tokenB;
    address lpToken;
    uint256 lpToVgRatio;
    bool active;
}

mapping(bytes32 => PoolConfig) public pools;
```

### 7.2 Временные блокировки
```solidity
struct StakeInfo {
    uint256 amount;
    uint256 timestamp;
    uint256 unlockTime;
    bool withdrawn;
}

mapping(address => StakeInfo[]) public userStakes;
```

### 7.3 Referral система
```solidity
mapping(address => address) public referrers;
uint256 public referralBonusBps = 500; // 5%

function earnVGWithReferral(
    uint256 vcAmount,
    uint256 bnbAmount,
    uint16 slippageBps,
    address referrer
) external payable;
```

## 8. Тестирование

### 8.1 Unit тесты
- Все математические функции
- Access control
- Edge cases (нулевые значения, overflow)
- MEV защита
- Slippage контроль

### 8.2 Integration тесты
- Взаимодействие с PancakeSwap
- Форки BSC mainnet
- Gas optimization tests
- Stress testing

### 8.3 Тестовые сценарии
```javascript
describe("Staking Contract", () => {
  it("Should correctly calculate LP tokens", async () => {
    // Тест расчета LP токенов
  });
  
  it("Should enforce MEV protection", async () => {
    // Тест MEV защиты
  });
  
  it("Should handle slippage correctly", async () => {
    // Тест защиты от slippage
  });
  
  it("Should distribute VG tokens correctly", async () => {
    // Тест выдачи наград
  });
});
```

## 9. Деплой и мониторинг

### 9.1 Деплой процедура
1. Деплой на BSC testnet
2. Полное тестирование
3. Аудит безопасности
4. Деплой на BSC mainnet
5. Верификация контракта на BSCScan

### 9.2 Мониторинг
- Events indexing
- Grafana dashboards
- Automated alerts для критических событий
- Real-time pool statistics

### 9.3 Upgradability
- Рассмотреть использование Proxy pattern
- Emergency pause функционал
- Timelock для критических изменений

## 10. Временные рамки

- **Неделя 1-2**: Разработка core контракта
- **Неделя 3**: Unit тесты и локальное тестирование  
- **Неделя 4**: Integration тесты с PancakeSwap
- **Неделя 5**: Деплой на testnet и тестирование
- **Неделя 6**: Аудит и исправления
- **Неделя 7**: Production деплой и мониторинг

## 11. Риски и митигация

### 11.1 Технические риски
- **Smart contract bugs**: Комплексное тестирование + аудит
- **PancakeSwap changes**: Abstraction layer для роутера
- **Gas price volatility**: Gas optimization + user warnings

### 11.2 Economic риски  
- **IL (Impermanent Loss)**: User education + warnings
- **Token price volatility**: Dynamic slippage adjustment
- **VG token depletion**: Monitoring + auto-refill mechanisms

### 11.3 Security риски
- **MEV attacks**: Built-in MEV protection
- **Flash loan attacks**: ReentrancyGuard + proper checks
- **Admin key compromise**: Multi-sig + timelock

Это ТЗ основано на анализе реального Solana контракта и адаптирует его логику для BSC с учетом всех особенностей и требований безопасности.
