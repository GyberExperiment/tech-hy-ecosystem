import React from 'react'
import { getDefaultConfig, RainbowKitProvider as RKProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { bscTestnet } from 'wagmi/chains'

// Configure Rainbow Kit
const config = getDefaultConfig({
  appName: 'TECH HY Ecosystem',
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [bscTestnet],
  ssr: false,
})

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

interface RainbowKitProviderProps {
  children: React.ReactNode
}

export const RainbowKitProvider: React.FC<RainbowKitProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RKProvider 
          theme={{
            colors: {
              accentColor: '#6366f1',
              accentColorForeground: 'white',
              actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
              actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
              actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.08)',
              closeButton: 'rgba(255, 255, 255, 0.7)',
              closeButtonBackground: 'rgba(255, 255, 255, 0.1)',
              connectButtonBackground: '#6366f1',
              connectButtonBackgroundError: '#ef4444',
              connectButtonInnerBackground: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)',
              connectButtonText: 'white',
              connectButtonTextError: 'white',
              connectionIndicator: '#10b981',
              downloadBottomCardBackground: 'rgba(15, 23, 42, 0.95)',
              downloadTopCardBackground: 'rgba(15, 23, 42, 0.95)',
              error: '#ef4444',
              generalBorder: 'rgba(255, 255, 255, 0.15)',
              generalBorderDim: 'rgba(255, 255, 255, 0.05)',
              menuItemBackground: 'rgba(255, 255, 255, 0.08)',
              modalBackdrop: 'rgba(0, 0, 0, 0.7)',
              modalBackground: 'rgba(15, 23, 42, 0.95)',
              modalBorder: 'rgba(255, 255, 255, 0.15)',
              modalText: 'white',
              modalTextDim: 'rgba(255, 255, 255, 0.7)',
              modalTextSecondary: 'rgba(255, 255, 255, 0.8)',
              profileAction: 'rgba(255, 255, 255, 0.1)',
              profileActionHover: 'rgba(255, 255, 255, 0.15)',
              profileForeground: 'rgba(15, 23, 42, 0.95)',
              selectedOptionBorder: '#6366f1',
              standby: '#f59e0b',
            },
            radii: {
              actionButton: '16px',
              connectButton: '16px',
              menuButton: '16px',
              modal: '24px',
              modalMobile: '20px',
            },
            shadows: {
              connectButton: '0 8px 32px rgba(99, 102, 241, 0.3)',
              dialog: '0 24px 64px rgba(0, 0, 0, 0.5), 0 12px 32px rgba(0, 0, 0, 0.3)',
              profileDetailsAction: '0 4px 16px rgba(0, 0, 0, 0.2)',
              selectedOption: '0 8px 32px rgba(99, 102, 241, 0.3)',
              selectedWallet: '0 8px 32px rgba(99, 102, 241, 0.3)',
              walletLogo: '0 4px 16px rgba(0, 0, 0, 0.2)',
            },
            fonts: {
              body: 'Inter, system-ui, -apple-system, sans-serif',
            },
          }}
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