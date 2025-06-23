import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Menu, X, BarChart3, Coins, Rocket, Vote, Network, Wifi } from 'lucide-react';
import LanguageSwitcher from '../lib/LanguageSwitcher';
import { bscTestnet, bsc } from 'wagmi/chains';

const Header: React.FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
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
      switchChain({ chainId: bsc.id });
    } else {
      switchChain({ chainId: bscTestnet.id });
    }
  };

  // Ultra Modern Network Switcher with Liquid Glass
  const NetworkSwitcher = ({ isMobile = false }: { isMobile?: boolean }) => {
    const networkName = isTestnet ? 'Testnet' : isMainnet ? 'Mainnet' : 'Unknown';
    const networkColor = isTestnet 
      ? 'glass-secondary' 
      : isMainnet 
      ? 'glass-accent'
      : 'glass-ultra';

    return (
      <button
        onClick={handleNetworkSwitch}
        className={`liquid-glass group relative overflow-hidden rounded-xl border bg-gradient-to-r p-[1px] transition-all duration-300 hover:scale-105 ${
          isMobile ? 'w-full' : ''
        } ${networkColor}`}
        title={isTestnet ? 'Switch to Mainnet' : 'Switch to Testnet'}
      >
        <div className="relative flex items-center space-x-2 rounded-xl glass-ultra px-3 py-2 text-xs font-normal backdrop-blur-sm transition-all duration-300">
          <div className="relative flex items-center justify-center">
            <Network className="h-3 w-3" />
            <div className={`absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
              isTestnet ? 'bg-orange-400' : isMainnet ? 'bg-green-400' : 'bg-gray-400'
            } animate-glass-pulse`} />
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
    <header className="header-glass sticky top-0 z-40 animate-glass-float">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group mr-6 lg:mr-12">
            <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-400 group-hover:to-pink-300 transition-all duration-300 bg-[length:200%_200%] animate-gradient-shift">
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 text-sm font-normal ${
                    isActive(item.href)
                      ? 'glass-primary text-white shadow-glass font-medium animate-glass-pulse'
                      : 'glass-ultra text-gray-300 hover:text-white hover:glass-accent'
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
              <div className="liquid-glass rounded-xl p-1">
                <LanguageSwitcher />
              </div>
            </div>
            
            {/* RainbowKit Connect Button - Enhanced with Glassmorphism */}
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
                            className="btn-glass-morphic animate-glass-pulse"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="liquid-glass hover:glass-accent text-white font-normal py-2 px-4 rounded-xl transition-all duration-300 text-sm"
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
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200 rounded-xl glass-ultra hover:glass-accent"
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

        {/* Mobile Navigation - Enhanced with Glassmorphism */}
        {isMobileMenuOpen && (
          <div className="lg:hidden liquid-glass rounded-2xl mt-4 p-4 animate-glass-float">
            {/* Navigation Links */}
            <nav className="py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive(item.href)
                        ? 'glass-primary text-white font-medium animate-glass-pulse'
                        : 'glass-ultra text-gray-300 hover:text-white hover:glass-accent font-normal'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Controls */}
            <div className="py-4 space-y-3 border-t border-glass">
              {/* Network Switcher - Mobile */}
              <div className="px-4">
                <NetworkSwitcher isMobile />
              </div>
              
              {/* Language Switcher - Mobile */}
              <div className="px-4 md:hidden">
                <div className="w-full liquid-glass rounded-xl p-2">
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