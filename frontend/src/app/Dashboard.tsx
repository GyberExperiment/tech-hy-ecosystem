import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';
import { useWeb3 } from '../shared/lib/Web3Context';
import PageConnectionPrompt from '../shared/ui/PageConnectionPrompt';
import StakingStats from '../entities/Staking/ui/StakingStats';
import { BuyVCWidget } from '../entities/Token';
import { 
  Wallet,
  BarChart3,
  DollarSign,
  Coins,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Activity, 
  Users, 
  Zap,
  Lock
} from 'lucide-react';

interface AccountStats {
  vcBalance: string;
  bnbBalance: string;
  lpBalance: string;
  vgBalance: string;
  totalValue: string;
  lockedLP: string;
  pendingRewards: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { address, isConnected } = useAccount();
  const { metaMaskAvailable, isCorrectNetwork } = useWeb3();
  const chainId = useChainId();

  const [accountStats] = useState<AccountStats>({
    vcBalance: '89.9M',
    bnbBalance: '0.3859',
    lpBalance: '159.00',
    vgBalance: '1.6K',
    totalValue: '$2,847.32',
    lockedLP: '159.00',
    pendingRewards: '0.15'
  });

  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // ✅ Show connection status if there are issues
  if (!metaMaskAvailable || !isConnected || !isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PageConnectionPrompt
            title={t('dashboard:title')}
            subtitle={t('dashboard:subtitle')}
            icon={BarChart3}
            iconColor="text-blue-400"
            titleGradient="from-blue-400 to-purple-500"
            isConnected={isConnected && metaMaskAvailable}
            isCorrectNetwork={isCorrectNetwork}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full space-y-8">{/* Убираю max-w-7xl mx-auto */}
        
      {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
          {t('dashboard:title')}
        </h1>
            <p className="text-slate-400">
          {t('dashboard:subtitle')}
        </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Подключен как</div>
              <div className="text-white font-mono text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
      </div>

            <button
              onClick={refreshData}
              disabled={refreshing}
              className="p-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 group"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 group-hover:text-white transition-colors duration-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Account Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-400" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">{accountStats.totalValue}</div>
              <div className="text-sm text-slate-400">Общая стоимость портфеля</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">+2.4%</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">{accountStats.vcBalance}</div>
              <div className="text-sm text-slate-400">VC Баланс</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-400" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">{accountStats.vgBalance}</div>
              <div className="text-sm text-slate-400">VG Токены</div>
            </div>
                </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">Locked</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">{accountStats.lockedLP}</div>
              <div className="text-sm text-slate-400">Заблокированные LP</div>
            </div>
          </div>
        </motion.div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ecosystem Statistics */}
          <motion.div 
            className="lg:col-span-2 space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <StakingStats />
            
            {/* Buy VC Widget - горизонтальный с увеличенным отступом сверху */}
            <motion.div
              className="mt-16 mb-12 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="relative">
                {/* Декоративный фон */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/10 to-blue-500/5 rounded-3xl blur-xl"></div>
                
                {/* Основной виджет */}
                <div className="relative">
                  <BuyVCWidget horizontal className="w-full" />
                </div>
              </div>
            </motion.div>
            
            {/* Разделитель снизу */}
            <div className="relative mt-8">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent h-px"></div>
            </div>
          </motion.div>

          {/* Account Details Sidebar */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            
            {/* Recent Activity */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Последняя активность</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">LP Locked</div>
                      <div className="text-xs text-slate-400">2 часа назад</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">+159 LP</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">VG Received</div>
                      <div className="text-xs text-slate-400">2 часа назад</div>
                    </div>
                  </div>
                  <div className="text-purple-400 font-bold">+1.6K VG</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Coins className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">VC Transfer</div>
                      <div className="text-xs text-slate-400">1 день назад</div>
                    </div>
                  </div>
                  <div className="text-blue-400 font-bold">+89M VC</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="w-5 h-5 text-orange-400" />
                <h3 className="text-xl font-bold text-white">Быстрые действия</h3>
              </div>
              
              <div className="space-y-3">
                <button className="w-full p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-white font-medium">Заблокировать LP</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </button>

                <button className="w-full p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl hover:from-green-500/30 hover:to-blue-500/30 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Coins className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-white font-medium">Управление токенами</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </button>

                <button className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-white font-medium">DAO Голосование</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </button>
              </div>
            </div>

            {/* Portfolio Allocation */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xl font-bold text-white">Распределение портфеля</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">VC Токены</span>
                    <span className="text-white">68.5%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: '68.5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">VG Токены</span>
                    <span className="text-white">22.3%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{ width: '22.3%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">BNB</span>
                    <span className="text-white">9.2%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full" style={{ width: '9.2%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard; 