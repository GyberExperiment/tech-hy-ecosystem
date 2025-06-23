import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Zap,
  Loader2
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { TableSkeleton } from './LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { CONTRACTS } from '../constants/contracts';
import { BSCScanAPI, convertBSCScanToTransaction } from '../utils/bscscanApi';
import { formatTimeAgo, formatTxHash, formatTokenAmount } from '../utils/formatters';
import { log } from '../utils/logger';
import { rpcService } from '../services/rpcService';

interface Transaction {
  id: string;
  hash: string;
  type: 'stake' | 'unstake' | 'add_liquidity' | 'remove_liquidity' | 'approve' | 'governance' | 'lock_lp' | 'earn_vg' | 'transfer' | 'deposit_vg';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  amount?: string;
  token?: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  value?: string;
  from?: string;
  to?: string;
}

const TransactionHistory: React.FC = () => {
  const { t } = useTranslation(['common']);
  const { account } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (account) {
      loadStoredTransactions();
      fetchTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [account]);

  const loadStoredTransactions = () => {
    try {
      const stored = localStorage.getItem(`transactions_${account}`);
      if (stored) {
        const storedTxs = JSON.parse(stored);
        if (Array.isArray(storedTxs) && storedTxs.length > 0) {
        setTransactions(storedTxs);
          setLoading(false);
          log.info('Loaded cached transactions', {
            component: 'TransactionHistory',
            count: storedTxs.length,
            address: account
          });
        }
      }
    } catch (error) {
      log.error('Failed to load stored transactions', {
        component: 'TransactionHistory',
        address: account
      }, error as Error);
    }
  };

  const saveTransactions = (txs: Transaction[]) => {
    try {
      localStorage.setItem(`transactions_${account}`, JSON.stringify(txs));
    } catch (error) {
      log.error('Failed to save transactions', {
        component: 'TransactionHistory',
        address: account,
        count: txs.length
      }, error as Error);
    }
  };

  const fetchTransactions = useCallback(async (isRefresh = false, loadMore = false) => {
    if (!account) return;
    
    if (loading && !isRefresh && !loadMore) {
      log.debug('TransactionHistory: Skipping fetch - already loading', {
        component: 'TransactionHistory',
        address: account
      });
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const pageToFetch = loadMore ? currentPage + 1 : 1;
    
    log.info('Fetching transactions', {
      component: 'TransactionHistory',
      address: account,
      isRefresh,
      loadMore,
      page: pageToFetch
    });
    
    if (isRefresh) {
      setRefreshing(true);
    } else if (loadMore) {
      setLoadingMore(true);
          } else {
      setLoading(true);
    }
    
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      // Simplified: Get ALL user transactions from BSCScan
      const { normalTxs, tokenTxs, hasMore: moreAvailable } = await BSCScanAPI.getAllUserTransactions(
        account,
        pageToFetch,
        50 // Reasonable page size
      );
      
      console.log('🔍 DEBUG: Raw BSCScan data:', {
        normalTxsCount: normalTxs.length,
        tokenTxsCount: tokenTxs.length,
        normalTxsSample: normalTxs.slice(0, 2),
        tokenTxsSample: tokenTxs.slice(0, 2)
      });
      
      const allTransactions: Transaction[] = [];
      
      // Process normal transactions (BNB transfers)
      for (const tx of normalTxs) {
        if (tx.to && tx.value !== '0') {
          const converted = convertBSCScanToTransaction(tx, 'normal');
          console.log('🔍 DEBUG: Normal tx converted:', converted);
          allTransactions.push(converted);
        }
      }
      
      // Process token transfers
      for (const tx of tokenTxs) {
        const converted = convertBSCScanToTransaction(tx, 'token');
        
        // Enhanced type detection based on contract addresses
        if (tx.to.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
          converted.type = 'lock_lp';
        } else if (tx.from.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
          converted.type = 'earn_vg';
        } else if ([
          CONTRACTS.VG_TOKEN.toLowerCase(),
          CONTRACTS.VC_TOKEN.toLowerCase(),
          CONTRACTS.LP_TOKEN.toLowerCase()
        ].includes(tx.contractAddress.toLowerCase())) {
          converted.type = 'transfer';
        } else if (tx.to.toLowerCase() === CONTRACTS.PANCAKE_ROUTER.toLowerCase()) {
          converted.type = 'add_liquidity';
        } else {
          converted.type = 'transfer';
        }
        
        console.log('🔍 DEBUG: Token tx converted:', converted);
        allTransactions.push(converted);
      }
      
      console.log('🔍 DEBUG: All transactions before sort:', allTransactions.length);
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      let finalTransactions: Transaction[];
      
      if (loadMore) {
        // Append new transactions, avoiding duplicates
        const existingHashes = new Set(transactions.map(tx => tx.hash));
        const newTxs = allTransactions.filter(tx => !existingHashes.has(tx.hash));
        finalTransactions = [...transactions, ...newTxs];
      } else {
        finalTransactions = allTransactions;
      }
      
      // Remove duplicates and limit
      const uniqueTransactions = finalTransactions
        .filter((tx, index, self) => index === self.findIndex(t => t.hash === tx.hash))
        .slice(0, 500); // Reasonable limit
      
      console.log('🔍 DEBUG: Final unique transactions:', {
        count: uniqueTransactions.length,
        sample: uniqueTransactions.slice(0, 2)
      });
      
      if (isMountedRef.current) {
        setTransactions(uniqueTransactions);
        saveTransactions(uniqueTransactions);
        setHasMore(moreAvailable);
          setCurrentPage(pageToFetch);
        
        log.info('Transactions updated', {
          component: 'TransactionHistory',
          address: account,
          count: uniqueTransactions.length,
          page: pageToFetch,
          hasMore: moreAvailable
        });
        
        console.log('🔍 DEBUG: State updated with transactions:', uniqueTransactions.length);
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error('🔍 DEBUG: Transaction fetch error:', error);
      
      log.error('Failed to fetch transactions', {
        component: 'TransactionHistory',
        address: account,
        page: pageToFetch
      }, error);
      
      // More specific error messages
      if (error.message.includes('API Key')) {
        setError('Для загрузки истории транзакций требуется API ключ BSCScan. Пожалуйста, добавьте API ключ в настройки.');
      } else if (error.message.includes('rate limit')) {
        setError('Превышен лимит запросов к BSCScan API. Попробуйте позже.');
      } else {
        setError('Не удалось загрузить транзакции. Проверьте подключение к интернету.');
      }
      
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [account, currentPage, transactions]);

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchTransactions(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(false, true);
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    const iconMap = {
      stake: <ArrowUpRight className="text-green-400" size={16} />,
      unstake: <ArrowDownRight className="text-red-400" size={16} />,
      add_liquidity: <TrendingUp className="text-blue-400" size={16} />,
      remove_liquidity: <TrendingDown className="text-orange-400" size={16} />,
      approve: <CheckCircle className="text-gray-400" size={16} />,
      governance: <Zap className="text-purple-400" size={16} />,
      lock_lp: <TrendingUp className="text-orange-400" size={16} />,
      earn_vg: <Zap className="text-green-400" size={16} />,
      transfer: <ArrowUpRight className="text-blue-400" size={16} />,
      deposit_vg: <ArrowUpRight className="text-purple-400" size={16} />
    };
    return iconMap[type] || <RefreshCw className="text-gray-400" size={16} />;
  };

  const getTypeLabel = (type: Transaction['type']) => {
    const labelMap = {
      stake: 'Стейкинг',
      unstake: 'Анстейкинг',
      add_liquidity: 'Добавить ликвидность',
      remove_liquidity: 'Убрать ликвидность',
      approve: 'Одобрение',
      governance: 'Голосование',
      lock_lp: 'Заблокировать LP',
      earn_vg: 'Заработать VG',
      transfer: 'Перевод',
      deposit_vg: 'Депозит VG'
    };
    return labelMap[type] || 'Неизвестно';
  };

  const getStatusIcon = (status: Transaction['status']) => {
    const statusMap = {
      pending: <Clock className="text-yellow-400 animate-pulse" size={16} />,
      confirmed: <CheckCircle className="text-green-400" size={16} />,
      failed: <XCircle className="text-red-400" size={16} />
    };
    return statusMap[status];
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getTypeLabel(tx.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // DEBUG: Log component state
  console.log('🔍 DEBUG: Component state:', {
    account,
    transactionsCount: transactions.length,
    filteredCount: filteredTransactions.length,
    loading,
    error,
    filter,
    searchTerm
  });

  if (!account) {
    return (
      <div className="liquid-glass text-center text-gray-400 animate-glass-float">
        <Clock className="mx-auto mb-4 animate-glass-pulse" size={48} />
        <h3 className="text-lg font-semibold mb-2">История транзакций</h3>
        <p>Подключите кошелёк для просмотра истории транзакций</p>
      </div>
    );
  }

  return (
    <div className="liquid-glass animate-glass-float">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
        <h3 className="section-title text-xl font-semibold text-slate-100">История транзакций</h3>
          {transactions.length > 0 && (
          <div className="text-sm text-gray-400 glass-ultra px-2 py-1 rounded-lg">
              Загружено: {transactions.length} транзакций
            </div>
            )}
          {refreshing && (
            <div className="flex items-center space-x-2 text-blue-400 glass-ultra px-2 py-1 rounded-lg animate-glass-pulse">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">Обновление...</span>
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="btn-glass-blue p-2 animate-glass-pulse"
            disabled={refreshing}
        >
            <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Все транзакции</option>
            <option value="transfer">Переводы</option>
            <option value="lock_lp">Заблокировать LP</option>
            <option value="earn_vg">Заработать VG</option>
            <option value="add_liquidity">Ликвидность</option>
            <option value="governance">Голосование</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2 flex-1">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по хешу или типу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field flex-1"
          />
        </div>
      </div>

      {error && (
        <div className="glass-accent border border-red-500/30 rounded-lg p-4 mb-6 animate-glass-pulse">
          <div className="flex items-center space-x-2 text-red-400">
            <XCircle size={16} />
            <span>{error}</span>
          </div>
          {error.includes('API ключ') && (
            <div className="mt-4 p-3 glass-ultra border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300 mb-2">
                💡 <strong>Как получить BSCScan API ключ:</strong>
              </p>
              <ol className="text-xs text-blue-200 space-y-1 ml-4">
                <li>1. Перейдите на <a href="https://bscscan.com/register" target="_blank" rel="noopener noreferrer" className="underline">bscscan.com/register</a></li>
                <li>2. Создайте аккаунт и войдите в систему</li>
                <li>3. Перейдите в раздел "API-Keys" в профиле</li>
                <li>4. Создайте новый API ключ (бесплатно)</li>
                <li>5. Добавьте ключ в файл <code className="glass-ultra px-1 rounded">frontend/src/utils/bscscanApi.ts</code></li>
              </ol>
              <button
                onClick={() => {
                  // Add mock data for demonstration
                  const mockTransactions = [
                    {
                      id: 'mock-1',
                      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                      type: 'transfer' as const,
                      status: 'confirmed' as const,
                      timestamp: Date.now() - 3600000,
                      amount: '100',
                      token: 'VG',
                      value: '100.0000 VG',
                      gasUsed: '21000',
                      from: account,
                      to: '0x742d35Cc6634C0532925a3b8D369D7763F4b2d66'
                    },
                    {
                      id: 'mock-2',
                      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                      type: 'lock_lp' as const,
                      status: 'confirmed' as const,
                      timestamp: Date.now() - 7200000,
                      amount: '50',
                      token: 'LP',
                      value: '50.0000 LP',
                      gasUsed: '45000',
                      from: account,
                      to: CONTRACTS.LP_LOCKER
                    }
                  ];
                  setTransactions(mockTransactions);
                  setError(null);
                }}
                className="mt-3 btn-glass-green text-xs"
              >
                📊 Показать демо-данные
              </button>
            </div>
          )}
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <TableSkeleton rows={5} />
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <Clock className="mx-auto mb-4 animate-glass-pulse" size={48} />
          {transactions.length === 0 ? (
            <>
              <h4 className="text-lg font-semibold mb-2 text-gray-300">Транзакций пока нет</h4>
              <p className="mb-4">Ваш аккаунт ещё не совершал транзакций</p>
              <div className="text-sm text-gray-500 space-y-2">
                <p>💡 Попробуйте:</p>
                <p>• Заработать VG токены через LP Locking</p>
                <p>• Перевести токены другому пользователю</p>
                <p>• Участвовать в голосованиях DAO</p>
              </div>
            </>
          ) : (
            <>
          <p>Транзакций не найдено</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn-glass-blue mt-4"
            >
              Очистить поиск
            </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center justify-between p-4 liquid-glass animate-glass-float hover:glass-accent transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(tx.type)}
                  {getStatusIcon(tx.status)}
                </div>
                
                <div>
                  <div className="font-semibold text-slate-100">{getTypeLabel(tx.type)}</div>
                  <div className="text-sm text-gray-400">
                    {tx.value || (tx.amount && tx.token && `${formatTokenAmount(tx.amount)} ${tx.token}`)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(tx.timestamp)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <code className="text-xs glass-ultra px-2 py-1 rounded">
                    {formatTxHash(tx.hash)}
                  </code>
                  <a
                    href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 glass-ultra rounded p-1 transition-colors duration-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                {tx.gasUsed && (
                  <div className="text-xs text-gray-500 mt-1">
                    Gas: {parseFloat(tx.gasUsed).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-glass-morphic animate-glass-pulse"
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Загрузка...</span>
                  </div>
                ) : (
                  'Загрузить ещё'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;

// Hook for managing transactions
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
      log.error('Error saving transaction', {
        component: 'useTransactionHistory',
        address: account,
        txHash: newTx.hash
      }, error as Error);
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
      log.error('Error updating transaction', {
        component: 'useTransactionHistory',
        address: account,
        txHash: hash,
        status
      }, error as Error);
    }
  };

  return { addTransaction, updateTransactionStatus };
};