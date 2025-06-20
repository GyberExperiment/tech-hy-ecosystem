import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { Menu, X, BarChart3, Coins, Rocket, Vote, ChevronDown, LogOut, Copy, Settings, Wallet, Network } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { log } from '../utils/logger';

const Header: React.FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [forceLegacy, setForceLegacy] = useState(localStorage.getItem('forceLegacyProvider') === 'true');
  const [isTestnetMode, setIsTestnetMode] = useState(localStorage.getItem('networkMode') !== 'mainnet');

  const navigation = [
    { name: t('navigation.dashboard'), href: '/', icon: BarChart3 },
    { name: t('navigation.tokens'), href: '/tokens', icon: Coins },
    { name: t('navigation.locking'), href: '/staking', icon: Rocket },
    { name: t('navigation.governance'), href: '/governance', icon: Vote },
  ];

  const isActive = (path: string) => location.pathname === path;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleWalletMenu = () => {
    setIsWalletMenuOpen(!isWalletMenuOpen);
  };

  const copyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        // You could add a toast notification here
      } catch (error) {
        log.error('Failed to copy address to clipboard', {
          component: 'Header',
          function: 'copyToClipboard',
          address: account
        }, error as Error);
      }
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsWalletMenuOpen(false);
  };

  const toggleLegacyMode = () => {
    const newValue = !forceLegacy;
    setForceLegacy(newValue);
    localStorage.setItem('forceLegacyProvider', newValue.toString());
    
    if (isConnected) {
      disconnectWallet();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const toggleNetworkMode = () => {
    const newMode = isTestnetMode ? 'mainnet' : 'testnet';
    setIsTestnetMode(!isTestnetMode);
    localStorage.setItem('networkMode', newMode);
    
    if (isConnected) {
      disconnectWallet();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-wallet-menu]') && !target.closest('[data-language-switcher]')) {
        setIsWalletMenuOpen(false);
      }
    };

    if (isWalletMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isWalletMenuOpen]);

  return (
    <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-400 transition-all duration-200">
              <span className="hidden sm:inline">TECH HY Ecosystem</span>
              <span className="sm:hidden">TECH HY</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Network Switcher - Desktop */}
            <button
              onClick={toggleNetworkMode}
              className={`hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium border ${
                isTestnetMode
                  ? 'bg-orange-600/20 border-orange-500/30 text-orange-400 hover:bg-orange-600/30'
                  : 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30'
              }`}
              title={isTestnetMode ? 'Switch to Mainnet' : 'Switch to Testnet'}
            >
              <Network className="w-3 h-3" />
              <span className="hidden lg:inline">{isTestnetMode ? 'Testnet' : 'Mainnet'}</span>
            </button>
            
            {/* Language Switcher - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            
            {/* Legacy Mode Toggle - Desktop only */}
            <button
              onClick={toggleLegacyMode}
              className={`hidden xl:flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium border ${
                forceLegacy
                  ? 'bg-orange-600/20 border-orange-500/30 text-orange-400 hover:bg-orange-600/30'
                  : 'bg-gray-600/20 border-gray-500/30 text-gray-400 hover:bg-gray-600/30'
              }`}
              title={forceLegacy ? 'Legacy Mode: ON' : 'EIP-6963 Mode: ON'}
            >
              <Settings className="w-3 h-3" />
              <span>{forceLegacy ? 'Legacy' : 'EIP-6963'}</span>
            </button>
            
            {/* Wallet Connection */}
            {isConnected ? (
              <div className="relative" data-wallet-menu>
                <button
                  onClick={toggleWalletMenu}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-all duration-200 text-sm font-medium"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 hidden sm:inline">
                    {formatAddress(account!)}
                  </span>
                  <span className="text-green-400 sm:hidden">
                    {account!.slice(0, 6)}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-green-400 transition-transform duration-200 ${
                      isWalletMenuOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Wallet Dropdown */}
                {isWalletMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                      <p className="text-sm font-mono text-gray-300 break-all">
                        {account}
                      </p>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={copyAddress}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Address</span>
                      </button>
                      
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm"
              >
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">
                  <Wallet className="w-4 h-4" />
                </span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/10"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10">
            {/* Navigation Links */}
            <nav className="py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Controls */}
            <div className="py-4 space-y-3 border-t border-white/10">
              {/* Network Switcher */}
              <div className="px-4">
                <button
                  onClick={toggleNetworkMode}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium border ${
                    isTestnetMode
                      ? 'bg-orange-600/20 border-orange-500/30 text-orange-400'
                      : 'bg-green-600/20 border-green-500/30 text-green-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Network className="w-4 h-4" />
                    <span>Network Mode</span>
                  </div>
                  <span className="text-xs">
                    {isTestnetMode ? 'Testnet' : 'Mainnet'}
                  </span>
                </button>
              </div>
              
              {/* Language Switcher */}
              <div className="px-4 md:hidden">
                <div className="w-full">
                  <LanguageSwitcher />
                </div>
              </div>
              
              {/* Legacy Mode Toggle */}
              <div className="px-4 xl:hidden">
                <button
                  onClick={toggleLegacyMode}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium border ${
                    forceLegacy
                      ? 'bg-orange-600/20 border-orange-500/30 text-orange-400'
                      : 'bg-gray-600/20 border-gray-500/30 text-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Provider Mode</span>
                  </div>
                  <span className="text-xs">
                    {forceLegacy ? 'Legacy' : 'EIP-6963'}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Mobile Wallet Info */}
            {isConnected && (
              <div className="py-4 px-4 border-t border-white/10">
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                  <p className="text-sm font-mono text-gray-300 break-all">
                    {account}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={copyAddress}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 