// React hook for EIP-6963 wallet providers
// Uses useSyncExternalStore for optimal React integration

import { useSyncExternalStore } from 'react';
import { walletStore } from './walletStore';
import type { EIP6963ProviderDetail } from '../types/eip6963';

/**
 * Hook to get all available wallet providers
 */
export const useWalletProviders = (): EIP6963ProviderDetail[] => {
  return useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getSnapshot,
    walletStore.getServerSnapshot
  );
};

/**
 * Hook to get MetaMask provider specifically
 */
export const useMetaMaskProvider = (): EIP6963ProviderDetail | null => {
  const providers = useWalletProviders();
  return walletStore.getMetaMaskProvider();
};

/**
 * Hook to get preferred provider (MetaMask first, then others)
 */
export const usePreferredProvider = (): EIP6963ProviderDetail | null => {
  const providers = useWalletProviders();
  return walletStore.getPreferredProvider();
};

/**
 * Hook to check if MetaMask is available
 */
export const useIsMetaMaskAvailable = (): boolean => {
  const metamask = useMetaMaskProvider();
  return metamask !== null;
};

/**
 * Hook to get provider count
 */
export const useProviderCount = (): number => {
  const providers = useWalletProviders();
  return providers.length;
}; 