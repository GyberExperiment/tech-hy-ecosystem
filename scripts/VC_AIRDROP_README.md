# 🎯 TECH HY VC Airdrop System

Система для анализа держателей VC токенов в BSC mainnet и рассылки тестовых VC токенов в testnet.

## 📋 Обзор

Система состоит из 4 компонентов:

1. **BSCScan Analysis** - Получение полного списка держателей через BSCScan API
2. **On-chain Analysis** - Анализ держателей через события Transfer 
3. **Batch Airdrop Contract** - Оптимизированный контракт для массовой рассылки
4. **Execution Script** - Основной скрипт для выполнения airdrop

## 🎯 Цель

Раздать **100,000 тестовых VC** каждому держателю настоящих VC токенов из BSC mainnet.

**Адрес VC в mainnet:** `0xC88eC091302Eb90e78a4CA361D083330752dfc9A`

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install axios
```

### 2. Настройка переменных окружения

```bash
# Опционально - для лучшего анализа
export BSCSCAN_API_KEY="your_bscscan_api_key"

# Если у вас уже есть тестовый VC контракт
export TESTNET_VC_CONTRACT="0x..."
```

### 3. Анализ держателей

**Вариант 1: BSCScan API (рекомендуется)**
```bash
node scripts/bscscan-holders-analyzer.js
```

**Вариант 2: On-chain анализ**
```bash
npx hardhat run scripts/vc-airdrop-analysis.js --network bsc
```

### 4. Выполнение airdrop

```bash
npx hardhat run scripts/execute-vc-airdrop.js --network bscTestnet
```

## 📊 Подробная документация

### 🔍 Анализ держателей

#### BSCScan Analysis (`bscscan-holders-analyzer.js`)

**Преимущества:**
- Полный список всех держателей
- Ранжирование по балансам
- Детальная статистика распределения
- Быстрее чем on-chain анализ

**Результаты:**
- `bscscan-holders-analysis.json` - Полный анализ
- `airdrop-addresses.json` - Список адресов для airdrop

**Пример использования:**
```bash
# С API ключом (лимит 5 запросов/сек)
BSCSCAN_API_KEY=your_key node scripts/bscscan-holders-analyzer.js

# Без API ключа (лимит 1 запрос/сек)
node scripts/bscscan-holders-analyzer.js
```

#### On-chain Analysis (`vc-airdrop-analysis.js`)

**Особенности:**
- Анализирует последние 50,000 блоков (~4 дня)
- Фильтрует только активных держателей
- Работает без API ключей

**Использование:**
```bash
npx hardhat run scripts/vc-airdrop-analysis.js --network bsc
```

### 🏗️ Batch Airdrop Contract

Оптимизированный контракт для массовой рассылки токенов:

**Функции:**
- `batchAirdropSameAmount()` - Одинаковая сумма всем (до 200 адресов)
- `batchAirdropOptimized()` - Оптимизированная версия (до 500 адресов)
- `batchAirdropDifferentAmounts()` - Разные суммы (до 100 адресов)

**Безопасность:**
- ReentrancyGuard защита
- Проверка балансов
- Авторизация операторов
- Emergency withdraw функция

### 🚀 Execution Script

Главный скрипт для выполнения полного цикла airdrop:

**Этапы:**
1. Загрузка данных о держателях
2. Деплой BatchAirdrop контракта  
3. Настройка VC токена (или деплой нового)
4. Подсчет требований и подготовка токенов
5. Выполнение batch airdrop
6. Верификация результатов

## 📈 Оценка затрат

### Gas расходы (BSC Testnet)

- **Базовый transfer:** ~21,000 gas
- **Batch 200 адресов:** ~4,200,000 gas  
- **Стоимость:** ~0.021 BNB (~$12.6) за batch

### Для 1000 держателей

- **Batches:** 5 (по 200 адресов)
- **Общий gas:** ~21,000,000 gas
- **Стоимость:** ~0.105 BNB (~$63)

## 📁 Результаты

Система генерирует несколько файлов с результатами:

### `bscscan-holders-analysis.json`
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "contract": "0xC88eC091302Eb90e78a4CA361D083330752dfc9A",
  "totalHolders": 1247,
  "topHolders": [...],
  "distribution": [...],
  "allHolders": {...}
}
```

