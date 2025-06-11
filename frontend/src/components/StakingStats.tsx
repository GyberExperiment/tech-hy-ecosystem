import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { TrendingUp, Users, Clock, DollarSign, RefreshCw, Zap } from 'lucide-react';
import { CardSkeleton } from './LoadingSkeleton';

interface PoolData {
  totalLockedLP: string;
  totalVGIssued: string;
  totalVGDeposited: string;
  availableVG: string;
  userVCBalance: string;
  userBNBBalance: string;
  lpToVgRatio: string;
  lpDivisor: string;
}

const StakingStats: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    lpLockerContract, 
    vcContract,
    provider 
  } = useWeb3();

  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPoolStats = async () => {
    if (!account || !isConnected || !isCorrectNetwork || !lpLockerContract || !vcContract || !provider) return;

    try {
      setLoading(true);

      // Параллельные запросы для оптимизации
      const [
        poolInfoRaw,
        configRaw,
        userVCBalanceRaw,
        userBNBBalanceRaw
      ] = await Promise.allSettled([
        lpLockerContract.getPoolInfo(),
        lpLockerContract.config(),
        vcContract.balanceOf(account),
        provider.getBalance(account)
      ]);

      // Обработка результатов с fallback значениями
      const poolInfo = poolInfoRaw.status === 'fulfilled' ? poolInfoRaw.value : [0, 0, 0, 0];
      const config = configRaw.status === 'fulfilled' ? configRaw.value : { lpToVgRatio: 10, lpDivisor: 1000000 };
      
      const userVCBalance = userVCBalanceRaw.status === 'fulfilled' 
        ? ethers.formatEther(userVCBalanceRaw.value) 
        : '0';
      
      const userBNBBalance = userBNBBalanceRaw.status === 'fulfilled' 
        ? ethers.formatEther(userBNBBalanceRaw.value) 
        : '0';

      setPoolData({
        totalLockedLP: ethers.formatEther(poolInfo[0] || 0),
        totalVGIssued: ethers.formatEther(poolInfo[1] || 0),
        totalVGDeposited: ethers.formatEther(poolInfo[2] || 0),
        availableVG: ethers.formatEther(poolInfo[3] || 0),
        userVCBalance,
        userBNBBalance,
        lpToVgRatio: config.lpToVgRatio?.toString() || '10',
        lpDivisor: config.lpDivisor?.toString() || '1000000',
      });

    } catch (error) {
      console.error('Error fetching pool stats:', error);
      // Устанавливаем данные по умолчанию при ошибке
      setPoolData({
        totalLockedLP: '0',
        totalVGIssued: '0',
        totalVGDeposited: '0',
        availableVG: '0',
        userVCBalance: '0',
        userBNBBalance: '0',
        lpToVgRatio: '10',
        lpDivisor: '1000000',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchPoolStats();
      
      // Обновляем каждые 30 секунд
      const interval = setInterval(fetchPoolStats, 30000);
      return () => clearInterval(interval);
    }
  }, [account, isConnected, isCorrectNetwork]);

  const formatNumber = (value: string | number, decimals: number = 2) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(decimals);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  // Расчет потенциальных VG за пример вложения
  const calculatePotentialVG = (vcAmount: number, bnbAmount: number): number => {
    if (!poolData) return 0;
    const lpDivisor = parseFloat(poolData.lpDivisor);
    const lpToVgRatio = parseFloat(poolData.lpToVgRatio);
    const expectedLP = (vcAmount * bnbAmount) / lpDivisor;
    return expectedLP * lpToVgRatio;
  };

  if (!isConnected) {
    return (
      <div className="card text-center text-gray-400">
        <TrendingUp className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">Статистика экосистемы</h3>
        <p>Подключите кошелёк для просмотра статистики</p>
      </div>
    );
  }

  if (loading && !poolData) {
    return <CardSkeleton />;
  }

  if (!poolData) {
    return (
      <div className="card text-center text-gray-400">
        <TrendingUp className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
        <button onClick={fetchPoolStats} className="btn-primary mt-4">
          Попробовать снова
        </button>
      </div>
    );
  }

  const stats = [
    {
      title: 'Заблокировано LP токенов',
      value: formatNumber(poolData.totalLockedLP),
      unit: 'LP',
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Выдано VG наград',
      value: formatNumber(poolData.totalVGIssued),
      unit: 'VG',
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      title: 'Доступно VG в хранилище',
      value: formatNumber(poolData.availableVG),
      unit: 'VG',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
    },
    {
      title: 'Соотношение LP → VG',
      value: poolData.lpToVgRatio,
      unit: 'x',
      icon: RefreshCw,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  // Примеры потенциальных наград
  const exampleRewards = [
    { vc: 100, bnb: 0.1, vg: calculatePotentialVG(100, 0.1) },
    { vc: 1000, bnb: 1, vg: calculatePotentialVG(1000, 1) },
    { vc: 10000, bnb: 10, vg: calculatePotentialVG(10000, 10) },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <TrendingUp className="mr-3 text-blue-400" />
            Статистика LP → VG экосистемы
          </h3>
          <button
            onClick={fetchPoolStats}
            disabled={loading}
            className="btn-secondary p-2"
          >
            <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={16} />
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${stat.bgColor} transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`${stat.color}`} size={20} />
                <span className="text-xs text-gray-400">{stat.unit}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {/* User Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="text-blue-400" size={16} />
              <span className="text-sm text-gray-400">Ваш VC баланс</span>
            </div>
            <div className="text-xl font-bold">{formatNumber(poolData.userVCBalance)} VC</div>
            <div className="text-xs text-gray-500">доступно для обмена</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="text-green-400" size={16} />
              <span className="text-sm text-gray-400">Ваш BNB баланс</span>
            </div>
            <div className="text-xl font-bold">{formatNumber(poolData.userBNBBalance)} BNB</div>
            <div className="text-xs text-gray-500">доступно для обмена</div>
          </div>
        </div>

        {/* Potential Rewards Calculator */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="mr-2 text-yellow-400" size={18} />
            Калькулятор потенциальных VG наград
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleRewards.map((example, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-400 mb-2">
                  {example.vc} VC + {example.bnb} BNB
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  ≈ {formatNumber(example.vg)} VG
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  мгновенная награда
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-400 mb-2">
              Формула: LP = (VC × BNB) / {formatNumber(poolData.lpDivisor)}, VG = LP × {poolData.lpToVgRatio}
            </div>
            <a href="/staking" className="btn-primary">
              Начать зарабатывать VG
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="text-green-400" size={16} />
              <span className="text-sm text-gray-400">Статус системы</span>
            </div>
            <div className="text-lg font-bold text-green-400">
              {parseFloat(poolData.availableVG) > 0 ? 'Активна' : 'Недостаточно VG'}
            </div>
            <div className="text-xs text-gray-500">
              {parseFloat(poolData.availableVG) > 0 
                ? 'Готова к выдаче наград' 
                : 'Требуется пополнение хранилища'}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="text-blue-400" size={16} />
              <span className="text-sm text-gray-400">LP токены навсегда заблокированы</span>
            </div>
            <div className="text-lg font-bold text-blue-400">
              {formatNumber(poolData.totalLockedLP)}
            </div>
            <div className="text-xs text-gray-500">
              нет возможности вывода (by design)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingStats; 