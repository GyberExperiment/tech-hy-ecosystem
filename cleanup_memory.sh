#!/bin/bash

echo "🧹 Очистка памяти macOS..."

echo "1. Освобождение неактивной памяти..."
sudo purge

echo "2. Очистка DNS кэша..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

echo "3. Принудительная сборка мусора Python..."
python3 -c "import gc; gc.collect(); print('Python GC выполнен')" 2>/dev/null || echo "Python недоступен"

echo "4. Очистка системных логов..."
sudo log erase --all 2>/dev/null || echo "Не удалось очистить логи"

echo "5. Текущий статус памяти:"
memory_pressure

echo "✅ Очистка завершена!" 