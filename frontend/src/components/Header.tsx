import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWeb3 } from '../contexts/Web3Context';
import { Menu, X, BarChart3, Coins, Rocket, Vote, Network, Wifi } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { bscTestnet, bsc } from 'wagmi/chains';

const Header: React.FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { chainId, switchToTestnet, switchToMainnet } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: t('navigation.dashboard'), href: '/', icon: BarChart3 },
    { name: t('navigation.tokens'), href: '/tokens', icon: Coins },
    { name: t('navigation.locking'), href: '/staking', icon: Rocket },
    { name: t('navigation.governance'), href: '/governance', icon: Vote },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isTestnet = chainId === bscTestnet.id;
  const isMainnet = chainId === bsc.id;

  const handleNetworkSwitch = () => {
    if (isTestnet) {
      switchToMainnet();
    } else {
      switchToTestnet();
    }
  };

  // Красивая кнопка переключения сети
  const NetworkSwitcher = ({ isMobile = false }: { isMobile?: boolean }) => {
    const networkName = isTestnet ? 'Testnet' : isMainnet ? 'Mainnet' : 'Unknown';
    const networkColor = isTestnet 
      ? 'from-orange-500 to-red-500 border-orange-500/30' 
      : isMainnet 
      ? 'from-green-500 to-emerald-500 border-green-500/30'
      : 'from-gray-500 to-slate-500 border-gray-500/30';

    return (
      <button
        onClick={handleNetworkSwitch}
        className={`group relative overflow-hidden rounded-lg border bg-gradient-to-r ${networkColor} p-[1px] transition-all duration-300 hover:scale-105 hover:shadow-lg ${
          isMobile ? 'w-full' : ''
        }`}
        title={isTestnet ? 'Switch to Mainnet' : 'Switch to Testnet'}
      >
        <div className="relative flex items-center space-x-2 rounded-lg bg-black/80 px-3 py-2 text-xs font-normal backdrop-blur-sm transition-all duration-300 group-hover:bg-black/60">
          <div className="relative">
            <Network className="h-3 w-3" />
            <div className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${
              isTestnet ? 'bg-orange-400' : isMainnet ? 'bg-green-400' : 'bg-gray-400'
            } animate-pulse`} />
          </div>
          <span className="text-white font-normal">{networkName}</span>
          {!isMobile && (
            <Wifi className="h-3 w-3 text-white/60 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>
    );
  };

  return (
    <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group mr-6 lg:mr-12">
            <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-400 transition-all duration-200">
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-normal ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg font-medium'
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
          <div className="flex items-center space-x-3">
            {/* Network Switcher - Desktop */}
            <div className="hidden md:block">
              <NetworkSwitcher />
            </div>
            
            {/* Language Switcher - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            
            {/* RainbowKit Connect Button - скрываем информацию о сети */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // NOTE: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button 
                            onClick={openConnectModal} 
                            type="button"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-normal py-2 px-4 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-normal py-2 px-4 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 text-sm"
                        >
                          {account.displayName}
                          {account.displayBalance
                            ? ` (${account.displayBalance})`
                            : ''}
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

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
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-300 hover:text-white hover:bg-white/10 font-normal'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Controls */}
            <div className="py-4 space-y-3 border-t border-white/10">
              {/* Network Switcher - Mobile */}
              <div className="px-4">
                <NetworkSwitcher isMobile />
              </div>
              
              {/* Language Switcher - Mobile */}
              <div className="px-4 md:hidden">
                <div className="w-full">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 