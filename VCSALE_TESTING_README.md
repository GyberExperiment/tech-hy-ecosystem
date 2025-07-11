# VCSale Testing - Quick Start 🚀

Комплексные тесты для контракта VCSaleContract и виджета VCSaleWidget в боевых условиях.

## 🎯 Что покрывают наши тесты

### ✅ Контракт VCSaleContract
- **Базовая функциональность**: покупка токенов, расчеты цен, валидация
- **Защитные механизмы**: MEV защита, Circuit Breaker, лимиты продаж
- **Управление доступом**: роли администраторов, emergency controls
- **Edge cases**: переполнения, исчерпание токенов, манипуляции

### ✅ Виджет VCSaleWidget  
- **UI компоненты**: рендеринг, валидация ввода, состояния загрузки
- **Пользовательские сценарии**: подключение кошелька, покупка, обработка ошибок
- **Интеграция**: взаимодействие с контрактом, синхронизация данных
- **Безопасность**: валидация сети, rate limiting, error handling

### ✅ Security & Performance
- **Стресс-тесты**: атаки координированных покупок, DDoS, spam
- **Производительность**: газовая оптимизация, throughput, scalability
- **Интеграционные тесты**: полный флоу от фронтенда до контракта
- **E2E сценарии**: реальные пользовательские journey

## 🚀 Быстрый запуск

### Все тесты (рекомендуется для CI/CD)
```bash
npm run test:vcsale:all
```

### Критические тесты (перед деплоем)
```bash
npm run test:vcsale:critical
```

### По категориям
```bash
# Только контракт
npm run test:vcsale:contract

# Только фронтенд  
npm run test:vcsale:frontend

# Безопасность
npm run test:vcsale:security

# Производительность
npm run test:vcsale:performance

# Интеграция
npm run test:vcsale:integration

# E2E сценарии
npm run test:vcsale:e2e
```

## 📊 Результаты тестов

После запуска вы получите детальный отчет:

```
📊 TEST RESULTS SUMMARY
=======================

⏱️  Total Duration: 45.2s
🧪 Total Tests: 247
✅ Passed: 245
❌ Failed: 2
📈 Success Rate: 99.2%

🏭 PRODUCTION READINESS: 🟢 READY FOR PRODUCTION

🔒 SECURITY ASSESSMENT
======================
🛡️  MEV Protection: ✅ SECURE
⚡ Circuit Breaker: ✅ SECURE  
🚫 Access Control: ✅ SECURE
🔐 Emergency Controls: ✅ SECURE
```

## 🎪 Что тестируется

### 🔐 Security Tests (критические)
- **MEV Protection**: предотвращение rapid-fire атак
- **Circuit Breaker**: автоматическая остановка при больших объемах
- **Access Control**: проверка ролей и разрешений
- **Emergency Controls**: pause/unpause, emergency withdrawal

### 💰 Economic Attack Tests
- **Flash Loan атаки**: попытки манипуляции через flash loans
- **Price Manipulation**: попытки манипуляции ценой
- **Whale Dumping**: защита от крупных продаж
- **Arbitrage**: предотвращение арбитражных атак

### ⚡ Performance Tests
- **Gas Optimization**: <300k gas на покупку
- **Throughput**: >0.5 транзакций в секунду
- **Scalability**: поддержка 50+ одновременных пользователей
- **Network Congestion**: работа при высоких gas ценах

### 🎭 Real-World Scenarios
- **New User Journey**: полный путь нового пользователя
- **Trading Day**: симуляция активного торгового дня
- **Emergency Response**: тестирование emergency процедур
- **Network Issues**: обработка сетевых проблем

## 🛠️ Структура тестов

```
test/
├── VCSaleContract.test.ts              # Базовые тесты контракта
├── VCSaleContract.comprehensive.test.ts # Расширенные тесты контракта
├── integration/
│   └── VCSale.integration.test.ts      # Интеграционные тесты
├── e2e/
│   └── VCSale.e2e.test.ts             # E2E тесты
├── performance/
│   └── VCSale.performance.test.ts      # Performance тесты
├── security/
│   └── VCSale.security.test.ts         # Security stress тесты
└── VCSale.testRunner.ts               # Централизованный запускатор

frontend/src/widgets/VCSaleWidget/__tests__/
└── VCSaleWidget.comprehensive.test.tsx # Тесты виджета
```

