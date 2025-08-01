/**
 * 🧹 MetaMask Connection Cleaner
 * 
 * Fixes the "Permissions request already pending please wait" error
 * and other connection issues that occur with MetaMask
 * Enhanced with Fantom network detection and logging
 */

import { disconnect } from '@wagmi/core';
import { rainbowConfig } from '../../config/rainbowkit';

let isCleaningInProgress = false;
let cleanupTimeout: NodeJS.Timeout | null = null;

/**
 * 🔍 Detect if "permissions request pending" error is occurring
 */
export const detectPendingPermissionsError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString() || '';
  const errorCode = error.code;
  
  // Log detailed error info for debugging
  console.log('🔍 Analyzing error for pending permissions:', {
    message: errorMessage,
    code: errorCode,
    fullError: error
  });
  
  // Common error patterns for pending permissions
  const pendingPatterns = [
    'permissions request already pending',
    'request already pending',
    'already pending',
    'pending request',
    'wallet_requestPermissions',
    'User rejected the request', // Sometimes this comes after pending state
  ];
  
  const hasPendingPattern = pendingPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // MetaMask error codes that indicate pending state
  const pendingErrorCodes = [
    -32002, // Request already pending
    4001,   // User rejected (sometimes after pending)
    -32603  // Internal error (can be related to pending state)
  ];
  
  const hasPendingCode = pendingErrorCodes.includes(errorCode);
  
  const isPendingError = hasPendingPattern || hasPendingCode;
  
  if (isPendingError) {
    console.log('✅ Pending permissions error detected:', {
      hasPattern: hasPendingPattern,
      hasCode: hasPendingCode,
      matchedPattern: pendingPatterns.find(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      ),
      errorCode
    });
  }
  
  return isPendingError;
};

/**
 * 🔍 Detect Fantom network issues
 */
export const detectFantomNetworkIssue = (error: any, chainId?: number): boolean => {
  if (!error && !chainId) return false;
  
  const errorMessage = error?.message || error?.toString() || '';
  
  // Direct chain ID detection
  const isFantomChain = chainId === 250 || chainId === 4002;
  
  // Error message patterns that might indicate Fantom
  const fantomPatterns = [
    'fantom',
    'ftm',
    'opera',
    'chain id 250',
    'chainid:250',
    'chain id 4002',
    'chainid:4002'
  ];
  
  const hasFantomPattern = fantomPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern)
  );
  
  const isFantomRelated = isFantomChain || hasFantomPattern;
  
  if (isFantomRelated) {
    console.log('🚨 Fantom network issue detected:', {
      chainId,
      isFantomChain,
      hasFantomPattern,
      errorMessage,
      recommendation: 'User should switch to BSC Testnet (Chain ID: 97)'
    });
    
    // Log specific guidance
    if (isFantomChain) {
      console.log('💡 Fantom Auto-Detection:', {
        currentNetwork: chainId === 250 ? 'Fantom Opera Mainnet' : 'Fantom Testnet',
        issue: 'Our platform does not support Fantom networks',
        solution: 'User needs to manually switch to BSC Testnet',
        bscTestnetDetails: {
          chainId: 97,
          rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
          chainName: 'BSC Testnet',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          blockExplorerUrl: 'https://testnet.bscscan.com'
        }
      });
    }
  }
  
  return isFantomRelated;
};

/**
 * 🧹 Clean stuck connection state
 */
export const cleanStuckConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (isCleaningInProgress) {
    console.log('🔄 Connection cleanup already in progress');
    return {
      success: false,
      message: 'Connection cleanup already in progress'
    };
  }
  
  isCleaningInProgress = true;
  console.log('🧹 Starting connection cleanup process...');
  
  try {
    // Step 1: Disconnect from wagmi
    try {
      await disconnect(rainbowConfig);
      console.log('✅ Wagmi disconnected successfully');
    } catch (disconnectError) {
      console.warn('⚠️ Wagmi disconnect failed:', disconnectError);
    }
    
    // Step 2: Clear any pending timeouts
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = null;
      console.log('🕒 Pending timeouts cleared');
    }
    
    // Step 3: Wait for MetaMask to settle
    console.log('⏳ Waiting for MetaMask to settle...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Try to clear MetaMask pending state (if possible)
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        console.log('🔄 Attempting to clear MetaMask pending state...');
        // Some MetaMask versions respond to this
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        }).catch(() => {
          // Ignore errors here - we're just trying to clear pending state
        });
      } catch (clearError) {
        // This is expected - we're intentionally causing a rejection to clear pending state
        console.log('🔄 MetaMask pending state clear attempted (rejection expected)');
      }
    }
    
    // Step 5: Additional wait for complete cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Connection cleanup completed successfully');
    
    return {
      success: true,
      message: 'Connection cleanup successful. Ready for new connection attempts.'
    };
    
  } catch (error) {
    console.error('❌ Connection cleanup failed:', error);
    return {
      success: false,
      message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  } finally {
    isCleaningInProgress = false;
  }
};

