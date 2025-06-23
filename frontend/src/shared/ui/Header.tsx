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

  // Clean Network Switcher with Clean Glass
  const NetworkSwitcher = ({ isMobile = false }: { isMobile?: boolean }) => {
    const networkName = isTestnet ? 'Testnet' : isMainnet ? 'Mainnet' : 'Unknown';
    const networkColor = isTestnet 
      ? 'bg-accent-orange/10 border-accent-orange/30' 
      : isMainnet 
      ? 'bg-accent-green/10 border-accent-green/30'
      : 'bg-medium-gray/10 border-medium-gray/30';

    return (
      <button
        onClick={handleNetworkSwitch}
        className={`clean-glass group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-105 ${
          isMobile ? 'w-full' : ''
        } ${networkColor}`}
        title={isTestnet ? 'Switch to Mainnet' : 'Switch to Testnet'}
      >
        <div className="relative flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-normal backdrop-blur-sm transition-all duration-300">
          <div className="relative flex items-center justify-center">
            <Network className="h-3 w-3 text-text-gray" />
            <div className={`absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
              isTestnet ? 'bg-accent-orange' : isMainnet ? 'bg-accent-green' : 'bg-medium-gray'
            } animate-subtle-glow`} />
          </div>
          <span className="text-dark-gray font-medium">{networkName}</span>
          {!isMobile && (
            <Wifi className="h-3 w-3 text-text-gray group-hover:text-dark-gray transition-colors" />
          )}
        </div>
      </button>
    );
  };

  return (
    <header className="clean-nav sticky top-0 z-40 animate-gentle-float">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group mr-6 lg:mr-12">
            <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium bg-gradient-to-r from-accent-blue via-accent-purple to-accent-teal bg-clip-text text-transparent group-hover:from-accent-blue group-hover:via-accent-purple group-hover:to-accent-teal transition-all duration-300">
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
                  className={`clean-nav-item flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 text-sm font-normal ${
                    isActive(item.href)
                      ? 'active'
                      : ''
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
              <div className="clean-glass rounded-xl p-1">
                <LanguageSwitcher />
              </div>
            </div>
            
            {/* RainbowKit Connect Button - Enhanced with Clean Glassmorphism */}
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
                            className="clean-btn-primary animate-subtle-glow"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="clean-glass hover:border-accent-blue/30 text-dark-gray font-normal py-2 px-4 rounded-xl transition-all duration-300 text-sm"
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
              className="lg:hidden p-2 text-text-gray hover:text-dark-gray transition-colors duration-200 rounded-xl clean-glass hover:border-accent-blue/30"
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

        {/* Mobile Navigation - Enhanced with Clean Glassmorphism */}
        {isMobileMenuOpen && (
          <div className="lg:hidden frosted-glass rounded-2xl mt-4 p-4 animate-gentle-float">
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
                        ? 'bg-accent-blue text-pure-white font-medium animate-subtle-glow'
                        : 'clean-glass text-text-gray hover:text-dark-gray hover:border-accent-blue/30 font-normal'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Controls */}
            <div className="py-4 space-y-3 border-t border-border-clean">
              {/* Network Switcher - Mobile */}
              <div className="px-4">
                <NetworkSwitcher isMobile />
              </div>
              
              {/* Language Switcher - Mobile */}
              <div className="px-4 md:hidden">
                <div className="w-full clean-glass rounded-xl p-2">
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