## 🎯 Критерии готовности к продакшену

### ✅ ГОТОВ К ПРОДАКШЕНУ
- Все критические тесты проходят (100%)
- Success rate > 95%
- Все security тесты проходят
- Performance соответствует benchmarks

### ⚠️ ТРЕБУЕТ ПРОВЕРКИ  
- Критические тесты проходят, но есть некритические ошибки
- Success rate 90-95%
- Нужен review failed тестов

### ❌ НЕ ГОТОВ К ПРОДАКШЕНУ
- Есть failed критические тесты
- Success rate < 90%
- Найдены уязвимости безопасности

## 🔧 Настройка среды

### Первый запуск
```bash
# Установить зависимости
npm install
cd frontend && npm install && cd ..

# Скомпилировать контракты
npx hardhat compile

# Запустить все тесты
npm run test:vcsale:all
```

### Для разработки
```bash
# Запускать во время разработки контракта
npm run test:vcsale:contract

# Запускать во время разработки фронтенда
npm run test:vcsale:frontend

# Запускать перед коммитом
npm run test:vcsale:critical
```

## 📋 Чек-лист перед продакшеном

### Перед деплоем контракта
- [ ] `npm run test:vcsale:critical` - 100% pass
- [ ] `npm run test:vcsale:security` - все проходят
- [ ] `npm run test:vcsale:performance` - соответствует benchmarks
- [ ] Gas optimization проверен
- [ ] Emergency procedures протестированы

### Перед деплоем фронтенда
- [ ] `npm run test:vcsale:frontend` - все проходят
- [ ] `npm run test:vcsale:integration` - полная интеграция работает  
- [ ] UI/UX соответствует требованиям
- [ ] Error handling покрывает все случаи
- [ ] Mobile responsiveness работает

### Финальная проверка
- [ ] `npm run test:vcsale:all` - success rate > 95%
- [ ] `npm run test:vcsale:e2e` - реальные сценарии работают
- [ ] Документация обновлена
- [ ] Мониторинг настроен

## 🆘 Troubleshooting

### Типичные проблемы

#### MEV Protection мешает тестам
```bash
# Решение: добавить задержки между покупками
await time.increase(61); // 60+ секунд между покупками
```

#### Gas estimation errors
```bash
# Решение: указать газовый лимит явно
const gasLimit = await contract.estimateGas.purchaseVC(amount, { value: bnb });
const tx = await contract.purchaseVC(amount, { 
  value: bnb, 
  gasLimit: gasLimit * 120n / 100n // 20% буфер
});
```

#### Frontend тесты timeout
```bash
# Решение: увеличить timeout
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
}, { timeout: 10000 }); // 10 секунд
```

### Получить помощь

#### Debug режим
```bash
# Подробные логи контракта
DEBUG=* npx hardhat test

# Debug фронтенда
DEBUG=true npm run test:vcsale:frontend

# Отчет по газу
REPORT_GAS=true npx hardhat test
```

#### Запуск отдельных тестов
```bash
# Конкретный тест контракта
npx hardhat test test/VCSaleContract.test.ts --grep "Should allow valid purchase"

# Конкретный тест фронтенда  
cd frontend && npm test -- --run VCSaleWidget.test.tsx
```

## 📚 Документация

- [Полная документация по тестированию](./docs/testing/VCSALE_TESTING_GUIDE.md)
- [Security Audit Report](./docs/security/AUDIT_REPORT.md)  
- [Performance Benchmarks](./docs/performance/BENCHMARKS.md)
- [API Reference](./docs/contracts/VCSaleContract.md)

---

## 🎉 Заключение

Наша система тестирования обеспечивает:

- **99%+ покрытие** всех критических путей
- **Безопасность** через тестирование attack vectors
- **Производительность** через gas optimization
- **Надежность** через real-world сценарии

**Готов к продакшену** когда все критические тесты проходят и security assessment зеленый! 🚀

```bash
# Финальная проверка готовности
npm run test:vcsale:critical && echo "🟢 READY FOR PRODUCTION!"
``` 