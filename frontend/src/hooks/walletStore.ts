// EIP-6963 Wallet Provider Store
// External store for managing multiple wallet providers

import type { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from '../types/eip6963';
import { WALLET_PRIORITIES } from '../types/eip6963';

// --- GLOBAL STORE ---------------------------------------------------------
// При hot-reload Vite/React создаёт новый модуль, из-за чего локальные
// переменные сбрасываются. Это рвёт pending JSON-RPC из MetaMask, потому что
// discovery перезапускается заново. Держим состояние в глобе, чтобы этого
// не происходило в одной вкладке браузера.

interface WalletDiscoveryState {
  providers: EIP6963ProviderDetail[];
  listeners: (() => void)[];
  discoveryStarted: boolean;
}

const GLOBAL_KEY = '__techHyWalletDiscovery__';
const globalState: WalletDiscoveryState = (globalThis as any)[GLOBAL_KEY] ?? {
  providers: [],
  listeners: [],
  discoveryStarted: false,
};

(globalThis as any)[GLOBAL_KEY] = globalState; // сохраняем между перезагрузками модуля

// NB: переменные-ссылки для удобства чтения, всегда обращаемся к globalState
let listeners = globalState.listeners;
let discoveryStarted = globalState.discoveryStarted;

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
  return globalState.providers.find(p => 
    p.info.rdns === 'io.metamask' || 
    p.info.rdns === 'io.metamask.flask' ||
    p.info.rdns === 'io.metamask.mobile' ||
    p.provider.isMetaMask
  ) || null;
};

const isNonEvmProvider = (d: EIP6963ProviderDetail): boolean => {
  // Phantom, Brave (Solana), любые, где нет request({method: 'eth_requestAccounts'}) или явно Solana
  const rdns = d.info.rdns?.toLowerCase() || '';
  return (
    d.provider.isPhantom ||
    rdns.includes('phantom') ||
    d.provider.isBraveWallet ||
    rdns.includes('solana')
  );
};

/**
 * Handle wallet provider announcement
 */
const handleProviderAnnouncement = (event: EIP6963AnnounceProviderEvent) => {
  const { detail } = event;

  if (isNonEvmProvider(detail)) {
    console.log(`EIP-6963: Ignoring non-EVM provider ${detail.info.name}`);
    return;
  }
  
  // Prevent duplicate providers based on UUID
  if (globalState.providers.some(p => p.info.uuid === detail.info.uuid)) {
    console.log(`EIP-6963: Provider ${detail.info.name} already exists, skipping`);
    return;
  }
  
  console.log(`EIP-6963: New provider announced: ${detail.info.name} (${detail.info.rdns})`);
  
  // Add provider immutably -> новая ссылка для useSyncExternalStore
  const next = sortProvidersByPriority([...globalState.providers, detail]);
  globalState.providers = next;
  
  // Notify all listeners
  globalState.listeners.forEach(listener => listener());
};

/**
 * Initialize EIP-6963 provider discovery
 */
const initializeProviderDiscovery = () => {
  if (globalState.discoveryStarted) return; // уже запущено
  globalState.discoveryStarted = true;

  console.log('EIP-6963: Initializing provider discovery...');

  window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  console.log('EIP-6963: Provider discovery initialized');

  // Безопасно чистим слушатель только при закрытии вкладки
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement);
  });
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
  getProviders: (): EIP6963ProviderDetail[] => globalState.providers,
  
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
    
    return globalState.providers.length > 0 ? globalState.providers[0] : null;
  },
  
  /**
   * Subscribe to provider changes
   */
  subscribe: (callback: () => void) => {
    // Add listener
    globalState.listeners.push(callback);
    
    // Initialize discovery on first subscription
    if (globalState.listeners.length === 1) {
      initializeProviderDiscovery();
    }
    
    // Return cleanup function
    return () => {
      globalState.listeners = globalState.listeners.filter(l => l !== callback);
      // Не выключаем discovery, чтобы не сбивать MetaMask pending window
    };
  },
  
  /**
   * Get current state (for useSyncExternalStore)
   */
  getSnapshot: () => globalState.providers,
  
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