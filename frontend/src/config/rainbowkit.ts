import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { darkTheme } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { bscTestnet, bsc } from 'wagmi/chains';
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
    [bscTestnet.id]: http(),
    [bsc.id]: http(),
  },
  multiInjectedProviderDiscovery: false, // Убираем автоматическое обнаружение кошельков
  ssr: false, // Мы используем CRA
});

export { rainbowConfig as config }; 