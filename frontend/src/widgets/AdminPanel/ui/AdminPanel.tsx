import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Settings, 
  Database, 
  BarChart3,
  Coins,
  Users,
  Activity,
  AlertTriangle,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  Network,
  Server,
  Code,
  Terminal
} from 'lucide-react';
import { useAdminAccess } from '../../../shared/hooks/useAdminAccess';
import NetworkStatus from '../../../shared/ui/NetworkStatus';
import VCSaleWidget from '../../VCSaleWidget/ui/VCSaleWidget';
import { cn } from '../../../shared/lib/cn';
import { getNetworkInfo, CONTRACTS, getContractUrl } from '../../../shared/config/contracts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { isAdmin, adminAddress, currentAddress } = useAdminAccess();
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'network' | 'tokens' | 'users'>('overview');
  const networkInfo = getNetworkInfo();

  // Проверка доступа
  if (!isAdmin) {
    return null;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'contracts', name: 'Contracts', icon: Code },
    { id: 'network', name: 'Network', icon: Network },
    { id: 'tokens', name: 'Tokens', icon: Coins },
    { id: 'users', name: 'Users', icon: Users },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl z-50 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                  <p className="text-sm text-gray-400">Authorized: {adminAddress.slice(0, 8)}...{adminAddress.slice(-6)}</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50 bg-slate-800/30">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all",
                      isActive
                        ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                        : "text-gray-400 hover:text-gray-200 hover:bg-slate-800/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'contracts' && <ContractsTab />}
              {activeTab === 'network' && <NetworkTab />}
              {activeTab === 'tokens' && <TokensTab />}
              {activeTab === 'users' && <UsersTab />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ✅ OVERVIEW TAB
const OverviewTab: React.FC = () => {
  const networkInfo = getNetworkInfo();
  
  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard
          title="Network Status"
          value={networkInfo.networkName}
          status={networkInfo.isTestnet ? 'warning' : 'success'}
          icon={Network}
        />
        <AdminCard
          title="Contracts"
          value="8/8"
          status="success"
          icon={Code}
        />
        <AdminCard
          title="Active Users"
          value="24"
          status="info"
          icon={Users}
        />
        <AdminCard
          title="Total TVL"
          value="$125.4K"
          status="success"
          icon={DollarSign}
        />
      </div>

      {/* Network Status Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetworkStatus className="bg-slate-800/30" />
        
        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 text-green-400" size={20} />
            System Health
          </h3>
          <div className="space-y-3">
            <HealthCheck label="RPC Endpoints" status="healthy" />
            <HealthCheck label="Contract Calls" status="healthy" />
            <HealthCheck label="Token Balances" status="healthy" />
            <HealthCheck label="LP Pools" status="warning" message="Low liquidity" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ CONTRACTS TAB
const ContractsTab: React.FC = () => {
  const networkInfo = getNetworkInfo();
  
  const contracts = [
    { name: 'VC Token', address: CONTRACTS.VC_TOKEN, type: 'ERC20' },
    { name: 'VG Token', address: CONTRACTS.VG_TOKEN, type: 'ERC20' },
    { name: 'VG Token Votes', address: CONTRACTS.VG_TOKEN_VOTES, type: 'ERC20Votes' },
    { name: 'LP Token', address: CONTRACTS.LP_TOKEN, type: 'ERC20' },
    { name: 'LP Locker', address: CONTRACTS.LP_LOCKER, type: 'Custom' },
    { name: 'VG Vault', address: CONTRACTS.VG_VAULT, type: 'Vault' },
    { name: 'Governor', address: CONTRACTS.GOVERNOR, type: 'Governor' },
    { name: 'Timelock', address: CONTRACTS.TIMELOCK, type: 'Timelock' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Contract Management</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh All</span>
        </button>
      </div>

      <div className="grid gap-4">
        {contracts.map((contract, index) => {
          const isDeployed = contract.address !== "0x0000000000000000000000000000000000000000";
          
          return (
            <div
              key={contract.name}
              className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
            >
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isDeployed ? "bg-green-400" : "bg-red-400"
                )} />
                <div>
                  <div className="font-medium text-white">{contract.name}</div>
                  <div className="text-sm text-gray-400">{contract.type}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {isDeployed ? (
                  <>
                    <span className="text-xs text-gray-400 font-mono">
                      {contract.address.slice(0, 8)}...{contract.address.slice(-6)}
                    </span>
                    <a
                      href={getContractUrl(contract.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-blue-400"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-red-400">Not Deployed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ✅ NETWORK TAB
const NetworkTab: React.FC = () => {
  const networkInfo = getNetworkInfo();
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Network Configuration & Debug Info</h3>
      
      {/* Network Status Widget - перенесено из основного интерфейса */}
      <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
        <h4 className="text-lg font-medium mb-4 flex items-center">
          <Network className="mr-2 text-blue-400" size={18} />
          Network Status Monitor
        </h4>
        <NetworkStatus className="bg-transparent border-none shadow-none" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <Server className="mr-2 text-blue-400" size={18} />
            RPC Endpoints Status
          </h4>
          <div className="space-y-3">
                                                      <RpcStatus url="https://bsc-testnet-rpc.publicnode.com" status="healthy" latency="45ms" />
              <RpcStatus url="https://bsc-testnet.drpc.org" status="healthy" latency="65ms" />
              <RpcStatus url="https://bsc-testnet.rpc.thirdweb.com" status="healthy" latency="67ms" />
              <RpcStatus url="https://bsc-testnet.bnbchain.org" status="healthy" latency="52ms" />
              <RpcStatus url="https://bsc-testnet.blockpi.network/v1/rpc/public" status="healthy" latency="78ms" />
          </div>
        </div>

        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <Activity className="mr-2 text-green-400" size={18} />
            System Health Monitoring
          </h4>
          <div className="space-y-3">
            <HealthCheck label="Wallet Connection" status="healthy" />
            <HealthCheck label="Contract Connectivity" status="healthy" />
            <HealthCheck label="Token Balances Sync" status="healthy" />
            <HealthCheck label="Transaction History" status="warning" message="Slow API" />
            <HealthCheck label="LP Pool Data" status="warning" message="Low liquidity" />
            <HealthCheck label="Price Feeds" status="healthy" />
          </div>
        </div>

        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <Terminal className="mr-2 text-green-400" size={18} />
            Admin Actions
          </h4>
          <div className="space-y-3">
            <AdminAction label="Switch to Mainnet" icon={Network} variant="warning" />
            <AdminAction label="Clear RPC Cache" icon={RefreshCw} variant="info" />
            <AdminAction label="Test All Endpoints" icon={Activity} variant="success" />
            <AdminAction label="Force Data Refresh" icon={RefreshCw} variant="info" />
            <AdminAction label="Emergency Mode" icon={AlertTriangle} variant="danger" />
            <AdminAction label="Reset Connection" icon={Network} variant="warning" />
          </div>
        </div>

        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <Code className="mr-2 text-purple-400" size={18} />
            Network Information
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="text-white font-mono">{networkInfo.networkName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Chain ID:</span>
              <span className="text-white font-mono">{networkInfo.chainId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Currency:</span>
              <span className="text-white font-mono">{networkInfo.nativeCurrency.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className={`font-mono ${networkInfo.isTestnet ? 'text-yellow-400' : 'text-green-400'}`}>
                {networkInfo.isTestnet ? 'Testnet' : 'Mainnet'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Block Explorer:</span>
              <a 
                href={networkInfo.blockExplorer} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs"
              >
                View Explorer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ TOKENS TAB
const TokensTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Token Management</h3>
      
      {/* VCSale Widget - выделенный блок */}
      <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-white flex items-center">
            <DollarSign className="mr-2 text-green-400" size={18} />
            VC Token Sale
          </h4>
          <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="text-green-400 text-sm font-medium">Admin Access</span>
          </div>
        </div>
        
        {/* VCSale Widget */}
        {/* Temporarily disabled for mainnet deployment
        <VCSaleWidget
          className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20"
          onPurchaseSuccess={() => {
            toast.success('VC покупка прошла успешно!');
            refreshData();
          }}
          onError={(error) => toast.error(`VC Sale ошибка: ${error}`)}
        />
        */}
      </div>
      
      {/* Token Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenCard 
          name="VC Token"
          symbol="VC"
          balance="1,000,000"
          price="$0.0025"
          change="+5.2%"
          address={CONTRACTS.VC_TOKEN}
        />
        <TokenCard 
          name="VG Token"
          symbol="VG"
          balance="500,000"
          price="$0.0012"
          change="+2.8%"
          address={CONTRACTS.VG_TOKEN}
        />
      </div>
    </div>
  );
};

// ✅ USERS TAB
const UsersTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">User Management</h3>
      
      <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
        <h4 className="text-lg font-medium mb-4">Connected Users</h4>
        <div className="text-gray-400">
          User management features will be implemented here...
        </div>
      </div>
    </div>
  );
};

// ✅ HELPER COMPONENTS
const AdminCard: React.FC<{
  title: string;
  value: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  icon: React.ComponentType<any>;
}> = ({ title, value, status, icon: Icon }) => {
  const statusColors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      statusColors[status]
    )}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <div className="text-sm opacity-80">{title}</div>
    </div>
  );
};

const HealthCheck: React.FC<{
  label: string;
  status: 'healthy' | 'warning' | 'error';
  message?: string;
}> = ({ label, status, message }) => {
  const statusConfig = {
    healthy: { color: 'text-green-400', bg: 'bg-green-500/10' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10' }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <div className="flex items-center space-x-2">
        {message && <span className="text-xs text-gray-500">{message}</span>}
        <div className={cn("w-2 h-2 rounded-full", statusConfig[status].bg, statusConfig[status].color)} />
      </div>
    </div>
  );
};

const RpcStatus: React.FC<{
  url: string;
  status: 'healthy' | 'slow' | 'error';
  latency: string;
}> = ({ url, status, latency }) => {
  const statusColors = {
    healthy: 'text-green-400',
    slow: 'text-yellow-400',
    error: 'text-red-400'
  };

  return (
    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
      <span className="text-sm text-gray-300 truncate flex-1">{url}</span>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">{latency}</span>
        <div className={cn("w-2 h-2 rounded-full", `bg-current ${statusColors[status]}`)} />
      </div>
    </div>
  );
};

const AdminAction: React.FC<{
  label: string;
  icon: React.ComponentType<any>;
  variant: 'success' | 'warning' | 'danger' | 'info';
}> = ({ label, icon: Icon, variant }) => {
  const variants = {
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <button className={cn(
      "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm",
      variants[variant]
    )}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

const TokenCard: React.FC<{
  name: string;
  symbol: string;
  balance: string;
  price: string;
  change: string;
  address: string;
}> = ({ name, symbol, balance, price, change, address }) => {
  const isPositive = change.startsWith('+');
  
  // Get token logo based on symbol
  const getTokenLogo = (symbol: string) => {
    switch(symbol) {
      case 'VC':
        return "/icons/VC Token-Tech Hy- SVG.svg";
      case 'VG':
        return "/icons/VG Token-Tech Hy- SVG.svg";
      default:
        return null;
    }
  };

  const tokenLogo = getTokenLogo(symbol);

  return (
    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {tokenLogo && (
            <div className="w-10 h-10 rounded-lg bg-slate-700/30 p-1.5 flex items-center justify-center">
              <img 
                src={tokenLogo} 
                alt={`${symbol} Logo`} 
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div>
            <h4 className="text-lg font-medium text-white">{name}</h4>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-white">{price}</div>
          <div className={cn("text-sm", isPositive ? "text-green-400" : "text-red-400")}>
            {change}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Balance:</span>
          <span className="text-white">{balance} {symbol}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Contract:</span>
          <a
            href={getContractUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            {address.slice(0, 8)}...{address.slice(-6)}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 