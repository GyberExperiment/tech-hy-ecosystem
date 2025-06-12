import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
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

const Dashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    vcContract, 
    vgContract, 
    vgVotesContract, 
    lpContract,
    provider 
  } = useWeb3();

  const [balances, setBalances] = useState<Record<string, string>>({});
  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!account || !isCorrectNetwork) return;
    
    setLoading(true);
    try {
      const balancePromises = [];

      // BNB balance
      if (provider) {
        balancePromises.push(
          provider.getBalance(account).then(balance => ({
            symbol: 'BNB',
            balance: ethers.formatEther(balance)
          }))
        );
      }

      // Token balances
      const contracts = [
        { contract: vcContract, symbol: 'VC' },
        { contract: vgContract, symbol: 'VG' },
        { contract: vgVotesContract, symbol: 'VGV' },
        { contract: lpContract, symbol: 'LP' },
      ];

      for (const { contract, symbol } of contracts) {
        if (contract && contract.balanceOf) {
          balancePromises.push(
            contract.balanceOf(account).then((balance: any) => ({
              symbol,
              balance: ethers.formatEther(balance)
            }))
          );
        }
      }

      const results = await Promise.all(balancePromises);
      const newBalances: Record<string, string> = {};
      
      results.forEach(result => {
        if (result.symbol === 'BNB') {
          setBnbBalance(result.balance);
        } else {
          newBalances[result.symbol] = result.balance;
        }
      });

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchBalances();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchBalances();
      }, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [account, isConnected, isCorrectNetwork]);

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

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
      balance: balances.VGV || '0',
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
      value: formatBalance(bnbBalance),
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
      value: formatBalance(balances.VGV || '0'),
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
      </div>

      {/* Connection Status & Troubleshooting */}
      {!isConnected && (
        <WalletTroubleshoot />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-white">
                    {loading ? t('common:labels.loading') : stat.value}
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
        <h2 className="text-2xl font-bold mb-6 flex items-center">
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
                    <h3 className="font-bold text-lg">{token.symbol}</h3>
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
                <p className="text-2xl font-bold">
                  {loading ? t('common:labels.loading') : formatBalance(token.balance)}
                </p>
                <p className="text-sm text-gray-400">{token.symbol}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Activity className="mr-3 text-green-400" />
          {t('dashboard:sections.quickActions')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Coins className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2">{t('dashboard:actions.manageTokens.title')}</h3>
            <p className="text-gray-400 mb-4">{t('dashboard:actions.manageTokens.description')}</p>
            <a href="/tokens" className="btn-primary inline-block">
              {t('dashboard:actions.manageTokens.button')}
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2">{t('dashboard:actions.lpLocking.title')}</h3>
            <p className="text-gray-400 mb-4">{t('dashboard:actions.lpLocking.description')}</p>
            <a href="/staking" className="btn-primary inline-block">
              {t('dashboard:actions.lpLocking.button')}
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2">{t('dashboard:actions.governance.title')}</h3>
            <p className="text-gray-400 mb-4">{t('dashboard:actions.governance.description')}</p>
            <a href="/governance" className="btn-primary inline-block">
              {t('dashboard:actions.governance.button')}
            </a>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">{t('dashboard:sections.contractAddresses')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {Object.entries(CONTRACTS).map(([name, address]) => (
            <div key={name} className="flex justify-between items-center p-2 rounded bg-white/5">
              <span className="font-medium">{name.replace(/_/g, ' ')}</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
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