#!/bin/bash

echo "🔍 Проверка окружения для подключения кошелька..."

echo ""
echo "📱 Проверка браузера:"
echo "→ Откройте http://localhost:5173 в браузере"
echo "→ Откройте Developer Tools (F12)"
echo "→ Перейдите в Console"

echo ""
echo "🔧 Проверьте в консоли:"
echo "→ window.ethereum - должно быть объектом"
echo "→ window.ethereum.isMetaMask - должно быть true для MetaMask"
echo "→ Нет ошибок JavaScript"

echo ""
echo "🎯 Тестирование модалки:"
echo "1. Нажмите кнопку 'Connect Wallet'"
echo "2. Модалка должна открыться без ошибок"
echo "3. Проверьте debug информацию в левом нижнем углу"

echo ""
echo "🐛 Если модалка не работает:"
echo "→ Перезагрузите страницу (Cmd+R)"  
echo "→ Проверьте есть ли MetaMask или другой кошелек"
echo "→ Проверьте консоль на ошибки JavaScript"

echo ""
echo "✅ Исправления применены:"
echo "→ Убраны агрессивные CSS стили с !important"
echo "→ Добавлен debug компонент для диагностики"
echo "→ Упрощены стили модалки RainbowKit"

echo ""
echo "🌐 Поддерживаемые кошельки:"
echo "→ MetaMask (рекомендуется)"
echo "→ Trust Wallet"
echo "→ Binance Wallet"  
echo "→ TokenPocket"
echo "→ Coinbase Wallet"
echo "→ OKX Wallet"

echo ""
echo "📞 Если проблема остается:"
echo "→ Скриншот ошибки в консоли"
echo "→ Информация из debug панели"
echo "→ Версия браузера и ОС" 