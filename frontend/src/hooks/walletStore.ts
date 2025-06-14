// EIP-6963 Wallet Provider Store
// External store for managing multiple wallet providers

import type { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from '../types/eip6963';
import { WALLET_PRIORITIES } from '../types/eip6963';

// Store state
let providers: EIP6963ProviderDetail[] = [];
let listeners: (() => void)[] = [];

/**
 * Sort providers by priority (MetaMask first)
 */
const sortProvidersByPriority = (providers: EIP6963ProviderDetail[]): EIP6963ProviderDetail[] => {
  return providers.sort((a, b) => {
    const priorityA = WALLET_PRIORITIES[a.info.rdns as keyof typeof WALLET_PRIORITIES] || 999;
    const priorityB = WALLET_PRIORITIES[b.info.rdns as keyof typeof WALLET_PRIORITIES] || 999;
    return priorityA - priorityB;
  });
};

/**
 * Get MetaMask provider specifically
 */
const getMetaMaskProvider = (): EIP6963ProviderDetail | null => {
  return providers.find(p => 
    p.info.rdns === 'io.metamask' || 
    p.info.rdns === 'io.metamask.flask' ||
    p.provider.isMetaMask
  ) || null;
};

/**
 * Handle wallet provider announcement
 */
const handleProviderAnnouncement = (event: EIP6963AnnounceProviderEvent) => {
  const { detail } = event;
  
  // Prevent duplicate providers based on UUID
  if (providers.some(p => p.info.uuid === detail.info.uuid)) {
    console.log(`EIP-6963: Provider ${detail.info.name} already exists, skipping`);
    return;
  }
  
  console.log(`EIP-6963: New provider announced: ${detail.info.name} (${detail.info.rdns})`);
  
  // Add provider to store
  providers = [...providers, detail];
  
  // Sort by priority (MetaMask first)
  providers = sortProvidersByPriority(providers);
  
  // Notify all listeners
  listeners.forEach(listener => listener());
};

/**
 * Initialize EIP-6963 provider discovery
 */
const initializeProviderDiscovery = () => {
  console.log('EIP-6963: Initializing provider discovery...');
  
  // Listen for provider announcements
  window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement);
  
  // Request all available providers
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  
  console.log('EIP-6963: Provider discovery initialized');
};

/**
 * Cleanup EIP-6963 provider discovery
 */
const cleanupProviderDiscovery = () => {
  console.log('EIP-6963: Cleaning up provider discovery...');
  window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement);
};

/**
 * External store for wallet providers
 */
export const walletStore = {
  /**
   * Get current providers
   */
  getProviders: (): EIP6963ProviderDetail[] => providers,
  
  /**
   * Get MetaMask provider specifically
   */
  getMetaMaskProvider,
  
  /**
   * Get preferred provider (MetaMask if available, otherwise first in list)
   */
  getPreferredProvider: (): EIP6963ProviderDetail | null => {
    const metamask = getMetaMaskProvider();
    if (metamask) return metamask;
    
    return providers.length > 0 ? providers[0] : null;
  },
  
  /**
   * Subscribe to provider changes
   */
  subscribe: (callback: () => void) => {
    // Add listener
    listeners.push(callback);
    
    // Initialize discovery on first subscription
    if (listeners.length === 1) {
      initializeProviderDiscovery();
    }
    
    // Return cleanup function
    return () => {
      listeners = listeners.filter(l => l !== callback);
      
      // Cleanup discovery when no more listeners
      if (listeners.length === 0) {
        cleanupProviderDiscovery();
        providers = []; // Reset providers
      }
    };
  },
  
  /**
   * Get current state (for useSyncExternalStore)
   */
  getSnapshot: () => providers,
  
  /**
   * Get server snapshot (for SSR)
   */
  getServerSnapshot: () => [],
};

/**
 * Legacy fallback for window.ethereum detection
 */
export const detectLegacyProvider = (): any => {
  console.log('EIP-6963: Falling back to legacy window.ethereum detection');
  
  // Try to find MetaMask specifically
  if (window.ethereum?.isMetaMask && !window.ethereum?.isPhantom && !window.ethereum?.isBraveWallet) {
    console.log('Legacy: MetaMask detected via window.ethereum.isMetaMask');
    return window.ethereum;
  }
  
  // Try EIP-6963 providers array (some wallets use this)
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    const metaMaskProvider = window.ethereum.providers.find((p: any) => 
      p.isMetaMask && !p.isPhantom && !p.isBraveWallet
    );
    if (metaMaskProvider) {
      console.log('Legacy: MetaMask detected via window.ethereum.providers');
      return metaMaskProvider;
    }
  }
  
  // Last resort - use window.ethereum if it exists
  if (window.ethereum) {
    console.log('Legacy: Using window.ethereum as fallback');
    return window.ethereum;
  }
  
  console.log('Legacy: No Ethereum provider found');
  return null;
}; 