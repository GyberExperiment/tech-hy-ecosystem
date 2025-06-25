import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';

interface Transaction {
  id: string;
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'vote' | 'burn';
  status: 'completed' | 'pending' | 'failed';
  amount: string;
  token: string;
  to?: string;
  from?: string;
  timestamp: string;
  fee: string;
  value: number;
}

const TxHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | Transaction['type']>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Transaction['status']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');

  const transactions: Transaction[] = [
    {
      id: 'tx-001',
      hash: '0xa7b2c9d4e8f1a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8',
      type: 'receive',
      status: 'completed',
      amount: '2,500.00',
      token: 'VC',
      from: '0x742d...A5E9',
      timestamp: '2025-01-15T14:30:00Z',
      fee: '0.002',
      value: 4750
    },
    {
      id: 'tx-002',
      hash: '0xb8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1',
      type: 'swap',
      status: 'completed',
      amount: '1,000.00',
      token: 'VC → VG',
      timestamp: '2025-01-15T12:15:00Z',
      fee: '0.001',
      value: 1900
    },
    {
      id: 'tx-003',
      hash: '0xc9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2',
      type: 'stake',
      status: 'completed',
      amount: '5,000.00',
      token: 'VC',
      to: 'LP Pool',
      timestamp: '2025-01-14T18:45:00Z',
      fee: '0.003',
      value: 9500
    },
    {
      id: 'tx-004',
      hash: '0xd0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3',
      type: 'burn',
      status: 'pending',
      amount: '100.00',
      token: 'VC',
      timestamp: '2025-01-15T16:00:00Z',
      fee: '0.001',
      value: 190
    },
    {
      id: 'tx-005',
      hash: '0xe1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4',
      type: 'vote',
      status: 'failed',
      amount: '0',
      token: 'VC',
      timestamp: '2025-01-13T09:30:00Z',
      fee: '0.001',
      value: 0
    },
    {
      id: 'tx-006',
      hash: '0xf2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5',
      type: 'send',
      status: 'completed',
      amount: '500.00',
      token: 'VG',
      to: '0x8F3A...B2C7',
      timestamp: '2025-01-12T20:15:00Z',
      fee: '0.002',
      value: 3500
    }
  ];

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tx.to && tx.to.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (tx.from && tx.from.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'amount':
        return b.value - a.value;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'receive': return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'swap': return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'stake': return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case 'unstake': return <ArrowDownLeft className="w-4 h-4 text-orange-400" />;
      case 'vote': return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      case 'burn': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
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