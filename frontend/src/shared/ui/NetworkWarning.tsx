import React from 'react';
import { AlertTriangle, Wifi, ArrowRight } from 'lucide-react';
import { cn } from '../lib/cn';

interface NetworkWarningProps {
  className?: string;
  currentChainId?: number;
  supportedNetworks?: { id: number; name: string; rpc?: string }[];
  onSwitchNetwork?: (chainId: number) => void;
  variant?: 'banner' | 'card' | 'inline';
  autoHide?: boolean;
  hideAfter?: number;
}

const DEFAULT_NETWORKS = [
  { id: 56, name: 'BSC Mainnet', rpc: 'https://bsc-dataseed.binance.org/' },
  { id: 97, name: 'BSC Testnet', rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/' },
];

export const NetworkWarning: React.FC<NetworkWarningProps> = ({
  className = '',
  currentChainId,
  supportedNetworks = DEFAULT_NETWORKS,
  onSwitchNetwork,
  variant = 'banner',
  autoHide = false,
  hideAfter = 5000,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  // Auto-hide functionality
  React.useEffect(() => {
    if (autoHide && hideAfter > 0) {
      const timer = setTimeout(() => setIsVisible(false), hideAfter);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideAfter]);

  // Don't show if network is supported
  const isSupported = supportedNetworks.some(network => network.id === currentChainId);
  if (isSupported || !isVisible) return null;

  const getCurrentNetworkName = () => {
    const networkNames: Record<number, string> = {
      1: 'Ethereum Mainnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Polygon Mumbai',
      43114: 'Avalanche',
      43113: 'Avalanche Fuji',
      250: 'Fantom',
      4002: 'Fantom Testnet',
    };
    
    return currentChainId ? networkNames[currentChainId] || `Network ${currentChainId}` : 'Unknown Network';
  };

  const handleSwitchNetwork = async (chainId: number) => {
    if (onSwitchNetwork) {
      onSwitchNetwork(chainId);
      return;
    }

    // Default MetaMask network switch
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (error: any) {
        // Chain not added to MetaMask
        if (error.code === 4902) {
          const network = supportedNetworks.find(n => n.id === chainId);
          if (network?.rpc) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${chainId.toString(16)}`,
                  chainName: network.name,
                  rpcUrls: [network.rpc],
                  nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18,
                  },
                  blockExplorerUrls: chainId === 56 
                    ? ['https://bscscan.com/']
                    : ['https://testnet.bscscan.com/'],
                }],
              });
            } catch (addError) {
              console.error('Failed to add network:', addError);
            }
          }
        }
      }
    }
  };

  const variantClasses = {
    banner: 'w-full rounded-none',
    card: 'rounded-xl border border-orange-400/30',
    inline: 'rounded-lg',
  };

  const sizeClasses = {
    banner: 'p-4',
    card: 'p-6',
    inline: 'p-3',
  };

  return (
    <div className={cn(
      'bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-xl border-orange-400/20',
      variantClasses[variant],
      sizeClasses[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400/20 to-red-400/20 border border-orange-400/30 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-semibold text-orange-300 mb-1">
            Unsupported Network
          </h4>

          {/* Description */}
          <p className="text-sm text-slate-300 mb-3">
            You're connected to <span className="font-medium text-orange-200">{getCurrentNetworkName()}</span>.
            Please switch to one of the supported networks to continue.
          </p>

          {/* Supported Networks */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">Supported networks:</p>
            <div className={cn(
              'flex gap-2',
              variant === 'banner' ? 'flex-wrap' : 'flex-col sm:flex-row'
            )}>
              {supportedNetworks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleSwitchNetwork(network.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/20 hover:border-blue-400/40 rounded-lg transition-all duration-300 text-sm text-blue-200 hover:text-blue-100"
                >
                  <Wifi className="w-3 h-3" />
                  <span>{network.name}</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Close Button for auto-hide variant */}
          {autoHide && (
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-400/20 hover:bg-orange-400/30 border border-orange-400/20 flex items-center justify-center transition-all duration-300"
            >
              <span className="text-orange-300 text-xs">×</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook для удобного использования
export const useNetworkValidation = (
  chainId?: number,
  supportedNetworks = DEFAULT_NETWORKS
) => {
  const isSupported = React.useMemo(() => {
    return supportedNetworks.some(network => network.id === chainId);
  }, [chainId, supportedNetworks]);

  const networkInfo = React.useMemo(() => {
    if (!chainId) return { name: 'Unknown', supported: false };
    
    const supportedNetwork = supportedNetworks.find(n => n.id === chainId);
    if (supportedNetwork) {
      return { name: supportedNetwork.name, supported: true };
    }

    const networkNames: Record<number, string> = {
      1: 'Ethereum Mainnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Polygon Mumbai',
      43114: 'Avalanche',
      43113: 'Avalanche Fuji',
      250: 'Fantom',
      4002: 'Fantom Testnet',
    };

    return {
      name: networkNames[chainId] || `Network ${chainId}`,
      supported: false,
    };
  }, [chainId, supportedNetworks]);

  return {
    isSupported,
    networkInfo,
    supportedNetworks,
  };
}; 