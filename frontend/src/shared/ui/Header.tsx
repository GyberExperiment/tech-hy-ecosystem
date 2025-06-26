import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Menu, X, BarChart3, Coins, Rocket, Vote, Network, Wifi, Globe, Settings, Shield } from 'lucide-react';
import LanguageSwitcher from '../lib/LanguageSwitcher';
import NetworkStatus from './NetworkStatus';
import AdminPanel from '../../widgets/AdminPanel/ui/AdminPanel';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { WaveTransition } from './wave-transition';
import { bscTestnet, bsc } from 'wagmi/chains';

const Header: React.FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const { isAdmin } = useAdminAccess();

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: BarChart3 },
    { name: t('navigation.tokens'), href: '/tokens', icon: Coins },
    { name: t('navigation.locking'), href: '/staking', icon: Rocket },
    { name: t('navigation.governance'), href: '/governance', icon: Vote },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleAdminPanel = () => {
    setIsAdminPanelOpen(!isAdminPanelOpen);
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

  // ✨ Admin Button Component
  const AdminButton = () => {
    if (!isAdmin) return null;

    return (
      <button
        onClick={toggleAdminPanel}
        className="
          group relative overflow-hidden
          h-[44px] w-[44px] p-2
          bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20
          border border-red-500/30 hover:border-red-400/50
          text-red-400 hover:text-red-300
          rounded-[14px]
          shadow-[0_4px_16px_rgba(239,68,68,0.2),0_1px_0_rgba(255,255,255,0.1)_inset]
          hover:shadow-[0_8px_32px_rgba(239,68,68,0.3),0_1px_0_rgba(255,255,255,0.15)_inset]
          hover:scale-[1.02] hover:-translate-y-[1px]
          active:scale-[0.98] active:translate-y-[0px]
          transition-all duration-300 ease-out
          animate-pulse
        "
        title="Admin Panel (Authorized Access)"
      >
        <div className="relative w-5 h-5 mx-auto">
          <Shield className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
        </div>
        
        {/* Неоморфный внутренний свет */}
        <div className="absolute inset-[1px] rounded-[13px] bg-gradient-to-br from-red-500/[0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Shimmer эффект */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/[0.2] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
      </button>
    );
  };

  // ✨ Premium Network Switcher с качественным glassmorphism
  const NetworkSwitcher = ({ isMobile = false }: { isMobile?: boolean }) => {
    const networkName = isTestnet ? 'Testnet' : isMainnet ? 'Mainnet' : 'Unknown';
    const isOnline = isTestnet || isMainnet;

    return (
      <button
        onClick={handleNetworkSwitch}
        disabled={!isOnline}
        className={`
          group relative overflow-hidden
          ${isMobile ? 'w-full' : 'min-w-[120px]'}
          h-[44px] px-4 py-2
          backdrop-blur-[12px] backdrop-saturate-[1.8] backdrop-brightness-[1.1]
          bg-gradient-to-br from-white/[0.15] via-white/[0.1] to-white/[0.05]
          border border-white/[0.2] hover:border-white/[0.3]
          rounded-[14px]
          shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.1)_inset]
          hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.15)_inset]
          hover:scale-[1.02] hover:-translate-y-[1px]
          active:scale-[0.98] active:translate-y-[0px]
          transition-all duration-300 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isMobile ? 'justify-start' : 'justify-center'}
        `}
        title={isTestnet ? 'Switch to Mainnet' : 'Switch to Testnet'}
      >
        <div className="relative flex items-center space-x-2.5 text-slate-700 group-hover:text-slate-900">
          <div className="relative flex items-center justify-center">
            <Network className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
            <div className={`
              absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full 
              ${isTestnet ? 'bg-amber-400 animate-pulse' : isMainnet ? 'bg-emerald-400' : 'bg-slate-400'}
              shadow-[0_0_8px_currentColor]
            `} />
          </div>
          <span className="font-semibold text-sm tracking-[0.01em]">{networkName}</span>
          {!isMobile && (
            <Wifi className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-all duration-300" />
          )}
        </div>
        
        {/* Неоморфный внутренний свет */}
        <div className="absolute inset-[1px] rounded-[13px] bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Shimmer эффект */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
      </button>
    );
  };

  // ✨ Premium Language Container
  const LanguageContainer = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`
      group relative overflow-hidden
      ${isMobile ? 'w-full' : 'min-w-[100px]'}
      h-[44px]
      backdrop-blur-[12px] backdrop-saturate-[1.8] backdrop-brightness-[1.1]
      bg-gradient-to-br from-white/[0.15] via-white/[0.1] to-white/[0.05]
      border border-white/[0.2] hover:border-white/[0.3]
      rounded-[14px]
      shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.1)_inset]
      hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.15)_inset]
      hover:scale-[1.02] hover:-translate-y-[1px]
      transition-all duration-300 ease-out
    `}>
      <div className="relative flex items-center space-x-2.5 px-4 py-2 h-full">
        <Globe className="h-4 w-4 text-slate-600 group-hover:text-slate-800 transition-all duration-300 group-hover:scale-110" />
        <div className="relative text-slate-700 group-hover:text-slate-900 transition-colors duration-300">
          <LanguageSwitcher />
        </div>
      </div>
      
      {/* Неоморфный внутренний свет */}
      <div className="absolute inset-[1px] rounded-[13px] bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Shimmer эффект */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
    </div>
  );

  return (
    <>
      <header className="relative sticky top-0 z-50">
        {/* ✨ Premium Header Container */}
        <div className="relative backdrop-blur-[20px] backdrop-saturate-[1.8] backdrop-brightness-[1.05] bg-gradient-to-r from-white/[0.85] via-white/[0.90] to-white/[0.85] border-b border-white/[0.25] shadow-[0_8px_32px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)_inset]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* ✨ Premium Navigation Row */}
            <div className="flex items-center h-[72px]">
              
              {/* ✨ Premium Logo */}
              <div className="flex-shrink-0 mr-8 lg:mr-12">
                <Link to="/" className="group relative">
                  <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-emerald-600 transition-all duration-500">
                    <span className="hidden sm:inline">TECH HY Ecosystem</span>
                    <span className="sm:hidden">TECH HY</span>
                  </span>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                </Link>
              </div>

              {/* ✨ Premium Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center mx-8">
                {navigation.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        group relative overflow-hidden
                        flex items-center space-x-2.5
                        h-[44px] px-5 py-2
                        font-semibold text-[14px] tracking-[0.01em]
                        rounded-[14px]
                        transition-all duration-300 ease-out
                        ${active 
                          ? `
                            bg-gradient-to-br from-blue-500 to-blue-600
                            text-white shadow-[0_8px_32px_rgba(59,130,246,0.4),0_1px_0_rgba(255,255,255,0.2)_inset]
                            scale-[1.02] -translate-y-[1px]
                          `
                          : `
                            backdrop-blur-[8px] backdrop-saturate-[1.5]
                            bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.04]
                            border border-white/[0.15] hover:border-white/[0.25]
                            text-slate-700 hover:text-slate-900
                            shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.1)_inset]
                            hover:shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.15)_inset]
                            hover:scale-[1.02] hover:-translate-y-[1px]
                          `
                        }
                      `}
                      style={{ 
                        animationDelay: `${index * 100}ms` 
                      }}
                    >
                      <Icon className={`w-4 h-4 transition-all duration-300 ${
                        active 
                          ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' 
                          : 'text-slate-600 group-hover:text-slate-800 group-hover:scale-110'
                      }`} />
                      <span className={active ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : ''}>{item.name}</span>
                      
                      {/* Неоморфный внутренний свет для неактивных */}
                      {!active && (
                        <div className="absolute inset-[1px] rounded-[13px] bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      
                      {/* Shimmer эффект */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${
                        active 
                          ? 'from-transparent via-white/[0.25] to-transparent' 
                          : 'from-transparent via-white/[0.15] to-transparent'
                      } translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out`} />
                    </Link>
                  );
                })}
              </nav>

              {/* ✨ Premium Right Section */}
              <div className="flex items-center space-x-3 ml-auto">
                
                {/* Admin Button - Only visible to admin */}
                <AdminButton />
                
                {/* Network Status - Desktop Only */}
                <div className="hidden lg:block">
                  <NetworkStatus compact />
                </div>
                
                {/* Network Switcher - Desktop */}
                <div className="hidden md:block">
                  <NetworkSwitcher />
                </div>
                
                {/* Language Switcher - Desktop */}
                <div className="hidden md:block">
                  <LanguageContainer />
                </div>
                
                {/* ✨ Premium Connect Button */}
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
                                className="
                                  group relative overflow-hidden
                                  h-[44px] px-6 py-2
                                  bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                                  text-white font-semibold text-[14px] tracking-[0.01em]
                                  rounded-[14px]
                                  shadow-[0_8px_32px_rgba(59,130,246,0.4),0_1px_0_rgba(255,255,255,0.2)_inset]
                                  hover:shadow-[0_12px_40px_rgba(59,130,246,0.5),0_1px_0_rgba(255,255,255,0.25)_inset]
                                  hover:scale-[1.02] hover:-translate-y-[1px]
                                  active:scale-[0.98] active:translate-y-[0px]
                                  transition-all duration-300 ease-out
                                "
                              >
                                <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Connect Wallet</span>
                                
                                {/* Shimmer эффект */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.25] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
                              </button>
                            );
                          }

                          return (
                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="
                                group relative overflow-hidden
                                h-[44px] px-4 py-2 min-w-[140px]
                                backdrop-blur-[12px] backdrop-saturate-[1.8] backdrop-brightness-[1.1]
                                bg-gradient-to-br from-white/[0.15] via-white/[0.1] to-white/[0.05]
                                border border-white/[0.2] hover:border-white/[0.3]
                                text-slate-700 hover:text-slate-900 font-medium text-[14px]
                                rounded-[14px]
                                shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.1)_inset]
                                hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.15)_inset]
                                hover:scale-[1.02] hover:-translate-y-[1px]
                                active:scale-[0.98] active:translate-y-[0px]
                                transition-all duration-300 ease-out
                              "
                            >
                              <span className="truncate max-w-32">
                                {account.displayName}
                                {account.displayBalance && ` (${account.displayBalance})`}
                              </span>
                              
                              {/* Неоморфный внутренний свет */}
                              <div className="absolute inset-[1px] rounded-[13px] bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Shimmer эффект */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
                            </button>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>

                {/* ✨ Premium Mobile Menu Button */}
                <button
                  onClick={toggleMobileMenu}
                  className="
                    lg:hidden group relative overflow-hidden
                    h-[44px] w-[44px] p-2
                    backdrop-blur-[12px] backdrop-saturate-[1.8] backdrop-brightness-[1.1]
                    bg-gradient-to-br from-white/[0.15] via-white/[0.1] to-white/[0.05]
                    border border-white/[0.2] hover:border-white/[0.3]
                    text-slate-700 hover:text-slate-900
                    rounded-[14px]
                    shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.1)_inset]
                    hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.15)_inset]
                    hover:scale-[1.02] hover:-translate-y-[1px]
                    active:scale-[0.98] active:translate-y-[0px]
                    transition-all duration-300 ease-out
                    ml-2
                  "
                  aria-label="Toggle mobile menu"
                >
                  <div className="relative w-5 h-5 mx-auto">
                    <Menu 
                      className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                        isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                      }`} 
                    />
                    <X 
                      className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                        isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                      }`} 
                    />
                  </div>
                  
                  {/* Неоморфный внутренний свет */}
                  <div className="absolute inset-[1px] rounded-[13px] bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Shimmer эффект */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
                </button>
              </div>
            </div>

            {/* ✨ Premium Mobile Menu */}
            <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-out ${
              isMobileMenuOpen 
                ? 'max-h-[500px] opacity-100 pb-6' 
                : 'max-h-0 opacity-0 pb-0'
            }`}>
              <div className="pt-4 space-y-3">
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  {navigation.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          group relative overflow-hidden
                          flex items-center space-x-3
                          w-full h-[52px] px-4 py-3
                          font-semibold text-[15px] tracking-[0.01em]
                          rounded-[16px]
                          transition-all duration-300 ease-out
                          ${active 
                            ? `
                              bg-gradient-to-br from-blue-500 to-blue-600
                              text-white shadow-[0_8px_32px_rgba(59,130,246,0.4),0_1px_0_rgba(255,255,255,0.2)_inset]
                              scale-[1.01] -translate-y-[1px]
                            `
                            : `
                              backdrop-blur-[8px] backdrop-saturate-[1.5]
                              bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.04]
                              border border-white/[0.15] hover:border-white/[0.25]
                              text-slate-700 hover:text-slate-900
                              shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.1)_inset]
                              hover:shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.15)_inset]
                              hover:scale-[1.01] hover:-translate-y-[1px]
                            `
                          }
                        `}
                        style={{ 
                          animationDelay: `${index * 50}ms` 
                        }}
                      >
                        <Icon className={`w-5 h-5 transition-all duration-300 ${
                          active 
                            ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' 
                            : 'text-slate-600 group-hover:text-slate-800 group-hover:scale-110'
                        }`} />
                        <span className={active ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : ''}>{item.name}</span>
                        
                        {/* Неоморфный внутренний свет для неактивных */}
                        {!active && (
                          <div className="absolute inset-[1px] rounded-[15px] bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                        
                        {/* Shimmer эффект */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${
                          active 
                            ? 'from-transparent via-white/[0.25] to-transparent' 
                            : 'from-transparent via-white/[0.15] to-transparent'
                        } translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out`} />
                      </Link>
                    );
                  })}
                </div>
                
                {/* Mobile Controls */}
                <div className="pt-4 space-y-3 border-t border-white/[0.15]">
                  {isAdmin && (
                    <button
                      onClick={toggleAdminPanel}
                      className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 rounded-lg font-medium"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  <div className="w-full">
                    <NetworkStatus compact className="mb-3" />
                  </div>
                  <NetworkSwitcher isMobile />
                  <LanguageContainer isMobile />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✨ Premium Wave Transition */}
        <WaveTransition 
          className="relative z-10" 
          intensity={0.12}
          speed={0.5}
          height={6}
        />
      </header>

      {/* ✅ ADMIN PANEL MODAL */}
      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
      />
    </>
  );
};

export default Header; 