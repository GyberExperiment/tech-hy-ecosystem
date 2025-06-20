import React, { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const WalletDebug: React.FC = () => {
  const { t } = useTranslation('common');
  const { address, isConnected, connector } = useAccount();
  const { connectors, error, isLoading, pendingConnector } = useConnect();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkWalletEnvironment = () => {
      const info = {
        hasEthereum: !!window.ethereum,
        hasMetaMask: !!(window.ethereum as any)?.isMetaMask,
        hasProviders: !!(window.ethereum as any)?.providers,
        providerCount: (window.ethereum as any)?.providers?.length || 0,
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        connectorCount: connectors.length,
        currentConnector: connector?.name || 'None',
        rainbowKitLoaded: !!document.querySelector('[data-rk]'),
        modalExists: !!document.querySelector('[data-rk] div[role="dialog"]'),
      };
      setDebugInfo(info);
    };

    checkWalletEnvironment();
    const interval = setInterval(checkWalletEnvironment, 2000);
    return () => clearInterval(interval);
  }, [connectors, connector]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white text-xs p-4 rounded-lg max-w-sm z-50 font-mono">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4" />
        <span className="font-semibold">Wallet Debug</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Connected:</span>
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Address:</span>
          <span className="text-blue-400">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Connector:</span>
          <span className="text-yellow-400">{debugInfo.currentConnector}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Ethereum:</span>
          <span className={debugInfo.hasEthereum ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.hasEthereum ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>MetaMask:</span>
          <span className={debugInfo.hasMetaMask ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.hasMetaMask ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Connectors:</span>
          <span className="text-cyan-400">{debugInfo.connectorCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>RainbowKit:</span>
          <span className={debugInfo.rainbowKitLoaded ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.rainbowKitLoaded ? 'Loaded' : 'Not Loaded'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Mobile:</span>
          <span className={debugInfo.isMobile ? 'text-orange-400' : 'text-blue-400'}>
            {debugInfo.isMobile ? 'Yes' : 'No'}
          </span>
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full"></div>
            <span>Connecting...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 text-red-400 mt-2">
            <AlertTriangle className="w-3 h-3" />
            <span className="break-all">{error.message}</span>
          </div>
        )}
        
        {pendingConnector && (
          <div className="text-blue-400">
            Pending: {pendingConnector.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDebug; 