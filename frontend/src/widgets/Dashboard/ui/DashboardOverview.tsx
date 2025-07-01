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
  Smile
} from 'lucide-react';

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
}

interface Portfolio {
  name: string;
  symbol: string;
  amount: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
}

interface Activity {
  type: string;
  description: string;
  timestamp: string;
  amount?: string;
  status: 'completed' | 'pending' | 'failed';
}

const DashboardOverview: React.FC = () => {
  const metrics: DashboardMetric[] = [
    {
      title: 'Total Portfolio Value',
      value: '$42,834.67',
      change: '+12.3%',
      changeType: 'positive',
      icon: DollarSign
    },
    {
      title: 'Active Investments',
      value: '8',
      change: '+2',
      changeType: 'positive',
      icon: Target
    },
    {
      title: 'VG Tokens Earned',
      value: '1,247.89',
      change: '+24.7%',
      changeType: 'positive',
      icon: Coins
    },
    {
      title: 'Reputation Score',
      value: '98/100',
      change: '+5',
      changeType: 'positive',
      icon: Award
    }
  ];

  const portfolio: Portfolio[] = [
    {
      name: 'VC Token',
      symbol: 'VC',
      amount: '15,000',
      value: '$28,500',
      change: '+15.2%',
      changeType: 'positive'
    },
    {
      name: 'VG Token',
      symbol: 'VG',
      amount: '1,247.89',
      value: '$8,735.23',
      change: '+24.7%',
      changeType: 'positive'
    },
    {
      name: 'BNB',
      symbol: 'BNB',
      amount: '12.5',
      value: '$5,599.44',
      change: '-2.1%',
      changeType: 'negative'
    }
  ];

  const recentActivity: Activity[] = [
    {
      type: 'Stake',
      description: 'Staked 5,000 VC tokens in LP pool',
      timestamp: '2 hours ago',
      amount: '5,000 VC',
      status: 'completed'
    },
    {
      type: 'Earn',
      description: 'Earned VG tokens from burn mechanism',
      timestamp: '1 day ago',
      amount: '+247.89 VG',
      status: 'completed'
    },
    {
      type: 'Investment',
      description: 'Invested in AI Startup Project #247',
      timestamp: '3 days ago',
      amount: '$2,500',
      status: 'pending'
    },
    {
      type: 'KYC',
      description: 'Completed KYC verification',
      timestamp: '1 week ago',
      status: 'completed'
    }
  ];

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
            </div>
          </div>
          <div className="flex items-center gap-2 glass-badge-success">
            <Shield className="w-4 h-4" />
            <span>KYC Verified</span>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="glass-card-breathing group relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <metric.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                metric.changeType === 'positive' ? 'bg-green-500/20 text-green-300' :
                metric.changeType === 'negative' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {metric.change}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
            <p className="text-gray-400 text-sm">{metric.title}</p>
          </motion.div>
        ))}
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
            {portfolio.map((asset, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-4 glass-ultra rounded-lg group hover:bg-white/5 transition-colors"
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {asset.symbol}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{asset.name}</p>
                    <p className="text-gray-400 text-sm">{asset.amount} {asset.symbol}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-white font-semibold">{asset.value}</p>
                  <p className={`text-sm ${
                    asset.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {asset.change}
                  </p>
                </div>
              </motion.div>
            ))}
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
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 glass-ultra rounded-lg group hover:bg-white/5 transition-colors"
                whileHover={{ x: 3 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  activity.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                  activity.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {activity.type[0]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                    {activity.amount && (
                      <p className="text-blue-400 text-xs font-semibold">{activity.amount}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { title: 'Stake Tokens', icon: Coins, color: 'blue' },
            { title: 'Browse Projects', icon: Target, color: 'purple' },
            { title: 'Earn VG', icon: Zap, color: 'green' },
            { title: 'Join Community', icon: Users, color: 'orange' }
          ].map((action, index) => (
            <motion.button
              key={index}
              className="glass-btn-ghost group flex flex-col items-center !py-6"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className={`w-8 h-8 mb-3 group-hover:scale-110 transition-transform ${
                action.color === 'blue' ? 'text-blue-400' :
                action.color === 'purple' ? 'text-purple-400' :
                action.color === 'green' ? 'text-green-400' :
                'text-orange-400'
              }`} />
              <span className="text-sm font-medium">{action.title}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardOverview; 