/**
 * 🔄 Wallet Connection Debouncing Utility
 * 
 * Prevents duplicate wallet_requestPermissions by debouncing connection attempts
 */

let isConnecting = false;
let connectingTimeout: NodeJS.Timeout | null = null;

export const createDebouncedConnector = (openConnectModal: () => void) => {
  return () => {
    // Если уже подключается, игнорируем запрос
    if (isConnecting) {
      console.log('🚫 Connection already in progress, ignoring duplicate request');
      return;
    }

    // Устанавливаем флаг подключения
    isConnecting = true;
    
    // Вызываем модал подключения
    openConnectModal();
    
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