/**
 * 🔄 Auto-recovery for common connection issues
 */
export const autoRecoverConnection = async (originalError: any, chainId?: number): Promise<{
  shouldRetry: boolean;
  delay: number;
  message: string;
}> => {
  console.log('🔄 Auto-recovery analysis started:', { originalError, chainId });
  
  // Check for Fantom network issues first
  if (detectFantomNetworkIssue(originalError, chainId)) {
    return {
      shouldRetry: false,
      delay: 0,
      message: 'Fantom network detected - user must manually switch to BSC'
    };
  }
  
  // Only auto-recover for specific known issues
  if (!detectPendingPermissionsError(originalError)) {
    console.log('❌ Error not recoverable through auto-recovery');
    return {
      shouldRetry: false,
      delay: 0,
      message: 'Not a recoverable error type'
    };
  }
  
  console.log('🔄 Auto-recovery triggered for connection issue');
  
  // Clean the stuck connection
  const cleanupResult = await cleanStuckConnection();
  
  if (cleanupResult.success) {
    console.log('✅ Auto-recovery successful, ready for retry');
    return {
      shouldRetry: true,
      delay: 2000, // Wait 2 seconds before retry
      message: 'Connection cleaned. System ready for retry in 2 seconds...'
    };
  } else {
    console.log('❌ Auto-recovery cleanup failed');
    return {
      shouldRetry: false,
      delay: 0,
      message: cleanupResult.message
    };
  }
};

/**
 * 🚀 Enhanced connection attempt with auto-recovery
 */
export const robustConnectionAttempt = async (
  connectFunction: () => Promise<any>,
  maxRetries: number = 2,
  currentChainId?: number
): Promise<{
  success: boolean;
  error?: any;
  retriesUsed: number;
}> => {
  let retriesUsed = 0;
  
  console.log(`🚀 Starting robust connection attempt (max ${maxRetries + 1} attempts)`);
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Connection attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const result = await connectFunction();
      
      console.log(`✅ Connection successful on attempt ${attempt + 1}`);
      return {
        success: true,
        retriesUsed: attempt
      };
      
    } catch (error) {
      console.warn(`❌ Connection attempt ${attempt + 1} failed:`, error);
      
      // Check for Fantom network issues
      if (detectFantomNetworkIssue(error, currentChainId)) {
        console.log('🚨 Fantom network detected - stopping retry attempts');
        return {
          success: false,
          error,
          retriesUsed: attempt
        };
      }
      
      // If this isn't the last attempt, try auto-recovery
      if (attempt < maxRetries) {
        const recovery = await autoRecoverConnection(error, currentChainId);
        
        if (recovery.shouldRetry) {
          console.log(`🔄 ${recovery.message}`);
          await new Promise(resolve => setTimeout(resolve, recovery.delay));
          retriesUsed++;
          continue; // Try again
        }
      }
      
      // If we get here, either auto-recovery failed or this was the last attempt
      return {
        success: false,
        error,
        retriesUsed: attempt
      };
    }
  }
  
  // This shouldn't be reached, but just in case
  return {
    success: false,
    error: new Error('Max retries exceeded'),
    retriesUsed: maxRetries
  };
};

/**
 * 🎯 Check if MetaMask is in a stuck state
 */
export const isMetaMaskStuck = (): boolean => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  // Check for common indicators of stuck state
  try {
    // If MetaMask is completely unresponsive, this might throw
    const provider = window.ethereum;
    
    // Look for signs of stuck state in the provider
    if (provider._metamask?.isUnlocked === false) {
      console.log('🔒 MetaMask appears to be locked');
      return true;
    }
    
    // Additional checks could be added here
    return false;
    
  } catch (error) {
    console.warn('MetaMask state check failed:', error);
    return true; // Assume stuck if we can't check
  }
};

/**
 * 📊 Get connection health status
 */
export const getConnectionHealth = () => {
  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;
  const isStuck = isMetaMaskStuck();
  const isCleaningUp = isCleaningInProgress;
  
  const health = {
    hasMetaMask,
    isStuck,
    isCleaningUp,
    canConnect: hasMetaMask && !isStuck && !isCleaningUp,
    recommendation: !hasMetaMask 
      ? 'Install MetaMask' 
      : isStuck 
        ? 'Try cleaning connection'
        : isCleaningUp 
          ? 'Wait for cleanup to complete'
          : 'Ready to connect'
  };
  
  console.log('📊 Connection Health Check:', health);
  
  return health;
}; 