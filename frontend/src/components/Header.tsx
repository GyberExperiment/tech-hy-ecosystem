import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { Wallet, AlertTriangle, BarChart3, Coins, Rocket, Vote } from 'lucide-react';
import { BSC_TESTNET } from '../constants/contracts';

const Header: React.FC = () => {
  const location = useLocation();
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    isConnecting,
    connectWallet, 
    disconnectWallet, 
    switchToTestnet 
  } = useWeb3();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Tokens', href: '/tokens', icon: Coins },
    { name: 'LP Locking', href: '/staking', icon: Rocket },
    { name: 'Governance', href: '/governance', icon: Vote },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              TECH HY Ecosystem
            </div>
            <div className="hidden md:block text-sm text-gray-400">
              BSC Testnet DApp
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            {isConnected && (
              <div className="hidden md:flex items-center space-x-2">
                {isCorrectNetwork ? (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">
                      {BSC_TESTNET.name}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={switchToTestnet}
                    className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <AlertTriangle size={16} className="text-red-400" />
                    <span className="text-red-400 text-sm font-medium">
                      Wrong Network
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Wallet Button */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg">
                  <div className="text-sm font-medium">
                    {formatAddress(account!)}
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="btn-secondary text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className={`btn-primary flex items-center space-x-2 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Wallet size={18} />
                <span>{isConnecting ? 'Подключение...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-4 border-t border-white/10">
          <nav className="flex justify-around">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center space-y-1 px-2 py-1 rounded-lg ${
                    isActive
                      ? 'text-blue-400'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 