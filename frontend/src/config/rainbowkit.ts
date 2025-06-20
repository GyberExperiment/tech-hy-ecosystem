import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { darkTheme } from '@rainbow-me/rainbowkit';
import { bscTestnet, bsc } from 'wagmi/chains';

// ⚠️ ВСТАВЬ СЮДА СВОЙ PROJECT ID ИЗ CLOUD.REOWN.COM
const YOUR_PROJECT_ID = 'e6aca752263b1f413ef9bc6a498134a8';

// Кастомная тема для органичной интеграции
export const customTheme = darkTheme({
  accentColor: '#3b82f6',
  accentColorForeground: '#ffffff',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Создаем конфигурацию RainbowKit
export const rainbowConfig = getDefaultConfig({
  appName: 'TECH HY Ecosystem',
  projectId: YOUR_PROJECT_ID, // Project ID от WalletConnect
  chains: [bscTestnet, bsc],
  ssr: false, // Мы используем CRA
});

export { rainbowConfig as config }; 