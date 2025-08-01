/**
 * 🚀 Advanced Wallet Connection System
 * 
 * Based on EIP-6963 Multi-Wallet Discovery and MetaMask best practices
 * Handles BSC connections, Fantom conflicts, and permission management
 */

import { disconnect, reconnect } from '@wagmi/core';
import { rainbowConfig } from '../../config/rainbowkit';
import { cleanStuckConnection, detectFantomNetworkIssue } from './connectionCleaner';

// EIP-6963 Provider Types
interface EIP6963ProviderInfo {
  walletId: string;
  uuid: string;
  name: string;
  icon: string;
}

interface EIP1193Provider {
  isMetaMask?: boolean;
  request: (request: { method: string; params?: Array<any> }) => Promise<any>;
  on?: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener?: (eventName: string, handler: (...args: any[]) => void) => void;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

// Global provider store
let availableProviders: EIP6963ProviderDetail[] = [];
let isDiscoveryActive = false;

/**
 * 🔍 Initialize EIP-6963 Provider Discovery
 */
export const initializeProviderDiscovery = (): Promise<EIP6963ProviderDetail[]> => {
  return new Promise((resolve) => {
    if (isDiscoveryActive) {
      resolve(availableProviders);
      return;
    }

    console.log('🔍 Starting EIP-6963 provider discovery...');
    isDiscoveryActive = true;

    // Listen for provider announcements
    const handleProviderAnnouncement = (event: CustomEvent<EIP6963ProviderDetail>) => {
      const { detail } = event;
      
      // Prevent duplicates
      if (availableProviders.some(p => p.info.uuid === detail.info.uuid)) {
        return;
      }

      console.log('📢 New wallet provider discovered:', detail.info.name);
      availableProviders.push(detail);
    };

    // Set up event listener
    window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener);

    // Request providers to announce themselves
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Wait a bit for providers to announce, then resolve
    setTimeout(() => {
      console.log(`✅ Provider discovery complete. Found ${availableProviders.length} providers:`, 
        availableProviders.map(p => p.info.name));
      resolve(availableProviders);
    }, 100);
  });
};

/**
 * 🔧 Advanced MetaMask Connection with Error Recovery
 */
export const connectMetaMaskAdvanced = async (): Promise<{
  success: boolean;
  accounts?: string[];
  chainId?: number;
  error?: any;
  provider?: EIP1193Provider;
}> => {
  console.log('🚀 Starting advanced MetaMask connection...');

  try {
    // Step 1: Discover available providers
    const providers = await initializeProviderDiscovery();
    
    // Step 2: Find MetaMask provider
    let metaMaskProvider = providers.find(p => 
      p.info.name.toLowerCase().includes('metamask') || 
      p.provider.isMetaMask
    )?.provider;

    // Fallback to window.ethereum if no EIP-6963 provider found
    if (!metaMaskProvider && typeof window !== 'undefined' && window.ethereum) {
      console.log('⚡ Using fallback window.ethereum provider');
      metaMaskProvider = window.ethereum as EIP1193Provider;
    }

    if (!metaMaskProvider) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    // Step 3: Check for existing permissions
    console.log('🔍 Checking existing permissions...');
    let existingPermissions;
    try {
      existingPermissions = await metaMaskProvider.request({
        method: 'wallet_getPermissions'
      });
    } catch (permError) {
      console.log('⚠️ Could not get existing permissions:', permError);
    }

    // Step 4: Request accounts (this implicitly requests permissions)
    console.log('🔐 Requesting account access...');
    const accounts = await metaMaskProvider.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask');
    }

    // Step 5: Get current chain ID
    const chainId = await metaMaskProvider.request({
      method: 'eth_chainId'
    });

    const chainIdNumber = parseInt(chainId, 16);
    
    // Step 6: Check for Fantom network issues
    if (detectFantomNetworkIssue(null, chainIdNumber)) {
      console.log('🚨 Fantom network detected - connection successful but network not supported');
      // Don't throw error, just log the issue
    }

    console.log('✅ Advanced MetaMask connection successful:', {
      accounts: accounts.length,
      chainId: chainIdNumber,
      provider: 'MetaMask'
    });

    return {
      success: true,
      accounts,
      chainId: chainIdNumber,
      provider: metaMaskProvider
    };

  } catch (error: any) {
    console.error('❌ Advanced MetaMask connection failed:', error);

    // Handle specific errors
    if (error.code === -32002) {
      console.log('🔧 Attempting to clean stuck connection...');
      await cleanStuckConnection();
      
      // Retry once after cleanup
      try {
        const retryAccounts = await metaMaskProvider!.request({
          method: 'eth_requestAccounts'
        });
        
        if (retryAccounts && retryAccounts.length > 0) {
          console.log('✅ Connection successful after cleanup');
          return {
            success: true,
            accounts: retryAccounts,
            provider: metaMaskProvider
          };
        }
      } catch (retryError) {
        console.log('❌ Retry after cleanup failed:', retryError);
      }
    }

    return {
      success: false,
      error
    };
  }
};

