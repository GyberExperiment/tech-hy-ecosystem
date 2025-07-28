import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Award, 
  Users, 
  Zap,
  Target,
  ChevronRight,
  BarChart3,
  Coins,
  Shield,
  Smile,
  TrendingUp,
  Activity,
  Plus,
  Gift,
  ShoppingCart,
  Vote,
  Wallet,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useRealDashboardData } from '../hooks/useRealDashboardData';

// Icon mapping for dynamic icons
const IconMap = {
  DollarSign,
  Target,
  Coins,
  Award,
  TrendingUp,
  Activity,
  Plus,
  Gift,
  ShoppingCart,
  Vote,
  Wallet,
  Shield,
};

  const DashboardOverview: React.FC = () => {
  const {
    metrics,
    portfolio,
    recentActivity,
    stats,
    portfolioValue,
    loading,
    error,
    isConnected,
    refreshData,
  } = useRealDashboardData();

  // Helper function to format time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Loading state for non-connected users
  if (!isConnected) {
    return (
      <motion.div
        className="space-y-6 animate-section-breathing-subtle"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="glass-enhanced-breathing p-6"
        >
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-300">
              Connect your wallet to view your personalized dashboard with real portfolio data
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        className="space-y-6 animate-section-breathing-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass-enhanced-breathing p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Failed to Load Dashboard</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="space-y-6 animate-section-breathing-subtle"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="glass-enhanced-breathing p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
              <Smile className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Investor!</h1>
              <p className="text-gray-300">Here's what's happening in your TECH HY ecosystem</p>
              {portfolioValue.totalValue > 0 && (
                <div className="mt-2 flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Portfolio: <span className="text-blue-300 font-semibold">{portfolioValue.formatted}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Assets: <span className="text-purple-300 font-semibold">{portfolio.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {portfolioValue.totalValue > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Value</div>
                <div className="text-xl font-bold text-green-300">{portfolioValue.formatted}</div>
              </div>
            )}
            <div className="flex items-center gap-2 glass-badge-success">
              <Shield className="w-4 h-4" />
              <span>KYC Verified</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = IconMap[metric.icon as keyof typeof IconMap] || DollarSign;
          
          return (
            <motion.div
              key={metric.title}
              variants={itemVariants}
              className="glass-card-breathing group relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  {metric.isLoading ? (
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  ) : (
                    <IconComponent className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  metric.changeType === 'positive' ? 'bg-green-500/20 text-green-300' :
                  metric.changeType === 'negative' ? 'bg-red-500/20 text-red-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {metric.change}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-1">
                {metric.isLoading ? '...' : metric.value}
              </h3>
              <p className="text-gray-400 text-sm">{metric.title}</p>
              
              {/* Mini trend chart */}
              {metric.trend && metric.trend.length > 0 && !metric.isLoading && (
                <div className="mt-4 h-6 flex items-end space-x-1">
                  {metric.trend.map((value, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-400/30 rounded-sm transition-all duration-300 group-hover:bg-blue-400/50"
                      style={{ 
                        height: `${(value / Math.max(...metric.trend)) * 100}%`,
                        minHeight: '2px'
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Portfolio */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 glass-enhanced-breathing"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Portfolio Overview</h2>
            <motion.button
              className="glass-btn-ghost !px-4 !py-2 !min-h-auto text-sm group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
          
          <div className="space-y-4">
            {portfolio.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No assets found</p>
                <p className="text-gray-500 text-xs">Purchase tokens to see your portfolio</p>
              </div>
            ) : (
              portfolio.map((asset, index) => {
                const IconComponent = IconMap[asset.icon as keyof typeof IconMap] || Coins;
                
                return (
                  <motion.div
                    key={asset.symbol}
                    className="flex items-center justify-between p-4 glass-ultra rounded-lg group hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                        <IconComponent className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{asset.name}</p>
                        <p className="text-gray-400 text-sm">{asset.amount} {asset.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-white font-semibold">{asset.value}</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${
                          asset.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {asset.change}
                        </p>
                        <div className="text-xs text-gray-500">
                          ({asset.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={itemVariants}
          className="glass-enhanced-breathing"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No recent activity</p>
                <p className="text-gray-500 text-xs">Start trading to see your activity</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => {
                const IconComponent = IconMap[activity.icon as keyof typeof IconMap] || Activity;
                const timestamp = new Date(activity.timestamp);
                const timeAgo = getTimeAgo(timestamp);
                
                return (
                  <motion.div
                    key={`${activity.type}-${index}`}
                    className="flex items-start gap-3 p-3 glass-ultra rounded-lg group hover:bg-white/5 transition-colors"
                    whileHover={{ x: 3 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                      activity.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium leading-relaxed">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-gray-400 text-xs">{timeAgo}</p>
                        {activity.amount && (
                          <p className="text-blue-400 text-xs font-semibold">{activity.amount}</p>
                        )}
                      </div>
                      {activity.txHash && (
                        <p className="text-gray-500 text-xs mt-1 truncate">
                          Tx: {activity.txHash.slice(0, 8)}...{activity.txHash.slice(-6)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          
          <motion.button
            className="w-full glass-btn-ghost !py-2 !min-h-auto text-sm mt-4 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>View All Activity</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="glass-enhanced-breathing">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          <div className="text-sm text-gray-400">
            {portfolio.length > 0 ? 'Manage your portfolio' : 'Get started'}
          </div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { 
              title: portfolio.length > 0 ? 'Add Liquidity' : 'Buy VC Tokens', 
              icon: portfolio.length > 0 ? Plus : ShoppingCart, 
              color: 'blue',
              description: portfolio.length > 0 ? 'Earn fees' : 'Start investing'
            },
            { 
              title: 'Stake & Earn', 
              icon: Coins, 
              color: 'purple',
              description: 'Earn VG rewards'
            },
            { 
              title: stats.stakingRewards > 0 ? 'Claim Rewards' : 'Start Staking', 
              icon: Gift, 
              color: 'green',
              description: stats.stakingRewards > 0 ? `$${stats.stakingRewards.toFixed(2)} available` : 'Passive income'
            },
            { 
              title: 'Governance', 
              icon: Vote, 
              color: 'orange',
              description: stats.governanceParticipation > 0 ? `${stats.governanceParticipation.toFixed(0)}% participation` : 'Vote on proposals'
            }
          ].map((action, index) => (
            <motion.button
              key={`${action.title}-${index}`}
              className="glass-btn-ghost group flex flex-col items-center !py-6 text-center"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className={`w-8 h-8 mb-3 group-hover:scale-110 transition-transform ${
                action.color === 'blue' ? 'text-blue-400' :
                action.color === 'purple' ? 'text-purple-400' :
                action.color === 'green' ? 'text-green-400' :
                'text-orange-400'
              }`} />
              <span className="text-sm font-medium mb-1">{action.title}</span>
              <span className="text-xs text-gray-400">{action.description}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardOverview; 