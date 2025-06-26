import React from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Info, Network, Zap } from 'lucide-react';
import { getNetworkInfo, NETWORK_STATUS, getContractUrl, CONTRACTS } from '../config/contracts';
import { cn } from '../lib/cn';

interface NetworkStatusProps {
  className?: string;
  compact?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ className, compact = false }) => {
  const networkInfo = getNetworkInfo();
  const networkStatus = NETWORK_STATUS[networkInfo.currentNetwork];

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-2 text-sm", className)}>
        <div className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded-full",
          networkInfo.isMainnet 
            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
        )}>
          <Network size={12} />
          <span className="font-medium">{networkInfo.networkName}</span>
        </div>
        
        {networkStatus.isReady ? (
          <CheckCircle className="text-green-400" size={16} />
        ) : (
          <AlertCircle className="text-amber-400" size={16} />
        )}
      </div>
    );
  }

  return (
    <div className={cn("card", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Network className="mr-2 text-blue-400" size={20} />
          Network Status
        </h3>
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          networkInfo.isMainnet 
            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
        )}>
          {networkInfo.networkName}
        </div>
      </div>

      {/* Network Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-sm mb-1">Chain ID</div>
          <div className="font-semibold">{networkInfo.chainId}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-sm mb-1">Explorer</div>
          <a 
            href={networkInfo.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
          >
            View <ExternalLink size={12} className="ml-1" />
          </a>
        </div>
      </div>

      {/* Status */}
      <div className={cn(
        "flex items-start space-x-3 p-4 rounded-lg",
        networkStatus.isReady 
          ? "bg-green-500/10 border border-green-500/20"
          : "bg-amber-500/10 border border-amber-500/20"
      )}>
        {networkStatus.isReady ? (
          <CheckCircle className="text-green-400 mt-0.5" size={20} />
        ) : (
          <AlertCircle className="text-amber-400 mt-0.5" size={20} />
        )}
        <div>
          <div className={cn(
            "font-medium mb-1",
            networkStatus.isReady ? "text-green-400" : "text-amber-400"
          )}>
            {networkStatus.isReady ? "Ready" : "Pending Deployment"}
          </div>
          <div className="text-gray-300 text-sm">
            {networkStatus.description}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3 flex items-center">
          <Zap className="mr-2 text-yellow-400" size={16} />
          Features Status
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {networkStatus.features.map((feature, index) => {
            const isReady = feature.includes('✅');
            const isPending = feature.includes('⚠️');
            
            return (
              <div 
                key={index}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm",
                  isReady 
                    ? "bg-green-500/10 text-green-400"
                    : isPending 
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-blue-500/10 text-blue-400"
                )}
              >
                <span>{feature}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Steps (только для mainnet если не готов) */}
      {!networkStatus.isReady && 'nextSteps' in networkStatus && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-3 flex items-center">
            <Info className="mr-2 text-blue-400" size={16} />
            Next Steps
          </h4>
          <div className="space-y-2">
            {networkStatus.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                <div className="text-blue-400 font-mono text-xs mt-1">{index + 1}.</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Contracts */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Token Contracts</h4>
        <div className="space-y-2">
          <ContractLink 
            name="VC Token" 
            address={CONTRACTS.VC_TOKEN}
            isDeployed={CONTRACTS.VC_TOKEN !== "0x0000000000000000000000000000000000000000"}
          />
          <ContractLink 
            name="VG Token" 
            address={CONTRACTS.VG_TOKEN}
            isDeployed={CONTRACTS.VG_TOKEN !== "0x0000000000000000000000000000000000000000"}
          />
          {networkInfo.isTestnet && (
            <>
              <ContractLink 
                name="LP Token" 
                address={CONTRACTS.LP_TOKEN}
                isDeployed={CONTRACTS.LP_TOKEN !== "0x0000000000000000000000000000000000000000"}
              />
              <ContractLink 
                name="LP Locker" 
                address={CONTRACTS.LP_LOCKER}
                isDeployed={CONTRACTS.LP_LOCKER !== "0x0000000000000000000000000000000000000000"}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ContractLinkProps {
  name: string;
  address: string;
  isDeployed: boolean;
}

const ContractLink: React.FC<ContractLinkProps> = ({ name, address, isDeployed }) => {
  if (!isDeployed) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-lg">
        <span className="text-sm text-gray-400">{name}</span>
        <span className="text-xs text-amber-400">TBD</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
      <span className="text-sm text-gray-300">{name}</span>
      <a
        href={getContractUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
        <ExternalLink size={10} className="ml-1" />
      </a>
    </div>
  );
};

export default NetworkStatus; 