/**
 * 🔄 Smart Wallet Reconnection
 */
export const smartWalletReconnect = async (): Promise<boolean> => {
  console.log('🔄 Attempting smart wallet reconnection...');

  try {
    // Step 1: Clean any stuck connections
    await cleanStuckConnection();

    // Step 2: Try to reconnect with wagmi
    await reconnect(rainbowConfig);

    console.log('✅ Smart reconnection successful');
    return true;

  } catch (error) {
    console.error('❌ Smart reconnection failed:', error);
    return false;
  }
};

/**
 * 🧹 Complete Connection Reset
 */
export const resetAllConnections = async (): Promise<void> => {
  console.log('🧹 Resetting all wallet connections...');

  try {
    // Step 1: Disconnect from wagmi
    await disconnect(rainbowConfig);

    // Step 2: Clean stuck connections
    await cleanStuckConnection();

    // Step 3: Clear local state
    availableProviders = [];
    isDiscoveryActive = false;

    // Step 4: Revoke permissions if possible
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
        console.log('🔓 Permissions revoked successfully');
      } catch (revokeError) {
        console.log('⚠️ Could not revoke permissions:', revokeError);
      }
    }

    console.log('✅ All connections reset');

  } catch (error) {
    console.error('❌ Connection reset failed:', error);
  }
};

/**
 * 🎯 BSC-Optimized Connection Flow
 */
export const connectToBSC = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  console.log('🎯 Starting BSC-optimized connection flow...');

  try {
    // Step 1: Connect to MetaMask
    const connectionResult = await connectMetaMaskAdvanced();
    
    if (!connectionResult.success) {
      return {
        success: false,
        message: `Connection failed: ${connectionResult.error?.message || 'Unknown error'}`
      };
    }

    // Step 2: Check if user is on BSC
    const { chainId } = connectionResult;
    const isBSC = chainId === 56 || chainId === 97; // BSC Mainnet or Testnet

    if (!isBSC) {
      // Log the current network for debugging
      console.log(`🔍 User is on chain ID ${chainId}, not BSC`);
      
      if (chainId === 250 || chainId === 4002) {
        return {
          success: false,
          message: 'Fantom network detected. Please switch to BSC Testnet (Chain ID: 97) manually.'
        };
      }

      return {
        success: false,
        message: `Please switch to BSC network. Current network: Chain ID ${chainId}`
      };
    }

    console.log('✅ Successfully connected to BSC');
    return {
      success: true,
      message: `Connected to BSC ${chainId === 56 ? 'Mainnet' : 'Testnet'}`
    };

  } catch (error: any) {
    console.error('❌ BSC connection flow failed:', error);
    return {
      success: false,
      message: `BSC connection failed: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * 📊 Connection Health Monitor
 */
export const monitorConnectionHealth = () => {
  const healthStatus = {
    providersAvailable: availableProviders.length,
    discoveryActive: isDiscoveryActive,
    hasMetaMask: typeof window !== 'undefined' && !!window.ethereum,
    timestamp: new Date().toISOString()
  };

  console.log('📊 Connection Health Status:', healthStatus);
  return healthStatus;
};

// Export types for external use
export type { EIP6963ProviderDetail, EIP1193Provider, EIP6963ProviderInfo }; 