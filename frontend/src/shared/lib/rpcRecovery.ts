/**
 * 🔄 RPC Connection Recovery Utility
 * 
 * Handles RPC provider failures and automatic recovery for wallet connections
 */

import { reconnect, disconnect } from '@wagmi/core';
import { rainbowConfig } from '../../config/rainbowkit';

let isRecovering = false;
let recoveryTimeout: NodeJS.Timeout | null = null;

/**
 * 🚨 Handle RPC provider failure and attempt recovery
 */
export const handleRpcFailure = async (error: any) => {
  if (isRecovering) {
    console.log('🔄 RPC recovery already in progress, skipping...');
    return;
  }

  console.warn('🚨 RPC Provider failure detected:', error);
  isRecovering = true;

  try {
    // Очищаем предыдущий timeout
    if (recoveryTimeout) {
      clearTimeout(recoveryTimeout);
    }

    // Пытаемся переподключиться через короткий интервал
    recoveryTimeout = setTimeout(async () => {
      try {
        console.log('🔄 Attempting RPC recovery...');
        
        // Переподключаем wagmi
        await reconnect(rainbowConfig);
        
        console.log('✅ RPC recovery successful');
        isRecovering = false;
      } catch (recoveryError) {
        console.error('❌ RPC recovery failed:', recoveryError);
        isRecovering = false;
      }
    }, 2000); // 2 секунды задержка

  } catch (error) {
    console.error('❌ RPC recovery setup failed:', error);
    isRecovering = false;
  }
};

/**
 * 🔄 Force wallet reconnection (for stuck connection states)
 */
export const forceWalletReconnection = async () => {
  try {
    console.log('🔄 Forcing wallet reconnection...');
    
    // Сначала отключаемся
    await disconnect(rainbowConfig);
    
    // Ждем небольшую задержку
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Затем переподключаемся
    await reconnect(rainbowConfig);
    
    console.log('✅ Wallet reconnection successful');
  } catch (error) {
    console.error('❌ Wallet reconnection failed:', error);
  }
};

/**
 * 🧹 Reset all connection states
 */
export const resetAllConnectionStates = () => {
  if (recoveryTimeout) {
    clearTimeout(recoveryTimeout);
    recoveryTimeout = null;
  }
  isRecovering = false;
  console.log('🧹 All connection states reset');
};

/**
 * 🔍 Check if recovery is in progress
 */
export const isRpcRecoveryInProgress = () => isRecovering;

/**
 * 🎯 Smart connection handler that prevents loops
 */
export const smartWalletConnect = async (connectFunction: () => void) => {
  // Если уже идет восстановление, ждем его завершения
  if (isRecovering) {
    console.log('🔄 Waiting for RPC recovery to complete...');
    return new Promise((resolve) => {
      const checkRecovery = () => {
        if (!isRecovering) {
          resolve(connectFunction());
        } else {
          setTimeout(checkRecovery, 500);
        }
      };
      checkRecovery();
    });
  }

  // Обычное подключение
  connectFunction();
}; 