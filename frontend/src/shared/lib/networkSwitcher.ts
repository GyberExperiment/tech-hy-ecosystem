/**
 * 🌐 Smart Network Switcher & Detection
 * 
 * Handles network conflicts and provides user-friendly switching for dApps
 * Specifically designed to handle Fantom -> BSC network conflicts
 */

import { bscTestnet, bsc } from 'wagmi/chains';
import { switchNetwork as wagmiSwitchNetwork } from '@wagmi/core';
import { rainbowConfig } from '../../config/rainbowkit';

// Supported networks mapping
export const SUPPORTED_NETWORKS = {
  56: {
    name: 'BSC Mainnet',
    chain: bsc,
    displayName: 'Binance Smart Chain',
    isMainnet: true
  },
  97: {
    name: 'BSC Testnet', 
    chain: bscTestnet,
    displayName: 'BSC Testnet',
    isMainnet: false
  }
} as const;

// Common problematic networks users might be on
export const KNOWN_UNSUPPORTED_NETWORKS = {
  250: {
    name: 'Fantom Opera',
    displayName: 'Fantom',
    suggestion: 'Please switch to BSC Testnet to use our platform'
  },
  4002: {
    name: 'Fantom Testnet',
    displayName: 'Fantom Testnet', 
    suggestion: 'Please switch to BSC Testnet to use our platform'
  },
  1: {
    name: 'Ethereum Mainnet',
    displayName: 'Ethereum',
    suggestion: 'Please switch to BSC Testnet for lower fees'
  },
  137: {
    name: 'Polygon',
    displayName: 'Polygon',
    suggestion: 'Please switch to BSC Testnet to use our platform'
  },
  43114: {
    name: 'Avalanche',
    displayName: 'Avalanche',
    suggestion: 'Please switch to BSC Testnet to use our platform'
  }
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_NETWORKS;
export type UnsupportedChainId = keyof typeof KNOWN_UNSUPPORTED_NETWORKS;

/**
 * 🔍 Check if network is supported
 */
export const isSupportedNetwork = (chainId: number | undefined): chainId is SupportedChainId => {
  return chainId !== undefined && chainId in SUPPORTED_NETWORKS;
};

/**
 * 🚨 Get network information for unsupported networks
 */
export const getUnsupportedNetworkInfo = (chainId: number | undefined) => {
  if (!chainId || !(chainId in KNOWN_UNSUPPORTED_NETWORKS)) {
    return {
      name: 'Unknown Network',
      displayName: `Unknown Network (${chainId})`,
      suggestion: 'Please switch to BSC Testnet to use our platform'
    };
  }
  
  return KNOWN_UNSUPPORTED_NETWORKS[chainId as UnsupportedChainId];
};

/**
 * 🔄 Smart network switch with user-friendly error handling
 */
export const smartNetworkSwitch = async (targetChainId: SupportedChainId): Promise<{
  success: boolean;
  error?: string;
  userMessage?: string;
}> => {
  try {
    console.log(`🔄 Attempting to switch to network ${targetChainId}...`);
    
    await wagmiSwitchNetwork(rainbowConfig, { 
      chainId: targetChainId 
    });
    
    console.log(`✅ Successfully switched to network ${targetChainId}`);
    return { 
      success: true, 
      userMessage: `Successfully switched to ${SUPPORTED_NETWORKS[targetChainId].displayName}` 
    };
    
  } catch (error: any) {
    console.error('❌ Network switch failed:', error);
    
    // Handle specific error cases
    if (error.code === 4902) {
      return {
        success: false,
        error: 'NETWORK_NOT_ADDED',
        userMessage: `${SUPPORTED_NETWORKS[targetChainId].displayName} is not added to your MetaMask. Please add it manually.`
      };
    }
    
    if (error.code === 4001) {
      return {
        success: false,
        error: 'USER_REJECTED',
        userMessage: 'Network switch was cancelled. Please switch manually to continue.'
      };
    }
    
    if (error.message?.includes('disconnect')) {
      return {
        success: false,
        error: 'CONNECTION_LOST',
        userMessage: 'Connection lost. Please reconnect your wallet and try again.'
      };
    }
    
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      userMessage: `Failed to switch network: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * 🎯 Get recommended target network
 */
export const getRecommendedNetwork = (): SupportedChainId => {
  // For now, always recommend testnet
  // In future, this could be based on environment or user preference
  return 97; // BSC Testnet
};

/**
 * 🔍 Network compatibility check
 */
export const checkNetworkCompatibility = (currentChainId: number | undefined) => {
  if (!currentChainId) {
    return {
      isCompatible: false,
      needsSwitch: true,
      currentNetwork: null,
      recommendedNetwork: SUPPORTED_NETWORKS[getRecommendedNetwork()],
      message: 'No network detected. Please connect to BSC Testnet.'
    };
  }
  
  if (isSupportedNetwork(currentChainId)) {
    return {
      isCompatible: true,
      needsSwitch: false,
      currentNetwork: SUPPORTED_NETWORKS[currentChainId],
      recommendedNetwork: null,
      message: 'Network is compatible.'
    };
  }
  
  const unsupportedInfo = getUnsupportedNetworkInfo(currentChainId);
  const recommendedNetwork = SUPPORTED_NETWORKS[getRecommendedNetwork()];
  
  return {
    isCompatible: false,
    needsSwitch: true,
    currentNetwork: {
      name: unsupportedInfo.name,
      displayName: unsupportedInfo.displayName,
      chainId: currentChainId
    },
    recommendedNetwork,
    message: unsupportedInfo.suggestion
  };
}; 