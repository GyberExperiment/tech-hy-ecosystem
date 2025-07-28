import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  Loader2,
  AlertCircle,
  Coins,
  Award,
  Activity,
  Zap,
  Wallet
} from 'lucide-react';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { transactionService, TransactionType, type RealTransaction, type TransactionFilter } from '../services/TransactionService';
import { useFormatUtils } from '../../../shared/hooks/useCalculations';
import { WIDGET_CONFIG } from '../../../shared/config/widgets';

// Icon mapping for transaction types
const IconMap = {
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Award,
  Activity,
  Zap,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
};

const TxHistory: React.FC = () => {
  const { account, isConnected } = useWeb3();
  const { formatTokenAmount, formatAddress, formatHash } = useFormatUtils();
  
  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 🔄 Load transactions
   */
  const loadTransactions = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!account || !isConnected) return;

    setLoading(!append);
    setError(null);

    try {
      const txFilter: TransactionFilter = {};
      if (filterType !== 'all') {
        txFilter.type = filterType as TransactionType;
      }
      if (filterStatus !== 'all') {
        txFilter.status = filterStatus as 'success' | 'failed' | 'pending';
      }

      const result = await transactionService.getUserTransactions(
        account,
        pageNum,
        WIDGET_CONFIG.TRANSACTION_HISTORY.TRANSACTIONS_PER_PAGE,
        txFilter
      );

      if (append) {
        setTransactions(prev => [...prev, ...result.transactions]);
      } else {
        setTransactions(result.transactions);
      }

      setHasMore(result.hasMore);
      setPage(pageNum);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
      setError(errorMessage);
      console.error('Transaction loading failed:', error);
    } finally {
      setLoading(false);
    }
  }, [account, isConnected, filterType, filterStatus]);

  /**
   * 🔄 Refresh transactions
   */
  const refreshTransactions = useCallback(async () => {
    setRefreshing(true);
    transactionService.clearCache();
    await loadTransactions(1, false);
    setRefreshing(false);
  }, [loadTransactions]);

  /**
   * 📄 Load more transactions
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadTransactions(page + 1, true);
    }
  }, [loading, hasMore, page, loadTransactions]);

  // Filter transactions based on search term (client-side filtering for immediate feedback)
  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      tx.hash.toLowerCase().includes(searchLower) ||
      tx.relatedToken.toLowerCase().includes(searchLower) ||
      tx.description.toLowerCase().includes(searchLower) ||
      tx.from.toLowerCase().includes(searchLower) ||
      tx.to.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return parseInt(b.timeStamp) - parseInt(a.timeStamp);
      case 'amount':
        return parseFloat(b.formattedAmount) - parseFloat(a.formattedAmount);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Load transactions when component mounts or dependencies change
  useEffect(() => {
    if (account && isConnected) {
      loadTransactions();
    }
  }, [account, isConnected, filterType, filterStatus]);

  // Refresh transactions periodically
  useEffect(() => {
    if (!account || !isConnected) return;

    const interval = setInterval(
      refreshTransactions,
      WIDGET_CONFIG.TRANSACTION_HISTORY.AUTO_REFRESH_INTERVAL
    );

    return () => clearInterval(interval);
  }, [refreshTransactions]);

  const getTypeIcon = (iconName: string) => {
    const IconComponent = IconMap[iconName as keyof typeof IconMap] || ArrowUpRight;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusIcon = (status: 'success' | 'failed' | 'pending') => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: 'success' | 'failed' | 'pending') => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'pending': return 'text-orange-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Loading state for non-connected users
  if (!isConnected) {
    return (
      <motion.div
        className="space-y-6 animate-section-breathing-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass-enhanced-breathing p-6">
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-300">
              Connect your wallet to view your transaction history
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error && transactions.length === 0) {
    return (
      <motion.div
        className="space-y-6 animate-section-breathing-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass-enhanced-breathing p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Failed to Load Transactions</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={refreshTransactions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border border-red-500/30';
    }
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <motion.div
      className="space-y-6 animate-section-breathing-subtle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="glass-enhanced-breathing p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
            <p className="text-gray-300">Track all your ecosystem transactions</p>
          </div>
          <motion.button
            className="glass-btn-primary group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </motion.button>
        </div>

        {/* Search and Filters */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by hash, token, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="glass-input w-full"
            >
              <option value="all">All Types</option>
              <option value="send">Send</option>
              <option value="receive">Receive</option>
              <option value="swap">Swap</option>
              <option value="stake">Stake</option>
              <option value="unstake">Unstake</option>
              <option value="vote">Vote</option>
              <option value="burn">Burn</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="glass-input w-full"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Transactions', 
            value: transactions.length.toString(), 
            change: '+12 today',
            color: 'blue' 
          },
          { 
            title: 'Completed', 
            value: transactions.filter(tx => tx.status === 'completed').length.toString(), 
            change: '98% success rate',
            color: 'green' 
          },
          { 
            title: 'Pending', 
            value: transactions.filter(tx => tx.status === 'pending').length.toString(), 
            change: 'Avg 2 min',
            color: 'orange' 
          },
          { 
            title: 'Total Volume', 
            value: '$24,567', 
            change: '+15.3% this week',
            color: 'purple' 
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            className="glass-card-breathing group relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-500/20' :
                stat.color === 'green' ? 'bg-green-500/20' :
                stat.color === 'orange' ? 'bg-orange-500/20' :
                'bg-purple-500/20'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'green' ? 'text-green-400' :
                  stat.color === 'orange' ? 'text-orange-400' :
                  'text-purple-400'
                }`} />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm mb-2">{stat.title}</p>
            <p className="text-xs text-gray-500">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Transaction List */}
      <div className="glass-enhanced-breathing">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="glass-input !py-1 !px-2 text-sm"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-700">
          {filteredTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(tx.type)}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(tx.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(tx.status)}
                        <span>{tx.status}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold capitalize">{tx.type}</p>
                      <span className="text-gray-400">•</span>
                      <p className="text-blue-400 font-mono text-sm">{formatHash(tx.hash)}</p>
                      <motion.button
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ scale: 1.1 }}
                        onClick={() => window.open(`https://bscscan.com/tx/${tx.hash}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 text-gray-400 hover:text-white" />
                      </motion.button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(tx.timestamp)}</span>
                      </div>
                      
                      {(tx.to || tx.from) && (
                        <div>
                          <span>
                            {tx.type === 'send' ? 'To:' : 
                             tx.type === 'receive' ? 'From:' : 
                             tx.type === 'stake' ? 'To:' : ''}
                          </span>
                          <span className="font-mono ml-1">
                            {tx.to || tx.from}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${
                      tx.type === 'receive' ? 'text-green-400' :
                      tx.type === 'send' ? 'text-red-400' :
                      'text-white'
                    }`}>
                      {tx.type === 'receive' ? '+' : 
                       tx.type === 'send' ? '-' : ''}
                      {tx.amount} {tx.token}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    {tx.value > 0 && (
                      <div>≈ ${tx.value.toLocaleString()}</div>
                    )}
                    <div>Fee: {tx.fee} BNB</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">No transactions found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TxHistory; 