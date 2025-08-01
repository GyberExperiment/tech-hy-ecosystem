import React, { useState } from 'react';

import { useSwitchChain, useChainId } from 'wagmi';
import { Lock, AlertTriangle, LucideIcon, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { bscTestnet } from 'wagmi/chains';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { checkNetworkCompatibility, smartNetworkSwitch, getRecommendedNetwork } from '../lib/networkSwitcher';
import { cleanStuckConnection, getConnectionHealth } from '../lib/connectionCleaner';

interface PageConnectionPromptProps {
  // Page specific customization
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  iconColor?: string;
  titleGradient?: string;
  
  // Connection states
  isConnected?: boolean;
  isCorrectNetwork?: boolean;
  
  // Optional custom content
  children?: React.ReactNode;
}

export const PageConnectionPrompt: React.FC<PageConnectionPromptProps> = ({
  title,
  subtitle,
  icon: CustomIcon = Lock,
  iconColor = 'text-gray-400',
  titleGradient = 'from-blue-400 to-purple-500',
  isConnected = false,
  isCorrectNetwork = false,
  children
}) => {
  const { t } = useTranslation();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isCleaningConnection, setIsCleaningConnection] = useState(false);

  // Get detailed network compatibility info
  const networkCompatibility = checkNetworkCompatibility(currentChainId);
  const connectionHealth = getConnectionHealth();

  const handleSmartNetworkSwitch = async () => {
    setIsSwitching(true);
    try {
      const recommendedNetwork = getRecommendedNetwork();
      const result = await smartNetworkSwitch(recommendedNetwork);
      
      if (result.success) {
        toast.success(result.userMessage || 'Network switched successfully');
      } else {
        toast.error(result.userMessage || 'Failed to switch network');
      }
    } catch (error: any) {
      toast.error('Network switch failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsSwitching(false);
    }
  };

  const handleConnectionCleanup = async () => {
    setIsCleaningConnection(true);
    try {
      const result = await cleanStuckConnection();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Cleanup failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsCleaningConnection(false);
    }
  };

  // Wrong network state  
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-3xl font-bold mb-4 text-red-400">
            Unsupported Network Detected
          </h2>
          
          {/* Show current network info */}
          {networkCompatibility.currentNetwork && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 font-semibold">
                Currently connected to: {networkCompatibility.currentNetwork.displayName}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {networkCompatibility.message}
              </p>
            </div>
          )}
          
          <p className="text-xl text-gray-400 mb-8">
            Switch to {networkCompatibility.recommendedNetwork?.displayName || 'BSC Testnet'} to use our platform
          </p>
          
          {/* Action buttons */}
          <div className="space-y-4">
            <button
              onClick={handleSmartNetworkSwitch}
              disabled={isSwitching}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className={`w-5 h-5 ${isSwitching ? 'animate-spin' : ''}`} />
              <span>
                {isSwitching ? 'Switching...' : `Switch to ${networkCompatibility.recommendedNetwork?.displayName || 'BSC Testnet'}`}
              </span>
            </button>
            
            {/* Connection cleanup button for stuck connections */}
            {!connectionHealth.canConnect && (
              <button
                onClick={handleConnectionCleanup}
                disabled={isCleaningConnection}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
              >
                <WifiOff className={`w-4 h-4 ${isCleaningConnection ? 'animate-spin' : ''}`} />
                <span>
                  {isCleaningConnection ? 'Cleaning...' : 'Fix Connection Issues'}
                </span>
              </button>
            )}
            
            <div className="text-sm text-gray-500">
              <p>Or add BSC Testnet manually:</p>
              <div className="mt-2 bg-gray-800/50 rounded-lg p-3 text-left text-xs font-mono">
                <div>Network Name: BSC Testnet</div>
                <div>RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545</div>
                <div>Chain ID: 97</div>
                <div>Symbol: BNB</div>
                <div>Explorer: https://testnet.bscscan.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <CustomIcon className={`w-16 h-16 mx-auto mb-4 ${iconColor}`} />
          <h2 className={`text-3xl font-bold mb-4 bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
            {title}
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="text-lg text-gray-300">
            {t('common:messages.connectWallet')}
          </div>
          {children && (
            <div className="mt-8">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If connected and correct network, don't render anything
  return null;
};

export default PageConnectionPrompt; 