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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [dataSource, setDataSource] = useState<'bscscan' | 'rpc' | 'hybrid'>('hybrid');
  const [searchMode, setSearchMode] = useState<'ecosystem' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalTransactionsLoaded, setTotalTransactionsLoaded] = useState(0);
  
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
      fetchRecentTransactions(false);
    }
  }, [account]);

  const loadStoredTransactions = () => {
    try {
      const stored = localStorage.getItem(`transactions_${account}`);
      if (stored) {
        const storedTxs = JSON.parse(stored);
        setTransactions(storedTxs);
        if (storedTxs.length > 0) {
          setInitialLoading(false);
        }
      }
    } catch (error) {
      log.error('Failed to load stored transactions', {
        component: 'TransactionHistory',
        function: 'loadStoredTransactions',
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
        function: 'saveTransactions',
        address: account,
        transactionCount: txs.length
      }, error as Error);
    }
  };

  // Fetch transactions using BSCScan API (primary method)
  const fetchTransactionsFromBSCScan = async (page = 1, append = false): Promise<{transactions: Transaction[], hasMore: boolean}> => {
    if (!account) return { transactions: [], hasMore: false };
    
    log.info('Fetching transactions from BSCScan API', {
      component: 'TransactionHistory',
      function: 'fetchTransactionsFromBSCScan',
      address: account,
      page,
      append,
      searchMode
    });
    
    try {
      // Use different search strategies based on mode
      if (searchMode === 'all') {
        // Get ALL user transactions and filter client-side
        const { normalTxs, tokenTxs, hasMore } = await BSCScanAPI.getAllUserTransactions(
          account,
          page,
          200
        );
        
        log.info('Raw BSCScan API response (ALL mode)', {
          component: 'TransactionHistory',
          function: 'fetchTransactionsFromBSCScan',
          normalTxsCount: normalTxs.length,
          tokenTxsCount: tokenTxs.length,
          normalTxsSample: normalTxs.slice(0, 3),
          tokenTxsSample: tokenTxs.slice(0, 3)
        });
        
        const allTransactions: Transaction[] = [];
        
        // Process ALL normal transactions
        let normalTxsProcessed = 0;
        for (const tx of normalTxs) {
          if (tx.to && tx.value !== '0') {
            allTransactions.push(convertBSCScanToTransaction(tx, 'normal'));
            normalTxsProcessed++;
          }
        }
        
        // Process ALL token transfers
        let tokenTxsProcessed = 0;
        for (const tx of tokenTxs) {
          const converted = convertBSCScanToTransaction(tx, 'token');
          
          // Determine transaction type based on contract interaction
          if (tx.to.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
            converted.type = 'lock_lp';
          } else if (tx.to.toLowerCase() === CONTRACTS.PANCAKE_ROUTER.toLowerCase()) {
            converted.type = 'add_liquidity';
          } else if (tx.to.toLowerCase() === CONTRACTS.PANCAKE_FACTORY.toLowerCase()) {
            converted.type = 'add_liquidity';
          } else if (tx.from.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
            converted.type = 'earn_vg';
          } else if ([CONTRACTS.VG_TOKEN.toLowerCase(), CONTRACTS.VC_TOKEN.toLowerCase(), CONTRACTS.LP_TOKEN.toLowerCase()].includes(tx.contractAddress.toLowerCase())) {
            converted.type = 'transfer';
          } else {
            converted.type = 'transfer';
          }
          
          allTransactions.push(converted);
          tokenTxsProcessed++;
        }
        
        log.info('ALL mode transactions processed', {
          component: 'TransactionHistory',
          function: 'fetchTransactionsFromBSCScan',
          normalTxsProcessed,
          tokenTxsProcessed,
          totalProcessed: allTransactions.length
        });
        
        return { transactions: allTransactions, hasMore };
      }
      
      // Original ecosystem-only search
      const contractAddresses = [
        CONTRACTS.LP_LOCKER,
        CONTRACTS.VG_TOKEN,
        CONTRACTS.VC_TOKEN,
        CONTRACTS.LP_TOKEN
      ];
      
      log.info('Contract addresses for search', {
        component: 'TransactionHistory',
        function: 'fetchTransactionsFromBSCScan',
        contractAddresses,
        account
      });
      
      const { normalTxs, tokenTxs, eventLogs, hasMore } = await BSCScanAPI.getAllTransactions(
        account,
        contractAddresses,
        200, // Max 200 transactions per page
        page
      );
      
      log.info('Raw BSCScan API response', {
        component: 'TransactionHistory',
        function: 'fetchTransactionsFromBSCScan',
        normalTxsCount: normalTxs.length,
        tokenTxsCount: tokenTxs.length,
        eventLogsCount: eventLogs.length,
        normalTxsSample: normalTxs.slice(0, 3),
        tokenTxsSample: tokenTxs.slice(0, 3)
      });
      
      const allTransactions: Transaction[] = [];
      
      // Convert normal transactions
      let normalTxsProcessed = 0;
      for (const tx of normalTxs.slice(0, 50)) {
        // Skip contract creation transactions
        if (tx.to && tx.value !== '0') {
          allTransactions.push(convertBSCScanToTransaction(tx, 'normal'));
          normalTxsProcessed++;
        }
      }
      
      log.info('Normal transactions processed', {
        component: 'TransactionHistory',
        function: 'fetchTransactionsFromBSCScan',
        total: normalTxs.length,
        processed: normalTxsProcessed,
        skipped: normalTxs.length - normalTxsProcessed
      });
      
      // Convert token transfers
      let tokenTxsProcessed = 0;
      let tokenTxsFiltered = 0;
      for (const tx of tokenTxs.slice(0, 100)) {
        // Check if transaction involves any of our ecosystem contracts
        const isEcosystemTx = [
          CONTRACTS.VG_TOKEN.toLowerCase(),
          CONTRACTS.VC_TOKEN.toLowerCase(),
          CONTRACTS.LP_TOKEN.toLowerCase(),
          CONTRACTS.LP_LOCKER.toLowerCase(),
          CONTRACTS.PANCAKE_ROUTER.toLowerCase(),
          CONTRACTS.PANCAKE_FACTORY.toLowerCase()
        ].includes(tx.contractAddress.toLowerCase()) ||
        [
          CONTRACTS.VG_TOKEN.toLowerCase(),
          CONTRACTS.VC_TOKEN.toLowerCase(),
          CONTRACTS.LP_TOKEN.toLowerCase(),
          CONTRACTS.LP_LOCKER.toLowerCase(),
          CONTRACTS.PANCAKE_ROUTER.toLowerCase()
        ].includes(tx.to.toLowerCase()) ||
        [
          CONTRACTS.VG_TOKEN.toLowerCase(),
          CONTRACTS.VC_TOKEN.toLowerCase(),
          CONTRACTS.LP_TOKEN.toLowerCase(),
          CONTRACTS.LP_LOCKER.toLowerCase(),
          CONTRACTS.PANCAKE_ROUTER.toLowerCase()
        ].includes(tx.from.toLowerCase());
        
        if (!isEcosystemTx) {
          tokenTxsFiltered++;
          log.debug('Token transaction filtered out', {
            component: 'TransactionHistory',
            function: 'fetchTransactionsFromBSCScan',
            contractAddress: tx.contractAddress,
            tokenSymbol: tx.tokenSymbol,
            to: tx.to,
            from: tx.from,
            hash: tx.hash
          });
          continue;
        }
        
        const converted = convertBSCScanToTransaction(tx, 'token');
        
        // Determine transaction type based on contract interaction
        if (tx.to.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
          converted.type = 'lock_lp';
        } else if (tx.to.toLowerCase() === CONTRACTS.VG_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.to.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.to.toLowerCase() === CONTRACTS.LP_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.to.toLowerCase() === CONTRACTS.PANCAKE_ROUTER.toLowerCase()) {
          converted.type = 'add_liquidity';
        } else if (tx.to.toLowerCase() === CONTRACTS.PANCAKE_FACTORY.toLowerCase()) {
          converted.type = 'add_liquidity';
        } else if (tx.from.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
          converted.type = 'earn_vg';
        } else if (tx.from.toLowerCase() === CONTRACTS.VG_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.from.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.from.toLowerCase() === CONTRACTS.LP_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.contractAddress.toLowerCase() === CONTRACTS.VG_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.contractAddress.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else if (tx.contractAddress.toLowerCase() === CONTRACTS.LP_TOKEN.toLowerCase()) {
          converted.type = 'transfer';
        } else {
          converted.type = 'transfer';
        }
        
        allTransactions.push(converted);
        tokenTxsProcessed++;
      }
      
      log.info('Token transactions processed', {
        component: 'TransactionHistory',
        function: 'fetchTransactionsFromBSCScan',
        total: tokenTxs.length,
        processed: tokenTxsProcessed,
        filtered: tokenTxsFiltered,
        ourTokens: [CONTRACTS.VG_TOKEN, CONTRACTS.VC_TOKEN, CONTRACTS.LP_TOKEN]
      });
      
      // Convert event logs
      let eventLogsProcessed = 0;
      for (const log of eventLogs.slice(0, 50)) {
        const converted = convertBSCScanToTransaction(log, 'event');
        
        // Determine event type based on contract and topic
        if (log.address.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
          if (log.topics[0] === '0x30055ed7adb0b12d89a788d6382669f76b428bc35501622086ef69df37df8cd5') {
            converted.type = 'earn_vg';
            converted.value = 'VG Tokens Earned';
          } else {
            converted.type = 'governance';
            converted.value = 'Contract Event';
          }
        }
        
        allTransactions.push(converted);
        eventLogsProcessed++;
      }
      
      log.info('Event logs processed', {
        component: 'TransactionHistory',
        function: 'fetchTransactionsFromBSCScan',
        total: eventLogs.length,
        processed: eventLogsProcessed
      });
      
      log.info('BSCScan transactions fetched', {
        component: 'TransactionHistory',
        function: 'fetchTransactionsFromBSCScan',
        address: account,
        transactionCount: allTransactions.length,
        breakdown: {
          normalTxs: normalTxsProcessed,
          tokenTxs: tokenTxsProcessed,
          eventLogs: eventLogsProcessed
        },
        page,
        hasMore
      });
      return { transactions: allTransactions, hasMore };
      
    } catch (error) {
      log.warn('BSCScan API failed', {
        component: 'TransactionHistory',
        function: 'fetchTransactionsFromBSCScan',
        address: account,
        page
      }, error as Error);
      return { transactions: [], hasMore: false };
    }
  };

  // Parse known transactions by hash (backup method)
  const parseKnownTransactions = async (rpcProvider: ethers.JsonRpcProvider): Promise<Transaction[]> => {
    const transactions: Transaction[] = [];
    
    // Known transaction hashes from our project
    const knownTxHashes = [
      '0x6a4fb273dc00092cd3b75409d250b7db1edd4f3041fd21d6f52bd495d26503fe', // earnVG fix
      '0xb314f4c07555c6e6158d9921778b989cf9388f4cf1a88b67bbfe95b1635cfb7d', // MEV disable
      '0xf7850a9ea2150d88402a7f2fe643be17251a3faed4a8b1a081311ee71da982ce', // Add liquidity
      '0x05efba57c502b405ad59fb2a64d32f919f973a536253774561715e387c4faf95'  // Create pair
    ];
    
    log.info('Checking known transaction hashes', {
      component: 'TransactionHistory',
      function: 'parseKnownTransactions',
      address: account,
      knownTxCount: knownTxHashes.length
    });
    
    for (const txHash of knownTxHashes) {
      try {
        const receipt = await rpcProvider.getTransactionReceipt(txHash);
        if (receipt && receipt.from.toLowerCase() === account!.toLowerCase()) {
          log.info('Found known transaction', {
            component: 'TransactionHistory',
            function: 'parseKnownTransactions',
            txHash,
            address: account
          });
          
          const block = await rpcProvider.getBlock(receipt.blockNumber);
          
          // Determine transaction type based on contract interaction
          let type: Transaction['type'] = 'governance';
          let value = 'Contract Interaction';
          
          if (receipt.to?.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
            // Check logs for specific events
            const hasEarnVGEvent = receipt.logs.some(log => 
              log.topics[0] === '0x30055ed7adb0b12d89a788d6382669f76b428bc35501622086ef69df37df8cd5'
            );
            
            if (hasEarnVGEvent) {
              type = 'earn_vg';
              value = 'VG Tokens Earned';
            } else {
              type = 'governance';
              value = 'LPLocker Configuration';
            }
          } else if (receipt.to?.toLowerCase() === '0x9ac64cc6e4415144c455bd8e4837fea55603e5c3') {
            type = 'add_liquidity';
            value = 'Add Liquidity to Pool';
          } else if (receipt.to?.toLowerCase() === '0x6725f303b657a9451d8ba641348b6761a6cc7a17') {
            type = 'add_liquidity';
            value = 'Create LP Pair';
          }
          
          transactions.push({
            id: `known-${txHash}`,
            hash: txHash,
            type,
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            timestamp: block ? block.timestamp * 1000 : Date.now(),
            blockNumber: receipt.blockNumber,
            from: receipt.from,
            to: receipt.to || '',
            value,
            gasUsed: receipt.gasUsed.toString()
          });
        }
      } catch (error) {
        log.warn('Failed to check known transaction', {
          component: 'TransactionHistory',
          function: 'parseKnownTransactions',
          txHash,
          address: account
        }, error as Error);
      }
    }
    
    log.info('Known transactions found', {
      component: 'TransactionHistory',
      function: 'parseKnownTransactions',
      address: account,
      foundCount: transactions.length
    });
    return transactions;
  };

  const fetchRecentTransactions = useCallback(async (isRefresh = false, loadMore = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const now = Date.now();
    if (!isRefresh && !loadMore && now - lastFetchTime < 10000) {
      log.debug('Skipping fetch - cached data is fresh', {
        component: 'TransactionHistory',
        function: 'fetchRecentTransactions',
        address: account
      });
      return;
    }
    
    if (!account) {
      log.debug('Skipping fetch - no account', {
        component: 'TransactionHistory',
        function: 'fetchRecentTransactions'
      });
      return;
    }
    
    const pageToFetch = loadMore ? currentPage + 1 : 1;
    
    log.info('Starting transaction fetch', {
      component: 'TransactionHistory',
      function: 'fetchRecentTransactions',
      address: account,
      isRefresh,
      loadMore,
      pageToFetch
    });
    
    if (transactions.length === 0 && !loadMore) {
      setInitialLoading(true);
    } else if (loadMore) {
      setLoadingMore(true);
    } else {
      setRefreshing(true);
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let allTransactions: Transaction[] = loadMore ? [...transactions] : [];
      let hasMoreData = false;
      
      // Primary: Try BSCScan API first
      if (dataSource === 'bscscan' || dataSource === 'hybrid') {
        log.info('Fetching from BSCScan API', {
          component: 'TransactionHistory',
          function: 'fetchRecentTransactions',
          address: account,
          pageToFetch
        });
        const { transactions: bscscanTxs, hasMore } = await fetchTransactionsFromBSCScan(pageToFetch, loadMore);
        
        if (loadMore) {
          // Remove duplicates when loading more
          const newTxs = bscscanTxs.filter(newTx => 
            !allTransactions.some(existingTx => existingTx.hash === newTx.hash)
          );
          allTransactions.push(...newTxs);
        } else {
          allTransactions.push(...bscscanTxs);
        }
        
        hasMoreData = hasMore;
        log.info('BSCScan provided transactions', {
          component: 'TransactionHistory',
          function: 'fetchRecentTransactions',
          address: account,
          count: bscscanTxs.length,
          hasMore: hasMoreData
        });
      }
      
      // Fallback: Try RPC for known transactions if BSCScan didn't provide enough
      if ((dataSource === 'rpc' || dataSource === 'hybrid') && allTransactions.length < 5 && !loadMore) {
        log.info('Fetching known transactions via RPC', {
          component: 'TransactionHistory',
          function: 'fetchRecentTransactions',
          address: account
        });
        const knownTxs = await rpcService.withFallback(parseKnownTransactions);
        
        // Add known transactions that aren't already in the list
        for (const knownTx of knownTxs) {
          if (!allTransactions.some(tx => tx.hash === knownTx.hash)) {
            allTransactions.push(knownTx);
          }
        }
        log.info('RPC provided additional transactions', {
          component: 'TransactionHistory',
          function: 'fetchRecentTransactions',
          address: account,
          count: knownTxs.length
        });
      }
      
      log.debug('Total transactions before deduplication', {
        component: 'TransactionHistory',
        function: 'fetchRecentTransactions',
        address: account,
        count: allTransactions.length
      });
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      // Remove duplicates and limit to reasonable amount
      const uniqueTransactions = allTransactions
        .filter((tx, index, self) => index === self.findIndex(t => t.hash === tx.hash))
        .slice(0, 1000); // Увеличиваем лимит до 1000 транзакций
      
      log.info('Final unique transactions', {
        component: 'TransactionHistory',
        function: 'fetchRecentTransactions',
        address: account,
        finalCount: uniqueTransactions.length,
        hasMoreData
      });
      
      if (isMountedRef.current && !signal.aborted) {
        setTransactions(uniqueTransactions);
        saveTransactions(uniqueTransactions);
        setLastFetchTime(now);
        setHasMoreTransactions(hasMoreData);
        setTotalTransactionsLoaded(uniqueTransactions.length);
        
        if (loadMore) {
          setCurrentPage(pageToFetch);
        } else {
          setCurrentPage(1);
        }
        
        log.info('Transactions updated successfully', {
          component: 'TransactionHistory',
          function: 'fetchRecentTransactions',
          address: account,
          count: uniqueTransactions.length,
          currentPage: loadMore ? pageToFetch : 1,
          hasMore: hasMoreData
        });
        
        if (uniqueTransactions.length === 0) {
          log.info('No transactions found - account may not have interacted with contracts yet', {
            component: 'TransactionHistory',
            function: 'fetchRecentTransactions',
            address: account
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        log.debug('Transaction fetch aborted', {
          component: 'TransactionHistory',
          function: 'fetchRecentTransactions',
          address: account
        });
        return;
      }
      log.error('Failed to fetch transactions', {
        component: 'TransactionHistory',
        function: 'fetchRecentTransactions',
        address: account,
        pageToFetch
      }, error);
      
      // If no cached transactions, show empty state
      if (transactions.length === 0 && !loadMore) {
        setTransactions([]);
      }
    } finally {
      if (isMountedRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setLastFetchTime(Date.now());
      }
    }
  }, [account, transactions.length, lastFetchTime, dataSource, currentPage]);

  // Load more transactions
  const loadMoreTransactions = () => {
    if (!loadingMore && hasMoreTransactions) {
      fetchRecentTransactions(false, true);
    }
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
      case 'lock_lp':
        return <TrendingUp className="text-orange-400" size={16} />;
      case 'earn_vg':
        return <Zap className="text-green-400" size={16} />;
      case 'transfer':
        return <ArrowUpRight className="text-blue-400" size={16} />;
      case 'deposit_vg':
        return <ArrowUpRight className="text-purple-400" size={16} />;
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
      case 'lock_lp':
        return 'Заблокировать LP';
      case 'earn_vg':
        return 'Заработать VG';
      case 'transfer':
        return 'Перевод';
      case 'deposit_vg':
        return 'Депозит VG';
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
        <div className="flex items-center space-x-4">
        <h3 className="text-xl font-semibold text-slate-100">История транзакций</h3>
          <div className="text-sm text-gray-400">
            {totalTransactionsLoaded > 0 && (
              <span>Загружено: {totalTransactionsLoaded} транзакций</span>
            )}
          </div>
          {refreshing && (
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm">{t('common:labels.refreshing')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as 'ecosystem' | 'all')}
            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs"
          >
            <option value="all">🔍 Все транзакции</option>
            <option value="ecosystem">🏗️ Только экосистема</option>
          </select>
          <select
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value as 'bscscan' | 'rpc' | 'hybrid')}
            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs"
          >
            <option value="hybrid">🔄 Hybrid</option>
            <option value="bscscan">🌐 BSCScan</option>
            <option value="rpc">⚡ RPC</option>
          </select>
        <button
            onClick={() => fetchRecentTransactions(true)}
          className="btn-secondary p-2"
            disabled={refreshing}
        >
            <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
        </button>
        </div>
      </div>

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
            <option value="lock_lp">Заблокировать LP</option>
            <option value="earn_vg">Заработать VG</option>
            <option value="transfer">Перевод</option>
            <option value="deposit_vg">Депозит VG</option>
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

      {initialLoading && transactions.length === 0 ? (
        <TableSkeleton rows={5} />
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <Clock className="mx-auto mb-4" size={48} />
          {transactions.length === 0 ? (
            <>
              <h4 className="text-lg font-semibold mb-2 text-gray-300">Транзакций пока нет</h4>
              <p className="mb-4">Ваш аккаунт ещё не совершал транзакций в нашей экосистеме</p>
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
              className="btn-secondary mt-4"
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
              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(tx.type)}
                  {getStatusIcon(tx.status)}
                </div>
                
                <div>
                  <div className="font-semibold text-slate-100">{getTypeLabel(tx.type)}</div>
                  <div className="text-sm text-gray-400">
                    {tx.value || (tx.amount && tx.token && `${tx.amount} ${tx.token}`)}
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
          
          {/* Load More Button */}
          {hasMoreTransactions && filteredTransactions.length > 0 && (
            <div className="text-center pt-6">
              <button
                onClick={loadMoreTransactions}
                disabled={loadingMore}
                className="btn-secondary flex items-center space-x-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Загружаем...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Загрузить еще транзакции</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
        function: 'addTransaction',
        address: account,
        txId: newTx.id,
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
        function: 'updateTransactionStatus',
        address: account,
        txHash: hash,
        status
      }, error as Error);
    }
  };

  return { addTransaction, updateTransactionStatus };
};

export default TransactionHistory; 