/**
 * 🔧 Auto Network Fixer (Invisible)
 * 
 * Automatically detects and fixes network issues (like Fantom) in the background
 * No UI shown to users - only logs and auto-corrections
 */

import { useEffect } from 'react';
import { useChainId } from 'wagmi';
import { 
  checkNetworkCompatibility, 
  smartNetworkSwitch, 
  getRecommendedNetwork,
  KNOWN_UNSUPPORTED_NETWORKS 
} from '../lib/networkSwitcher';
import { autoRecoverConnection } from '../lib/connectionCleaner';

interface NetworkAlertProps {
  className?: string;
  showDismiss?: boolean;
  compact?: boolean;
}

export const NetworkAlert: React.FC<NetworkAlertProps> = () => {
  const currentChainId = useChainId();

  useEffect(() => {
    if (!currentChainId) return;

    const networkCompatibility = checkNetworkCompatibility(currentChainId);

    // Only auto-fix for known problematic networks (like Fantom)
    if (!networkCompatibility.isCompatible && currentChainId in KNOWN_UNSUPPORTED_NETWORKS) {
      const networkInfo = KNOWN_UNSUPPORTED_NETWORKS[currentChainId as keyof typeof KNOWN_UNSUPPORTED_NETWORKS];
      
      console.log(`🚨 Unsupported network detected: ${networkInfo.displayName} (Chain ID: ${currentChainId})`);
      console.log(`💡 Auto-suggestion: ${networkInfo.suggestion}`);
      
      // Special handling for Fantom networks
      if (currentChainId === 250 || currentChainId === 4002) {
        console.log('🔧 Fantom network detected - this is not supported by our platform');
        console.log('📝 Users should manually switch to BSC Testnet (Chain ID: 97)');
        
        // Log detailed info for debugging
        console.log('🔍 Network compatibility check:', {
          currentChainId,
          networkName: networkInfo.displayName,
          isCompatible: networkCompatibility.isCompatible,
          recommendedNetwork: networkCompatibility.recommendedNetwork?.displayName,
          message: networkCompatibility.message
        });
      }
    }
  }, [currentChainId]);

  // Return nothing - this component is invisible
  return null;
};

export default NetworkAlert; 