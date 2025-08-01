/**
 * 🔄 Advanced Wallet Connection (Updated)
 *
 * Now integrates with EIP-6963 and advanced connection system
 * Prevents duplicate wallet_requestPermissions and handles BSC connections
 */

import { connectMetaMaskAdvanced, smartWalletReconnect, resetAllConnections } from './advancedWalletConnection';
import { isRpcRecoveryInProgress, smartWalletConnect } from './rpcRecovery';

let isConnecting = false;
let connectingTimeout: NodeJS.Timeout | null = null;

/**
 * 🔄 Enhanced Debounced Connector using Advanced System
 */
export const createDebouncedConnector = (openConnectModal: () => void) => {
  return async () => {
    // Если уже подключается, игнорируем запрос
    if (isConnecting) {
      console.log('🚫 Connection already in progress, ignoring duplicate request');
      return;
    }

    // Если идет восстановление RPC, ждем
    if (isRpcRecoveryInProgress()) {
      console.log('🔄 RPC recovery in progress, deferring connection...');
      return;
    }

    // Устанавливаем флаг подключения
    isConnecting = true;
    console.log('🚀 Starting enhanced wallet connection...');

    try {
      // Сначала пробуем наш продвинутый метод подключения
      const advancedResult = await connectMetaMaskAdvanced();
      
      if (advancedResult.success) {
        console.log('✅ Advanced connection successful, triggering RainbowKit sync...');
        // Если продвинутое подключение сработало, вызываем RainbowKit для синхронизации UI
        openConnectModal();
      } else {
        console.log('⚠️ Advanced connection failed, falling back to RainbowKit modal');
        // Если не сработало, используем стандартный RainbowKit
        openConnectModal();
      }

    } catch (error) {
      console.error('❌ Enhanced connection attempt failed:', error);
      // В случае ошибки все равно показываем модал
      openConnectModal();
    }

    // Сбрасываем флаг через разумное время
    connectingTimeout = setTimeout(() => {
      isConnecting = false;
      console.log('🔄 Connection timeout reset');
    }, 10000); // Увеличили до 10 секунд для более надежной работы
  };
};

/**
 * 🔄 Smart Connection with Fallback
 */
export const smartConnection = async (openConnectModal: () => void) => {
  return smartWalletConnect(async () => {
    const debouncedConnect = createDebouncedConnector(openConnectModal);
    await debouncedConnect();
  });
};

/**
 * ✅ Enhanced Connection State Reset
 */
export const resetConnectionState = () => {
  if (connectingTimeout) {
    clearTimeout(connectingTimeout);
    connectingTimeout = null;
  }
  isConnecting = false;
  console.log('✅ Enhanced connection state manually reset');
};

/**
 * 🔧 Emergency Connection Recovery
 */
export const emergencyConnectionRecovery = async () => {
  console.log('🚨 Emergency connection recovery initiated...');
  
  try {
    // Step 1: Reset all connection states
    resetConnectionState();
    
    // Step 2: Attempt smart wallet reconnection
    const reconnectSuccess = await smartWalletReconnect();
    
    if (reconnectSuccess) {
      console.log('✅ Emergency recovery successful');
      return { success: true, message: 'Connection recovered successfully' };
    } else {
      // Step 3: If smart reconnection fails, try complete reset
      console.log('🔧 Smart reconnection failed, attempting complete reset...');
      await resetAllConnections();
      
      console.log('✅ Complete reset performed, ready for new connection');
      return { success: true, message: 'Connection reset, ready to reconnect' };
    }
    
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
    return { success: false, message: `Recovery failed: ${error}` };
  }
};

/**
 * 🔍 Check if connection is in progress
 */
export const isConnectionInProgress = () => isConnecting;

/**
 * 📊 Get Connection Status
 */
export const getConnectionStatus = () => {
  return {
    isConnecting,
    hasTimeout: !!connectingTimeout,
    rpcRecoveryActive: isRpcRecoveryInProgress(),
    timestamp: new Date().toISOString()
  };
}; 