import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { Menu, X, BarChart3, Coins, Rocket, Vote, ChevronDown, LogOut, Copy, Settings } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { log } from '../utils/logger';

const Header: React.FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [forceLegacy, setForceLegacy] = useState(localStorage.getItem('forceLegacyProvider') === 'true');

  const navigation = [
    { name: t('navigation.dashboard'), href: '/', icon: BarChart3 },
    { name: t('navigation.tokens'), href: '/tokens', icon: Coins },
    { name: t('navigation.locking'), href: '/staking', icon: Rocket },
    { name: t('navigation.governance'), href: '/governance', icon: Vote },
  ];

  const isActive = (path: string) => location.pathname === path;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    
    // Если кошелёк подключен - отключаем для применения изменений
    if (isConnected) {
      disconnectWallet();
      setTimeout(() => {
        window.location.reload(); // Перезагружаем для применения нового режима
      }, 500);
    }
  };

  // Close wallet menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-wallet-menu]')) {
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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - только текст */}
          <Link to="/" className="group">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-400 transition-all duration-200">
              TECH HY Ecosystem
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-slate-200">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Legacy Mode Toggle (для тестирования Arc browser popup проблемы) */}
            <button
              onClick={toggleLegacyMode}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                forceLegacy
                  ? 'bg-orange-600/20 border border-orange-500/30 text-orange-400 hover:bg-orange-600/30'
                  : 'bg-gray-600/20 border border-gray-500/30 text-gray-400 hover:bg-gray-600/30'
              }`}
              title={forceLegacy ? 'Legacy Mode: ON (window.ethereum)' : 'EIP-6963 Mode: ON'}
            >
              <Settings className="w-3 h-3" />
              <span>{forceLegacy ? 'Legacy' : 'EIP-6963'}</span>
            </button>
            
            {/* Wallet Connection */}
            {isConnected ? (
              <div className="relative" data-wallet-menu>
                {/* Wallet Address Button */}
                <button
                  onClick={toggleWalletMenu}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-400">
                    {formatAddress(account!)}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-green-400 transition-transform duration-200 ${
                      isWalletMenuOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Wallet Dropdown Menu */}
                {isWalletMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="py-1">
                      {/* Full Address */}
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                        <p className="text-sm font-mono text-gray-300 break-all">
                          {account}
                        </p>
                      </div>
                      
                      {/* Copy Address */}
                      <button
                        onClick={copyAddress}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{t('buttons.copy')} Address</span>
                      </button>
                      
                      {/* Disconnect */}
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('buttons.disconnect')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                {t('buttons.connect')}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
            <nav className="space-y-2">
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
                    <span className="font-medium text-slate-200">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Wallet Menu */}
            {isConnected && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                  <p className="text-sm font-mono text-gray-300 break-all mb-3">
                    {account}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyAddress}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{t('buttons.copy')}</span>
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('buttons.disconnect')}</span>
                    </button>
                  </div>
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