### `airdrop-execution-results.json`
```json
{
  "timestamp": "2024-01-15T11:00:00Z",
  "testnetContract": "0x...",
  "batchAirdropContract": "0x...",
  "airdropAmount": "100000.0",
  "totalHolders": 1247,
  "successfulTransfers": 1247,
  "batches": [...],
  "deployedContracts": {...}
}
```

## 🛠️ Примеры использования

### 1. Только анализ (без airdrop)

```bash
# Получить список держателей
node scripts/bscscan-holders-analyzer.js

# Результат: bscscan-holders-analysis.json, airdrop-addresses.json
```

### 2. Полный airdrop процесс

```bash
# 1. Анализ
node scripts/bscscan-holders-analyzer.js

# 2. Выполнение
npx hardhat run scripts/execute-vc-airdrop.js --network bscTestnet
```

### 3. Использование существующего VC контракта

```bash
# Установить адрес существующего тестового контракта
export TESTNET_VC_CONTRACT="0x123..."

# Выполнить airdrop
npx hardhat run scripts/execute-vc-airdrop.js --network bscTestnet
```

### 4. Тестирование на локальной сети

```bash
# Запустить локальную сеть
npx hardhat node

# В другом терминале
npx hardhat run scripts/execute-vc-airdrop.js --network localhost
```

## ⚡ Оптимизации

### 1. Batch размеры

- **BSC Testnet:** до 200 адресов безопасно
- **BSC Mainnet:** до 100 адресов рекомендуется
- **Локальная сеть:** до 500 адресов

### 2. Gas оптимизация

```javascript
// Используйте оптимизированную функцию для больших airdrop
await batchAirdrop.batchAirdropOptimized(token, recipients, amount);

// Или стандартную для безопасности
await batchAirdrop.batchAirdropSameAmount(token, recipients, amount);
```

### 3. Rate limiting

```javascript
// Задержка между batches для избежания rate limits
await new Promise(resolve => setTimeout(resolve, 3000));
```

## 🚨 Важные моменты

### 1. Безопасность

- ✅ Все контракты проверены на reentrancy
- ✅ Валидация адресов и сумм
- ✅ Emergency withdraw функция
- ⚠️ Тестируйте на small batch сначала

### 2. Ограничения

- BSCScan API: 5 req/sec с ключом, 1 req/sec без
- Batch размер: максимум 500 адресов
- Gas limit: следите за лимитами блока

### 3. Мониторинг

```bash
# Проверка статуса транзакций
npx hardhat run scripts/verify-airdrop-status.js --network bscTestnet

# Просмотр логов
tail -f airdrop-execution-results.json
```

## 🆘 Troubleshooting

### 1. "Insufficient balance" ошибка

```bash
# Проверить баланс деплоера
npx hardhat run scripts/check-balances.js --network bscTestnet

# Минт дополнительных токенов (если контракт поддерживает)
npx hardhat run scripts/mint-tokens.js --network bscTestnet
```

### 2. "Transfer failed" ошибки

- Проверьте газ лимиты
- Уменьшите batch размер
- Проверьте валидность адресов

### 3. BSCScan API лимиты

```bash
# Использовать on-chain анализ вместо BSCScan
npx hardhat run scripts/vc-airdrop-analysis.js --network bsc
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи в консоли
2. Проверьте файлы результатов
3. Проверьте баланс газа и токенов
4. Уменьшите batch размер для тестирования

## 🎉 Успешное выполнение

После успешного airdrop:

- Все VC держатели получат 100,000 тестовых VC
- Результаты сохранены в JSON файлах
- Контракты развернуты и готовы к повторному использованию
- Система готова к масштабированию на mainnet

---

**🚀 Готово к запуску! Начните с анализа держателей и переходите к airdrop.** 