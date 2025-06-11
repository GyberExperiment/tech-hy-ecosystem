import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../constants/contracts';
import { 
  Activity, 
  Coins, 
  TrendingUp, 
  Users, 
  ExternalLink, 
  Wallet, 
  Lock, 
  AlertTriangle, 
  BarChart3,
  CreditCard,
  Gift,
  Vote,
  Rocket,
  Shield
} from 'lucide-react';
import WalletTroubleshoot from '../components/WalletTroubleshoot';
import StakingStats from '../components/StakingStats';
import TransactionHistory from '../components/TransactionHistory';

interface TokenBalance {
  symbol: string;
  balance: string;
  name: string;
}

const Dashboard: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    vcContract, 
    vgContract, 
    vgVotesContract, 
    lpContract,
    lpLockerContract,
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
        if (contract) {
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
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [account, isConnected, isCorrectNetwork]);

  const formatBalance = (balance: string) => {
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
      title: 'Your BNB Balance',
      value: formatBalance(bnbBalance),
      unit: 'tBNB',
      icon: Activity,
      color: 'text-blue-400',
    },
    {
      title: 'Total Tokens',
      value: tokenCards.filter(token => parseFloat(token.balance) > 0).length.toString(),
      unit: 'types',
      icon: Coins,
      color: 'text-green-400',
    },
    {
      title: 'LP Locking',
      value: parseFloat(balances.LP || '0') > 0 ? 'Active' : 'Inactive',
      unit: '',
      icon: TrendingUp,
      color: 'text-purple-400',
    },
    {
      title: 'Governance Power',
      value: formatBalance(balances.VGV || '0'),
      unit: 'votes',
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
            Welcome to Ecosystem
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Comprehensive DApp for LP Staking, Governance, and Token Management on BSC Testnet
          </p>
          <div className="text-lg text-gray-300">
            Please connect your wallet to continue
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
            Wrong Network Detected
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Please switch to BSC Testnet to use this DApp
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
          Ecosystem Dashboard
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Экосистема LP с governance функциями
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
                    {loading ? '...' : stat.value}
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
          Token Balances
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
                  {loading ? '...' : formatBalance(token.balance)}
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
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Coins className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2">Manage Tokens</h3>
            <p className="text-gray-400 mb-4">Transfer, approve, and manage your tokens</p>
            <a href="/tokens" className="btn-primary inline-block">
              Go to Tokens
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2">LP Locking</h3>
            <p className="text-gray-400 mb-4">Блокируйте LP токены и получайте VG мгновенно</p>
            <a href="/staking" className="btn-primary inline-block">
              Start Locking
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2">Governance</h3>
            <p className="text-gray-400 mb-4">Vote on proposals and shape the ecosystem</p>
            <a href="/governance" className="btn-primary inline-block">
              Participate
            </a>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Contract Addresses</h3>
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