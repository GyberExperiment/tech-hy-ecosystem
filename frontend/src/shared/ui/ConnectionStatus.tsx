import React from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { useWeb3 } from '../lib/Web3Context';
import { cn } from '../lib/cn';

interface ConnectionStatusProps {
  className?: string;
  compact?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className, compact = false }) => {
  const { metaMaskAvailable, isConnected, isCorrectNetwork, chainId } = useWeb3();

  // Status determination
  const getConnectionStatus = () => {
    if (!metaMaskAvailable) {
      return {
        type: 'error' as const,
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask to use this application',
        action: 'Install MetaMask',
        actionUrl: 'https://metamask.io/download/'
      };
    }

    if (!isConnected) {
      return {
        type: 'warning' as const,
        title: 'Wallet Not Connected',
        description: 'Connect your wallet to access all features',
        action: 'Connect Wallet',
        actionUrl: null
      };
    }

    if (!isCorrectNetwork) {
      return {
        type: 'warning' as const,
        title: 'Wrong Network',
        description: `Please switch to BSC Testnet or Mainnet (current: ${chainId})`,
        action: 'Switch Network',
        actionUrl: null
      };
    }

    return {
      type: 'success' as const,
      title: 'Connected',
      description: 'Wallet connected and ready',
      action: null,
      actionUrl: null
    };
  };

  const status = getConnectionStatus();

  const statusConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      textColor: 'text-green-400',
      iconColor: 'text-green-400'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      textColor: 'text-yellow-400',
      iconColor: 'text-yellow-400'
    },
    error: {
      icon: WifiOff,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      textColor: 'text-red-400',
      iconColor: 'text-red-400'
    }
  };

  const config = statusConfig[status.type];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}>
        <Icon className={cn("w-4 h-4", config.iconColor)} />
        <span className={cn("text-sm font-medium", config.textColor)}>
          {status.title}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start space-x-3">
        <Icon className={cn("w-5 h-5 mt-0.5", config.iconColor)} />
        <div className="flex-1">
          <h4 className={cn("font-medium mb-1", config.textColor)}>
            {status.title}
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            {status.description}
          </p>
          
          {status.action && status.actionUrl && (
            <a
              href={status.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                status.type === 'error' 
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
              )}
            >
              <span>{status.action}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {status.action && !status.actionUrl && (
            <div className="text-sm text-gray-400">
              Use the Connect Wallet button in the header
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Mini connection indicator for header
export const ConnectionIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { metaMaskAvailable, isConnected, isCorrectNetwork } = useWeb3();

  const getIndicatorStatus = () => {
    if (!metaMaskAvailable) return 'error';
    if (!isConnected) return 'warning';
    if (!isCorrectNetwork) return 'warning';
    return 'success';
  };

  const status = getIndicatorStatus();
  
  const statusColors = {
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    error: 'bg-red-400'
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        statusColors[status],
        status !== 'success' && "animate-pulse"
      )} />
      {!metaMaskAvailable && (
        <Wifi className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );
};

export default ConnectionStatus; 