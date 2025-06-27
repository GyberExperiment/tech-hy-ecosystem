# Token Entity

Модуль для работы с токенами в экосистеме, включая покупку VC токенов через PancakeSwap.

## Компоненты

### BuyVCWidget

Виджет для покупки VC токенов за BNB через PancakeSwap V2.

#### Особенности:
- ✅ BNB → VC swap через `swapExactETHForTokens`
- ✅ Автоматический расчет цен через `getAmountsOut`
- ✅ Настройка slippage (0.5% по умолчанию)
- ✅ Glassmorphism дизайн в стиле проекта
- ✅ Обработка ошибок и состояний загрузки
- ✅ Отображение транзакций с ссылками на BSCScan
- ✅ Использование правильных адресов из конфигурации

#### Использование:
```tsx
import { BuyVCWidget } from '../entities/Token';

const MyComponent = () => {
  return (
    <div>
      <BuyVCWidget />
    </div>
  );
};
```

#### Конфигурация контрактов:
- **PancakeSwap Router**: `CONTRACTS.PANCAKE_ROUTER`
- **VC Token**: `CONTRACTS.VC_TOKEN`
- **WBNB**: `CONTRACTS.WBNB`
- **Slippage**: `LP_POOL_CONFIG.DEFAULT_SLIPPAGE` (0.5%)
- **Deadline**: `LP_POOL_CONFIG.DEADLINE_MINUTES` (20 минут)

## API Hooks

### usePancakeSwap

Хук для взаимодействия с PancakeSwap V2 Router.

#### Методы:
- `getVCQuote(bnbAmount)` - получение котировки VC за BNB
- `buyVCWithBNB(params)` - выполнение BNB → VC swap
- `resetState()` - сброс состояния

#### Состояния:
- `isLoading` - выполняется ли операция
- `isSuccess` - успешно ли выполнена операция
- `error` - ошибка выполнения
- `txHash` - хэш транзакции

## Типы

### BuyVCParams
```typescript
interface BuyVCParams {
  bnbAmount: string;
  slippage: number;
  recipient: string;
}
```

### SwapQuote
```typescript
interface SwapQuote {
  amountIn: string;
  amountOut: string;
  path: string[];
  priceImpact: number;
}
```

## Будущие улучшения

1. **USDT поддержка** - добавить возможность покупки VC за USDT
2. **Баланс кошелька** - показ текущего баланса BNB/VC
3. **Прайс импакт** - расчет влияния на цену
4. **Исторические данные** - график цен VC
5. **Мультихоп свапы** - поддержка более сложных маршрутов

## Техническая информация

- **Сеть**: BSC Testnet/Mainnet (автоматическое определение)
- **Протокол**: PancakeSwap V2
- **TypeChain**: Автогенерированные типы для безопасности
- **Wagmi**: Для blockchain взаимодействий
- **Viem**: Для низкоуровневых операций с Ethereum 