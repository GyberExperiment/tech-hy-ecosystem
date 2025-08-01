/**
 * 🔄 Wallet Connection Debouncing Utility
 * 
 * Prevents duplicate wallet_requestPermissions by debouncing connection attempts
 */

import { smartWalletConnect, isRpcRecoveryInProgress } from './rpcRecovery';

let isConnecting = false;
let connectingTimeout: NodeJS.Timeout | null = null;

export const createDebouncedConnector = (openConnectModal: () => void) => {
  return () => {
    // Если уже подключается, игнорируем запрос
    if (isConnecting) {
      console.log('🚫 Connection already in progress, ignoring duplicate request');
      return;
    }

    // Если идет восстановление RPC, ждем его завершения
    if (isRpcRecoveryInProgress()) {
      console.log('🔄 Waiting for RPC recovery, delaying connection...');
      setTimeout(() => {
        if (!isConnecting && !isRpcRecoveryInProgress()) {
          createDebouncedConnector(openConnectModal)();
        }
      }, 2000);
      return;
    }

    // Устанавливаем флаг подключения
    isConnecting = true;
    
    // Используем smart connection
    smartWalletConnect(openConnectModal);
    
    // Сбрасываем флаг через 5 секунд (достаточно для большинства случаев)
    connectingTimeout = setTimeout(() => {
      isConnecting = false;
      console.log('🔄 Connection debounce reset');
    }, 5000);
  };
};

// Сброс состояния подключения (для случаев успешного или неудачного подключения)
export const resetConnectionState = () => {
  if (connectingTimeout) {
    clearTimeout(connectingTimeout);
    connectingTimeout = null;
  }
  isConnecting = false;
  console.log('✅ Connection state manually reset');
};

// Проверка состояния подключения
export const isConnectionInProgress = () => isConnecting; 