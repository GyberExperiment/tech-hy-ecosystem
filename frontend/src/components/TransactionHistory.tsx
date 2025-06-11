import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { TableSkeleton } from './LoadingSkeleton';

interface Transaction {
  id: string;
  hash: string;
  type: 'stake' | 'unstake' | 'add_liquidity' | 'remove_liquidity' | 'approve' | 'governance';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  amount?: string;
  token?: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  value?: string;
}

const TransactionHistory: React.FC = () => {
  const { account, provider } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load transactions from localStorage and fetch new ones
  useEffect(() => {
    if (account) {
      loadStoredTransactions();
      fetchRecentTransactions();
    }
  }, [account]);

  const loadStoredTransactions = () => {
    try {
      const stored = localStorage.getItem(`transactions_${account}`);
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading stored transactions:', error);
    }
  };

  const saveTransactions = (txs: Transaction[]) => {
    try {
      localStorage.setItem(`transactions_${account}`, JSON.stringify(txs));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    if (!account || !provider) return;
    
    setLoading(true);
    try {
      // This is a simplified version - in production you'd use a subgraph or event logs
      // Here we simulate fetching recent transactions
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          hash: '0x1234...5678',
          type: 'stake',
          status: 'confirmed',
          timestamp: Date.now() - 300000,
          amount: '1000',
          token: 'VC',
          gasUsed: '0.002',
          blockNumber: 12345678,
        },
        {
          id: '2',
          hash: '0xabcd...efgh',
          type: 'add_liquidity',
          status: 'confirmed',
          timestamp: Date.now() - 600000,
          amount: '500',
          token: 'VC/BNB LP',
          gasUsed: '0.004',
          blockNumber: 12345677,
        }
      ];
      
      setTransactions(prev => {
        const combined = [...mockTransactions, ...prev];
        const unique = combined.filter((tx, index, self) => 
          index === self.findIndex(t => t.hash === tx.hash)
        );
        saveTransactions(unique);
        return unique;
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const updateTransactionStatus = (hash: string, status: Transaction['status'], blockNumber?: number) => {
    const updated = transactions.map(tx => 
      tx.hash === hash ? { ...tx, status, blockNumber } : tx
    );
    setTransactions(updated);
    saveTransactions(updated);
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'stake':
        return <ArrowUpRight className="text-green-400" size={16} />;
      case 'unstake':
        return <ArrowDownRight className="text-red-400" size={16} />;
      case 'add_liquidity':
        return <TrendingUp className="text-blue-400" size={16} />;
      case 'remove_liquidity':
        return <TrendingDown className="text-orange-400" size={16} />;
      case 'approve':
        return <CheckCircle className="text-gray-400" size={16} />;
      case 'governance':
        return <Zap className="text-purple-400" size={16} />;
      default:
        return <RefreshCw className="text-gray-400" size={16} />;
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'stake':
        return 'Стейкинг';
      case 'unstake':
        return 'Анстейкинг';
      case 'add_liquidity':
        return 'Добавить ликвидность';
      case 'remove_liquidity':
        return 'Убрать ликвидность';
      case 'approve':
        return 'Одобрение';
      case 'governance':
        return 'Голосование';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-400 animate-pulse" size={16} />;
      case 'confirmed':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'failed':
        return <XCircle className="text-red-400" size={16} />;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getTypeLabel(tx.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}д назад`;
    if (hours > 0) return `${hours}ч назад`;
    if (minutes > 0) return `${minutes}м назад`;
    return 'только что';
  };

  if (!account) {
    return (
      <div className="card text-center text-gray-400">
        <Clock className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">История транзакций</h3>
        <p>Подключите кошелёк для просмотра истории транзакций</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">История транзакций</h3>
        <button
          onClick={fetchRecentTransactions}
          className="btn-secondary p-2"
          disabled={loading}
        >
          <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Все транзакции</option>
            <option value="stake">Стейкинг</option>
            <option value="add_liquidity">Ликвидность</option>
            <option value="governance">Голосование</option>
            <option value="approve">Одобрения</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2 flex-1">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по хешу или типу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm flex-1"
          />
        </div>
      </div>

      {/* Transactions List */}
      {loading && transactions.length === 0 ? (
        <TableSkeleton rows={5} />
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <Clock className="mx-auto mb-4" size={48} />
          <p>Транзакций не найдено</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn-secondary mt-4"
            >
              Очистить поиск
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(tx.type)}
                  {getStatusIcon(tx.status)}
                </div>
                
                <div>
                  <div className="font-semibold">{getTypeLabel(tx.type)}</div>
                  <div className="text-sm text-gray-400">
                    {tx.amount && tx.token && `${tx.amount} ${tx.token}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(tx.timestamp)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-slate-700 px-2 py-1 rounded">
                    {tx.hash.slice(0, 10)}...
                  </code>
                  <a
                    href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                {tx.gasUsed && (
                  <div className="text-xs text-gray-500 mt-1">
                    Gas: {tx.gasUsed} BNB
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export the transaction management functions for use in other components
export const useTransactionHistory = () => {
  const { account } = useWeb3();
  
  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!account) return;
    
    const newTx: Transaction = {
      ...tx,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    try {
      const stored = localStorage.getItem(`transactions_${account}`);
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [newTx, ...existing];
      localStorage.setItem(`transactions_${account}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const updateTransactionStatus = (hash: string, status: Transaction['status']) => {
    if (!account) return;
    
    try {
      const stored = localStorage.getItem(`transactions_${account}`);
      if (stored) {
        const transactions = JSON.parse(stored);
        const updated = transactions.map((tx: Transaction) => 
          tx.hash === hash ? { ...tx, status } : tx
        );
        localStorage.setItem(`transactions_${account}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  return { addTransaction, updateTransactionStatus };
};

export default TransactionHistory; 