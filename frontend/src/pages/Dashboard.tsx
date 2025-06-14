import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../constants/contracts';
import { 
  Activity, 
  Coins, 
  TrendingUp, 
  Users, 
  ExternalLink, 
  Lock, 
  AlertTriangle, 
  CreditCard,
  Gift,
  Vote,
  Rocket
} from 'lucide-react';
import WalletTroubleshoot from '../components/WalletTroubleshoot';
import StakingStats from '../components/StakingStats';
import TransactionHistory from '../components/TransactionHistory';
import ConnectionDebug from '../components/ConnectionDebug';
import TokenStats from '../components/TokenStats';
import { useTokenData } from '../hooks/useTokenData';

const Dashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { 
    account, 
    isConnected, 
    isCorrectNetwork
  } = useWeb3();

  // Use the shared token data hook
  const { 
    balances, 
    tokens,
    loading: tokenLoading, 
    refreshing,
    formatBalance 
  } = useTokenData();

  const [initialLoading, setInitialLoading] = useState(true);

  // Set initial loading to false when token data is loaded
  useEffect(() => {
    if (!tokenLoading && (balances.VC !== '0' || balances.VG !== '0' || balances.BNB !== '0')) {
      setInitialLoading(false);
    }
  }, [tokenLoading, balances]);

  const tokenCards = [
    {
      symbol: 'VC',
      name: TOKEN_INFO.VC.name,
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      balance: balances.VC || '0',
      address: CONTRACTS.VC_TOKEN,
    },
    {
      symbol: 'VG',
      name: TOKEN_INFO.VG.name,
      icon: <Gift className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      balance: balances.VG || '0',
      address: CONTRACTS.VG_TOKEN,
    },
    {
      symbol: 'VGV',
      name: TOKEN_INFO.VG_VOTES.name,
      icon: <Vote className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      balance: balances.VGVotes || '0',
      address: CONTRACTS.VG_TOKEN_VOTES,
    },
    {
      symbol: 'LP',
      name: TOKEN_INFO.LP.name,
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      balance: balances.LP || '0',
      address: CONTRACTS.LP_TOKEN,
    },
  ];

  const stats = [
    {
      title: t('dashboard:stats.bnbBalance'),
      value: formatBalance(balances.BNB || '0'),
      unit: 'tBNB',
      icon: Activity,
      color: 'text-blue-400',
    },
    {
      title: t('dashboard:stats.totalTokens'),
      value: tokenCards.filter(token => parseFloat(token.balance) > 0).length.toString(),
      unit: t('dashboard:stats.types'),
      icon: Coins,
      color: 'text-green-400',
    },
    {
      title: t('dashboard:stats.lpLocking'),
      value: parseFloat(balances.LP || '0') > 0 ? t('dashboard:stats.active') : t('dashboard:stats.inactive'),
      unit: '',
      icon: TrendingUp,
      color: 'text-purple-400',
    },
    {
      title: t('dashboard:stats.governancePower'),
      value: formatBalance(balances.VGVotes || '0'),
      unit: t('dashboard:stats.votes'),
      icon: Users,
      color: 'text-yellow-400',
    },
  ];

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('dashboard:welcome')}
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('dashboard:subtitle')}
          </p>
          <div className="text-lg text-gray-300">
            {t('common:messages.connectWallet')}
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-3xl font-bold mb-4 text-red-400">
            {t('dashboard:errors.wrongNetwork')}
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            {t('common:messages.wrongNetwork')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 px-4 md:px-8 lg:px-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {t('dashboard:title')}
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {t('dashboard:subtitle')}
        </p>
        {refreshing && (
          <div className="flex items-center justify-center space-x-2 text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm">{t('common:labels.refreshing')}</span>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <ConnectionDebug />

      {/* Connection Status & Troubleshooting */}
      {!isConnected && (
        <WalletTroubleshoot />
      )}

      {/* Token Statistics - Reusable Component */}
      <TokenStats />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-slate-100">
                    {initialLoading ? t('common:labels.loading') : refreshing ? t('common:labels.refreshing') : stat.value}
                  </p>
                  {stat.unit && (
                    <p className="text-sm text-gray-400">{stat.unit}</p>
                  )}
                </div>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Token Balances */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Coins className="mr-3 text-blue-400" />
          {t('dashboard:sections.tokenBalances')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tokenCards.map((token) => (
            <div key={token.symbol} className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-xl`}>
                    {token.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{token.symbol}</h3>
                    <p className="text-sm text-gray-400">{token.name}</p>
                  </div>
                </div>
                <a
                  href={`${BSC_TESTNET.blockExplorer}/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white" />
                </a>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-100">
                  {initialLoading ? t('common:labels.loading') : refreshing ? t('common:labels.refreshing') : formatBalance(token.balance)}
                </p>
                <p className="text-sm text-gray-400">{token.symbol}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Activity className="mr-3 text-green-400" />
          {t('dashboard:sections.quickActions')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Coins className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">{t('dashboard:actions.manageTokens.title')}</h3>
            <p className="text-gray-400 mb-4">{t('dashboard:actions.manageTokens.description')}</p>
            <a href="/tokens" className="btn-primary inline-block">
              {t('dashboard:actions.manageTokens.button')}
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">{t('dashboard:actions.lpLocking.title')}</h3>
            <p className="text-gray-400 mb-4">{t('dashboard:actions.lpLocking.description')}</p>
            <a href="/staking" className="btn-primary inline-block">
              {t('dashboard:actions.lpLocking.button')}
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">{t('dashboard:actions.governance.title')}</h3>
            <p className="text-gray-400 mb-4">{t('dashboard:actions.governance.description')}</p>
            <a href="/governance" className="btn-primary inline-block">
              {t('dashboard:actions.governance.button')}
            </a>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 text-slate-100">{t('dashboard:sections.contractAddresses')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {tokenCards.map((token) => (
            <div key={token.symbol} className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium text-slate-200">{token.name}</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${token.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Staking Stats */}
      <StakingStats />

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default Dashboard; 