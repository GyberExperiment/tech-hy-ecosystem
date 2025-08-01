import React, { useEffect } from 'react'
import { RainbowKitProvider as RKProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { rainbowConfig, customTheme } from '../config/rainbowkit'
import { handleRpcFailure, resetAllConnectionStates } from '../shared/lib/rpcRecovery'
import { detectPendingPermissionsError, autoRecoverConnection } from '../shared/lib/connectionCleaner'

// Create Query Client with enhanced error handling (logging only)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Silent error handling with detailed logging
      onError: (error: any) => {
        console.log('🔍 QueryClient caught error:', error);
        
        // Handle RPC/Network errors
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('JsonRpcProvider')) {
          console.log('🌐 RPC/Network error detected, attempting recovery...');
          handleRpcFailure(error);
          return;
        }
        
        // Handle MetaMask connection errors
        if (detectPendingPermissionsError(error)) {
          console.log('🚨 MetaMask permissions error detected, attempting auto-recovery...');
          autoRecoverConnection(error).then(recovery => {
            console.log('🔧 Auto-recovery result:', {
              shouldRetry: recovery.shouldRetry,
              delay: recovery.delay,
              message: recovery.message
            });
          });
          return;
        }
        
        // Handle other wallet errors
        if (error?.code === 4001) {
          console.log('👤 User rejected wallet request');
          return;
        }
        
        if (error?.code === -32002) {
          console.log('⏳ Permission request already pending in MetaMask');
          return;
        }
        
        // Log unhandled errors
        console.warn('❓ Unhandled query error:', error);
      }
    },
  },
})

interface RainbowKitProviderProps {
  children: React.ReactNode
}

export const RainbowKitProvider: React.FC<RainbowKitProviderProps> = ({ children }) => {
  // Сброс состояний при размонтировании компонента
  useEffect(() => {
    return () => {
      resetAllConnectionStates();
    };
  }, []);

  // Enhanced global unhandled rejection handler (logging only)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Handle RPC errors
      if (error?.message?.includes('JsonRpcProvider') || 
          error?.message?.includes('CORS') ||
          error?.code === 'NETWORK_ERROR') {
        console.warn('🚨 Unhandled RPC rejection caught:', error);
        handleRpcFailure(error);
        event.preventDefault();
        return;
      }
      
      // Handle MetaMask permission errors
      if (detectPendingPermissionsError(error)) {
        console.warn('🚨 Unhandled MetaMask permission rejection caught:', error);
        autoRecoverConnection(error).then(recovery => {
          console.log('🔄 Background auto-recovery:', recovery.message);
        });
        event.preventDefault();
        return;
      }
      
      // Handle other common MetaMask errors
      if (error?.code === -32002) {
        console.warn('⏳ MetaMask request already pending (unhandled rejection)');
        event.preventDefault();
        return;
      }
      
      if (error?.code === 4001 && error?.message?.includes('User rejected')) {
        console.log('👤 User rejected request (unhandled rejection)');
        event.preventDefault();
        return;
      }
      
      // Log other unhandled rejections for debugging
      console.warn('❓ Unhandled rejection (not wallet-related):', error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <WagmiProvider config={rainbowConfig}>
      <QueryClientProvider client={queryClient}>
        <RKProvider 
          theme={customTheme}
          modalSize="compact"
          coolMode
          showRecentTransactions={true}
        >
          {children}
        </RKProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 