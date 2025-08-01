import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { darkTheme } from '@rainbow-me/rainbowkit';
import { createConfig, http, fallback } from 'wagmi';
import { bscTestnet, bsc } from 'wagmi/chains';
import { BSC_TESTNET_RPC_ENDPOINTS } from '../shared/config/rpcEndpoints';
import { 
  metaMaskWallet,
  trustWallet,
  binanceWallet,
  okxWallet,
  tokenPocketWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
  rainbowWallet,
  rabbyWallet,
  oneKeyWallet,
  braveWallet,
  safeWallet,
  argentWallet,
  imTokenWallet,
  zerionWallet
} from '@rainbow-me/rainbowkit/wallets';

// Project ID от WalletConnect
const YOUR_PROJECT_ID = 'e6aca752263b1f413ef9bc6a498134a8';

// Кастомная тема для органичной интеграции
export const customTheme = darkTheme({
  accentColor: '#3b82f6',
  accentColorForeground: '#ffffff',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Кастомная конфигурация кошельков с популярными BSC кошельками
const connectors = connectorsForWallets(
  [
    {
      groupName: '🔥 Популярные для BSC',
      wallets: [
        trustWallet,        // Самый популярный мобильный для BSC
        metaMaskWallet,     // Универсальный
        binanceWallet,      // Официальный Binance кошелек
        tokenPocketWallet,  // Популярен в Азии для BSC
      ],
    },
    {
      groupName: '💎 Рекомендуемые',
      wallets: [
        coinbaseWallet,     // Простой и надежный
        okxWallet,          // Популярная биржа
        rabbyWallet,        // Современный DeFi кошелек
        zerionWallet,       // Хороший для DeFi
      ],
    },
    {
      groupName: '🛠 Дополнительные',
      wallets: [
        oneKeyWallet,       // Безопасный кошелек
        braveWallet,        // Встроенный в Brave
        argentWallet,       // Smart contract wallet
        imTokenWallet,      // Популярен в Азии
        rainbowWallet,      // Красивый кошелек
        safeWallet,         // Мультисиг кошелек
      ],
    },
    {
      groupName: '🌐 Другие кошельки',
      wallets: [
        walletConnectWallet, // Универсальный WalletConnect
        injectedWallet,      // Любые другие кошельки
      ],
    },
  ],
  {
    appName: 'TECH HY Ecosystem',
    projectId: YOUR_PROJECT_ID,
  }
);

// Создаем Wagmi конфигурацию с транспортами
export const rainbowConfig = createConfig({
  connectors,
  chains: [bscTestnet, bsc],
  transports: {
    [bscTestnet.id]: fallback(
      BSC_TESTNET_RPC_ENDPOINTS.map(endpoint => http(endpoint, {
        timeout: 10_000, // 10 секунд таймаут
        retryCount: 3,   // 3 попытки подключения
        retryDelay: 1000 // 1 секунда между попытками
      }))
    ),
    [bsc.id]: http(), // Mainnet оставляем default
  },
  multiInjectedProviderDiscovery: true, // Включаем для правильной работы с MetaMask
  ssr: false, // Мы используем CRA
  // ✅ Добавляем политику переподключения
  pollingInterval: 4_000, // Проверяем статус каждые 4 секунды
});

export { rainbowConfig as config }; 