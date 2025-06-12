import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../constants/contracts';
import EarnVGWidget from '../components/EarnVGWidget';
import VGConverter from '../components/VGConverter';
import LPPoolManager from '../components/LPPoolManager';
import TransactionHistory from '../components/TransactionHistory';
import { 
  Rocket, 
  Gift, 
  Vote, 
  Lock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Users,
  Shield,
  BarChart3,
  Coins,
  ExternalLink,
  RefreshCw,
  Zap,
  Target,
  DollarSign
} from 'lucide-react';

const LPLocking: React.FC = () => {
  const { t } = useTranslation(['locking', 'common']);
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
  const [lpLockerStats, setLpLockerStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!account || !isCorrectNetwork) return;
    
    setLoading(true);
    try {
      const balancePromises = [];

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
            contract.balanceOf(account)
              .then((balance: any) => ({
                symbol,
                balance: balance ? ethers.formatEther(balance) : '0'
              }))
              .catch((error: any) => {
                console.warn(`Error fetching ${symbol} balance:`, error);
                return { symbol, balance: '0' };
              })
          );
        }
      }

      const results = await Promise.allSettled(balancePromises);
      const newBalances: Record<string, string> = {};
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          newBalances[result.value.symbol] = result.value.balance;
        } else {
          // Fallback для неудачных запросов
          const symbol = contracts[index]?.symbol;
          if (symbol) {
            newBalances[symbol] = '0';
          }
        }
      });

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
      // Устанавливаем fallback значения при критической ошибке
      setBalances({
        VC: '0',
        VG: '0',
        VGV: '0',
        LP: '0',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLPLockerStats = async () => {
    if (!lpLockerContract) return;
    
    try {
      const [poolInfo, config] = await Promise.all([
        lpLockerContract.getPoolInfo(),
        lpLockerContract.config()
      ]);

      setLpLockerStats({
        totalLockedLp: poolInfo.totalLockedLp ? ethers.formatEther(poolInfo.totalLockedLp) : '0',
        totalVgIssued: poolInfo.totalVgIssued ? ethers.formatEther(poolInfo.totalVgIssued) : '0',
        lpToVgRatio: config.lpToVgRatio ? config.lpToVgRatio.toString() : '0',
        lpDivisor: config.lpDivisor ? config.lpDivisor.toString() : '0',
      });
    } catch (error) {
      console.error('Error fetching LP Locker stats:', error);
      setLpLockerStats({
        totalLockedLp: '0',
        totalVgIssued: '0',
        lpToVgRatio: '0',
        lpDivisor: '0',
      });
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchBalances();
      fetchLPLockerStats();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchBalances();
        fetchLPLockerStats();
      }, 30000);
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

  const stats = [
    {
      title: 'Ваши VG токены',
      value: formatBalance(balances.VG || '0'),
      unit: 'VG',
      icon: Gift,
      color: 'text-yellow-400',
    },
    {
      title: 'Voting Power',
      value: formatBalance(balances.VGV || '0'),
      unit: 'VGV',
      icon: Vote,
      color: 'text-purple-400',
    },
    {
      title: 'LP токены',
      value: formatBalance(balances.LP || '0'),
      unit: 'LP',
      icon: Rocket,
      color: 'text-green-400',
    },
    {
      title: 'Всего заблокировано',
      value: formatBalance(lpLockerStats.totalLockedLp || '0'),
      unit: 'LP',
      icon: Lock,
      color: 'text-blue-400',
    },
  ];

  const protocolStats = [
    {
      title: 'Общий объем LP',
      value: formatBalance(lpLockerStats.totalLockedLp || '0'),
      unit: 'LP заблокировано',
      icon: Lock,
      color: 'text-blue-400',
    },
    {
      title: 'VG выпущено',
      value: formatBalance(lpLockerStats.totalVgIssued || '0'),
      unit: 'VG токенов',
      icon: Gift,
      color: 'text-yellow-400',
    },
    {
      title: 'Курс обмена',
      value: lpLockerStats.lpToVgRatio || '0',
      unit: 'VG за LP',
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      title: 'Активные пользователи',
      value: '42', // Mock data - в продакшене получать из контракта
      unit: 'участников',
      icon: Users,
      color: 'text-purple-400',
    },
  ];

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('common:messages.connectWallet')}
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Подключите кошелек для доступа к LP Locking
          </p>
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
            Неправильная сеть
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
        <div className="flex items-center justify-center space-x-3">
          <Rocket className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('locking:title')}
        </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {t('locking:subtitle')}
        </p>
      </div>

      {/* Personal Stats */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Activity className="mr-3 text-blue-400" />
          Ваша статистика
        </h2>
        
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card">
          <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-white">
                      {loading ? 'Загрузка...' : stat.value}
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
      </div>

      {/* Main Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LP Locking Widget */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="mr-3 text-yellow-400" />
            LP Locking & Earn VG
          </h2>
          <EarnVGWidget />
        </div>

        {/* VG Converter */}
            <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Vote className="mr-3 text-purple-400" />
            VG ↔ VGVotes Converter
          </h2>
          <VGConverter />
                </div>
              </div>

      {/* Protocol Statistics */}
                <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <BarChart3 className="mr-3 text-green-400" />
          Статистика протокола
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {protocolStats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">
                      {loading ? 'Загрузка...' : stat.value}
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
        </div>

      {/* How it Works */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Target className="mr-3 text-blue-400" />
          Как работает LP Locking
          </h2>

          <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Создайте LP</h3>
              <p className="text-gray-300 text-sm">
                Добавьте VC и BNB токены в пул ликвидности PancakeSwap или используйте готовые LP токены
              </p>
              </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Заблокируйте навсегда</h3>
              <p className="text-gray-300 text-sm">
                LP токены блокируются навсегда в обмен на VG токены по курсу {lpLockerStats.lpToVgRatio || '15'}:1
              </p>
                </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Участвуйте в DAO</h3>
              <p className="text-gray-300 text-sm">
                Конвертируйте VG в VGVotes и голосуйте в governance за развитие экосистемы
              </p>
            </div>
          </div>
                </div>
              </div>

      {/* Quick Actions */}
                <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Zap className="mr-3 text-yellow-400" />
          Быстрые действия
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Coins className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2">Управление токенами</h3>
            <p className="text-gray-400 mb-4">Переводы, approve и управление балансами</p>
            <a href="/tokens" className="btn-primary inline-block">
              Перейти к токенам
            </a>
                </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2">Governance</h3>
            <p className="text-gray-400 mb-4">Голосование и участие в управлении</p>
            <a href="/governance" className="btn-primary inline-block">
              Перейти к Governance
            </a>
              </div>

          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2">Analytics</h3>
            <p className="text-gray-400 mb-4">Статистика и аналитика экосистемы</p>
            <a href="/" className="btn-primary inline-block">
              Перейти к Dashboard
            </a>
              </div>
            </div>
          </div>

      {/* LP Pool Manager */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <DollarSign className="mr-3 text-green-400" />
          Управление ликвидностью
        </h2>
        <LPPoolManager />
      </div>

      {/* Contract Information */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Shield className="mr-3 text-blue-400" />
          Информация о контрактах
        </h2>
        
          <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium">LP Locker</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.LP_LOCKER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.LP_LOCKER.slice(0, 6)}...${CONTRACTS.LP_LOCKER.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium">LP Token</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.LP_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.LP_TOKEN.slice(0, 6)}...${CONTRACTS.LP_TOKEN.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium">VG Token</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.VG_TOKEN.slice(0, 6)}...${CONTRACTS.VG_TOKEN.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium">VG Votes</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN_VOTES}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.VG_TOKEN_VOTES.slice(0, 6)}...${CONTRACTS.VG_TOKEN_VOTES.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default LPLocking; 