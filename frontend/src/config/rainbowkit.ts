import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bscTestnet, bsc } from 'wagmi/chains';

// ✅ НЕ НУЖНА РЕГИСТРАЦИЯ! Используем публичный project ID
const publicProjectId = 'c4f79cc821944d9680842e34466bfbd';

// Создаем конфигурацию RainbowKit
export const rainbowConfig = getDefaultConfig({
  appName: 'TECH HY Ecosystem',
  projectId: publicProjectId, // Публичный ID, работает без регистрации
  chains: [bscTestnet, bsc],
  ssr: false, // Мы используем CRA
});

export { rainbowConfig as config }; 