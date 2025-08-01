import React, { useEffect } from 'react'
import { RainbowKitProvider as RKProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { rainbowConfig, customTheme } from '../config/rainbowkit'
import { handleRpcFailure, resetAllConnectionStates } from '../shared/lib/rpcRecovery'

// Create Query Client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Обработка ошибок запросов
      onError: (error: any) => {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('JsonRpcProvider')) {
          handleRpcFailure(error);
        }
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

  // Глобальная обработка unhandled rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('JsonRpcProvider') || 
          event.reason?.message?.includes('CORS') ||
          event.reason?.code === 'NETWORK_ERROR') {
        console.warn('🚨 Unhandled RPC rejection caught:', event.reason);
        handleRpcFailure(event.reason);
        event.preventDefault(); // Предотвращаем вывод в консоль
      }
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