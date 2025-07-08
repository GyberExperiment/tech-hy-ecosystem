# 🏗️ SwapWidget Architecture Documentation

## 📋 Обзор

SwapWidget - это централизованный компонент для обмена токенами в Tech-Hy Ecosystem, поддерживающий два основных режима:
- **Buy VC**: Покупка VC токенов за BNB по фиксированной цене
- **Earn VG**: Сжигание LP токенов для получения VG токенов

## 🎯 Решенные Проблемы

### ❌ Проблема: Блокировка ввода в поле VC Amount
**Симптомы:**
- Невозможно вводить цифры в поле VC Amount в режиме "Buy VC"
- Поле блокировалось при вводе чисел

**Причина:**
- В `validation.ts` функция `validateVCAmount` была слишком строгой
- Блокировала ввод на этапе набора текста (пустые строки, неполный ввод)
- Вызывалась в `useVCSale.ts` в функции `setVcAmount` при каждом изменении

**✅ Решение:**
1. Создана `validateInputAmount` для мягкой валидации ввода
2. Исправлена `setVcAmount` чтобы не блокировать обновление состояния
3. Разделена валидация на два уровня: ввод и отправка формы

## 🏛️ Архитектура Компонентов

### 1. SwapWidget.tsx
**Назначение:** Основной UI компонент с переключением режимов
**Ключевые состояния:**
- `mode`: 'buyvc' | 'earnvg'
- `vcAmount`: для EarnVG режима
- `vcsaleVcAmount`: из useVCSale для BuyVC режима

### 2. useVCSale.ts
**Назначение:** Управление состоянием и логикой для покупки VC
**Ключевые функции:**
- `setVcAmount`: ✅ Исправлена - использует мягкую валидацию
- `executePurchase`: Выполнение покупки с полной валидацией
- Автоматическая калькуляция BNB

### 3. validation.ts
**Назначение:** Система валидации входных данных
**Функции:**
- `validateInputAmount`: ✅ Новая - мягкая валидация для ввода
- `validateVCAmount`: Строгая валидация для отправки формы

### 4. Input.tsx
**Назначение:** Централизованный компонент ввода
**Особенности:**
- Controlled component
- Поддержка ошибок и иконок
- Типизированные props

## 🔄 Поток Данных

### Buy VC Mode
```
User Input → Input Component → setVcAmount → validateInputAmount → State Update → BNB Auto-calc → UI Update
```

### Earn VG Mode
```
User Input → Input Component → setState → Pool Calculation → UI Update
```

## 🛡️ Система Валидации

### Двухуровневая Валидация

#### Уровень 1: Ввод (мягкая)
```typescript
validateInputAmount(amount: string): { isValid: boolean; error?: string }
```
- ✅ Разрешает пустые поля
- ✅ Разрешает неполный ввод (".", "0.")
- ❌ Блокирует только критические ошибки

#### Уровень 2: Отправка (строгая)
```typescript
validateVCAmount(amount: string): void // throws ValidationError
```
- ❌ Блокирует пустые поля
- ❌ Блокирует значения < MIN_VC_AMOUNT
- ❌ Блокирует все некорректные форматы

## 📊 Состояние Приложения

### SwapWidget State
```typescript
interface SwapWidgetState {
  mode: 'buyvc' | 'earnvg';
  vcAmount: string;        // EarnVG mode
  bnbAmount: string;       // EarnVG mode
  lpAmount: string;        // EarnVG mode
  loading: boolean;
}
```

### VCSale State (useVCSale)
```typescript
interface VCSaleState {
  vcAmount: string;        // BuyVC mode
  bnbAmount: string;       // Auto-calculated
  saleStats: SaleStats;
  userStats: UserStats;
  securityStatus: SecurityStatus;
  isLoading: boolean;
  error: string | null;
}
```

## 🔧 Конфигурация

### Validation Rules
```typescript
const VALIDATION_RULES = {
  MIN_VC_AMOUNT: 1,
  MAX_VC_AMOUNT: 1000,
  DECIMAL_PLACES: 6,
  SAFE_INTEGER_LIMIT: Number.MAX_SAFE_INTEGER / 1e18
};
```

### VCSale Config
```typescript
const VCSALE_CONFIG = {
  autoRefreshInterval: 30000,
  debounceDelay: 300,
  gasLimitBuffer: 1.2
};
```

## 🚀 Производительность

### Оптимизации
- ✅ React.memo для Input компонента
- ✅ useCallback для обработчиков
- ✅ useMemo для вычислений
- ✅ Debouncing для автоматической калькуляции

### Мониторинг
- Analytics события для покупок
- Debug логи в development режиме
- Error tracking и reporting

## 🔐 Безопасность

### Валидация
- Санитизация входных данных
- Проверка лимитов и форматов
- Rate limiting для запросов

### Контракты
- MEV Protection
- Circuit Breaker
- Blacklist проверки
- Gas limit validation

## 🧪 Тестирование

### Unit Tests
```typescript
describe('validateInputAmount', () => {
  it('should allow empty input', () => {
    expect(validateInputAmount('')).toEqual({ isValid: true });
  });
  
  it('should allow partial input', () => {
    expect(validateInputAmount('0.')).toEqual({ isValid: true });
  });
});
```

### Integration Tests
- Полный поток покупки VC
- Автоматическая калькуляция BNB
- Обработка ошибок сети

## 📈 Будущие Улучшения

### Планируемые Возможности
- [ ] Slippage protection для EarnVG
- [ ] Multi-token support
- [ ] Advanced analytics
- [ ] Mobile optimizations

### Архитектурные Улучшения
- [ ] Единый state manager
- [ ] Improved error boundaries
- [ ] Better TypeScript coverage
- [ ] Performance monitoring

## 🎯 Критерии Успеха

- ✅ Ввод в VC поле работает мгновенно
- ✅ Автоматическая калькуляция BNB работает
- ✅ Валидация при отправке сохранена
- ✅ Архитектура чистая и понятная
- ✅ Код полностью типизирован
- ✅ Performance оптимизирован

## 📚 API Reference

### SwapWidget Props
```typescript
interface SwapWidgetProps {
  className?: string;
}
```

### useVCSale Hook
```typescript
const {
  // State
  vcAmount,
  bnbAmount,
  saleStats,
  userStats,
  securityStatus,
  isLoading,
  error,
  
  // Actions
  setVcAmount,
  refreshAllData,
  executePurchase,
  
  // Computed
  isNetworkSupported,
  canPurchase
} = useVCSale();
```

### Input Component
```typescript
interface InputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  label?: string;
  leftIcon?: ReactNode;
  disabled?: boolean;
}
```

---

*Документация обновлена: 2025-01-19*
*Версия: 1.0.0*
*Статус: ✅ Решение применено* 