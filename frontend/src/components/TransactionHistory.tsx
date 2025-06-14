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
  Zap
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { TableSkeleton } from './LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { CONTRACTS } from '../constants/contracts';

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
  const { account, provider } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
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

  // Helper function to try multiple RPC endpoints
  const tryMultipleRpc = async <T,>(operation: (provider: ethers.JsonRpcProvider) => Promise<T>): Promise<T> => {
    const fallbackRpcUrls = [
      'https://bsc-testnet-rpc.publicnode.com',
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
      'https://bsc-testnet.public.blastapi.io',
      'https://endpoints.omniatech.io/v1/bsc/testnet/public'
    ];
    
    let lastError: Error | null = null;
    
    for (const rpcUrl of fallbackRpcUrls) {
      try {
        console.log(`TransactionHistory: Trying RPC ${rpcUrl}...`);
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        const result = await operation(rpcProvider);
        console.log(`TransactionHistory: RPC success with ${rpcUrl}`);
        return result;
      } catch (error: any) {
        console.warn(`TransactionHistory: RPC failed for ${rpcUrl}:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  };

  // Parse LPLocker events
  const parseLPLockerEvents = async (rpcProvider: ethers.JsonRpcProvider): Promise<Transaction[]> => {
    const transactions: Transaction[] = [];
    
    try {
      // Event signatures
      const VG_TOKENS_EARNED_TOPIC = ethers.id("VGTokensEarned(address,uint256,uint256,uint256,uint256,uint256)");
      const LP_TOKENS_LOCKED_TOPIC = ethers.id("LPTokensLocked(address,uint256,uint256,uint256)");
      const VG_TOKENS_DEPOSITED_TOPIC = ethers.id("VGTokensDeposited(address,uint256,uint256,uint256)");
      
      // Get current block and calculate search ranges
      const currentBlock = await rpcProvider.getBlockNumber();
      console.log(`TransactionHistory: Current block: ${currentBlock}`);
      
      // RPC-safe search strategy: all ranges ≤ 40k blocks to stay under 50k limit
      const searchRanges = [
        { from: Math.max(0, currentBlock - 10000), to: currentBlock, label: "last 10k blocks" },
        { from: Math.max(0, currentBlock - 20000), to: currentBlock - 10000, label: "10k-20k blocks ago" },
        { from: Math.max(0, currentBlock - 30000), to: currentBlock - 20000, label: "20k-30k blocks ago" },
        { from: Math.max(0, currentBlock - 40000), to: currentBlock - 30000, label: "30k-40k blocks ago" },
        { from: Math.max(0, currentBlock - 50000), to: currentBlock - 40000, label: "40k-50k blocks ago" },
        { from: Math.max(0, currentBlock - 90000), to: currentBlock - 50000, label: "50k-90k blocks ago" },
        { from: Math.max(0, currentBlock - 130000), to: currentBlock - 90000, label: "90k-130k blocks ago" },
        { from: Math.max(0, currentBlock - 170000), to: currentBlock - 130000, label: "130k-170k blocks ago" },
        { from: Math.max(0, currentBlock - 210000), to: currentBlock - 170000, label: "170k-210k blocks ago" },
        { from: Math.max(0, currentBlock - 250000), to: currentBlock - 210000, label: "210k-250k blocks ago" }
      ];
      
      console.log(`TransactionHistory: Starting RPC-safe LPLocker events search...`);
      
      // First, try to find specific known transactions
      const knownTxHashes = [
        '0x6a4fb273dc00092cd3b75409d250b7db1edd4f3041fd21d6f52bd495d26503fe', // earnVG fix
        '0xb314f4c07555c6e6158d9921778b989cf9388f4cf1a88b67bbfe95b1635cfb7d', // MEV disable
        '0xf7850a9ea2150d88402a7f2fe643be17251a3faed4a8b1a081311ee71da982ce', // Add liquidity
        '0x05efba57c502b405ad59fb2a64d32f919f973a536253774561715e387c4faf95'  // Create pair
      ];
      
      console.log(`TransactionHistory: Checking known transaction hashes...`);
      for (const txHash of knownTxHashes) {
        try {
          const receipt = await rpcProvider.getTransactionReceipt(txHash);
          if (receipt && receipt.from.toLowerCase() === account!.toLowerCase()) {
            console.log(`TransactionHistory: Found known transaction: ${txHash}`);
            
            // Parse logs from this transaction
            for (const log of receipt.logs) {
              if (log.address.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase()) {
                try {
                  if (log.topics[0] === VG_TOKENS_EARNED_TOPIC) {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                      ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
                      log.data
                    );
                    
                    const block = await rpcProvider.getBlock(receipt.blockNumber);
                    
                    transactions.push({
                      id: `${txHash}-${log.logIndex}`,
                      hash: txHash,
                      type: 'earn_vg',
                      status: 'confirmed',
                      timestamp: block ? block.timestamp * 1000 : Date.now(),
                      amount: ethers.formatEther(decoded[1]),
                      token: 'VG',
                      blockNumber: receipt.blockNumber,
                      value: `${ethers.formatEther(decoded[3])} VC + ${ethers.formatEther(decoded[2])} BNB`,
                      from: account!,
                      to: CONTRACTS.LP_LOCKER
                    });
                  }
                } catch (error) {
                  console.warn(`TransactionHistory: Failed to decode known transaction log:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.warn(`TransactionHistory: Failed to check known transaction ${txHash}:`, error);
        }
      }
      
      for (const range of searchRanges) {
        if (transactions.length >= 20) break; // Limit to prevent too many results
        
        console.log(`TransactionHistory: Searching LPLocker events in ${range.label} (${range.from}-${range.to})`);
        
        try {
          // Get VGTokensEarned events
          const earnVGLogs = await rpcProvider.getLogs({
            address: CONTRACTS.LP_LOCKER,
            topics: [VG_TOKENS_EARNED_TOPIC, ethers.zeroPadValue(account!, 32)],
            fromBlock: range.from,
            toBlock: range.to
          });
          
          console.log(`TransactionHistory: Found ${earnVGLogs.length} VGTokensEarned events in ${range.label}`);
          
          for (const log of earnVGLogs) {
            try {
              const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
                log.data
              );
              
              const block = await rpcProvider.getBlock(log.blockNumber);
              
              transactions.push({
                id: `${log.transactionHash}-${log.logIndex}`,
                hash: log.transactionHash,
                type: 'earn_vg',
                status: 'confirmed',
                timestamp: block ? block.timestamp * 1000 : Date.now(),
                amount: ethers.formatEther(decoded[1]), // vgAmount
                token: 'VG',
                blockNumber: log.blockNumber,
                value: `${ethers.formatEther(decoded[3])} VC + ${ethers.formatEther(decoded[2])} BNB`,
                from: account!,
                to: CONTRACTS.LP_LOCKER
              });
            } catch (error) {
              console.warn('TransactionHistory: Failed to decode VGTokensEarned event:', error);
            }
          }
          
          // Get LPTokensLocked events
          const lockLPLogs = await rpcProvider.getLogs({
            address: CONTRACTS.LP_LOCKER,
            topics: [LP_TOKENS_LOCKED_TOPIC, ethers.zeroPadValue(account!, 32)],
            fromBlock: range.from,
            toBlock: range.to
          });
          
          console.log(`TransactionHistory: Found ${lockLPLogs.length} LPTokensLocked events in ${range.label}`);
          
          for (const log of lockLPLogs) {
            try {
              const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                ['uint256', 'uint256', 'uint256'],
                log.data
              );
              
              const block = await rpcProvider.getBlock(log.blockNumber);
              
              transactions.push({
                id: `${log.transactionHash}-${log.logIndex}`,
                hash: log.transactionHash,
                type: 'lock_lp',
                status: 'confirmed',
                timestamp: block ? block.timestamp * 1000 : Date.now(),
                amount: ethers.formatEther(decoded[1]), // vgAmount
                token: 'VG',
                blockNumber: log.blockNumber,
                value: `${ethers.formatEther(decoded[0])} LP`,
                from: account!,
                to: CONTRACTS.LP_LOCKER
              });
            } catch (error) {
              console.warn('TransactionHistory: Failed to decode LPTokensLocked event:', error);
            }
          }
          
          // If we found events in this range, continue searching
          if (earnVGLogs.length > 0 || lockLPLogs.length > 0) {
            console.log(`TransactionHistory: Found events in ${range.label}, continuing search for more...`);
          }
          
        } catch (error) {
          console.warn(`TransactionHistory: Failed to search ${range.label}:`, error);
          // Continue with next range even if this one fails
          continue;
        }
      }
      
    } catch (error) {
      console.warn('TransactionHistory: Failed to fetch LPLocker events:', error);
    }
    
    console.log(`TransactionHistory: Total LPLocker transactions found: ${transactions.length}`);
    return transactions;
  };

  // Parse ERC20 Transfer events
  const parseERC20Events = async (rpcProvider: ethers.JsonRpcProvider): Promise<Transaction[]> => {
    const transactions: Transaction[] = [];
    
    try {
      const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
      const APPROVAL_TOPIC = ethers.id("Approval(address,address,uint256)");
      const currentBlock = await rpcProvider.getBlockNumber();
      
      // RPC-safe search for ERC20 events: all ranges ≤ 40k blocks
      const searchRanges = [
        { from: Math.max(0, currentBlock - 15000), to: currentBlock, label: "last 15k blocks" },
        { from: Math.max(0, currentBlock - 30000), to: currentBlock - 15000, label: "15k-30k blocks ago" },
        { from: Math.max(0, currentBlock - 45000), to: currentBlock - 30000, label: "30k-45k blocks ago" },
        { from: Math.max(0, currentBlock - 85000), to: currentBlock - 45000, label: "45k-85k blocks ago" },
        { from: Math.max(0, currentBlock - 125000), to: currentBlock - 85000, label: "85k-125k blocks ago" },
        { from: Math.max(0, currentBlock - 165000), to: currentBlock - 125000, label: "125k-165k blocks ago" }
      ];
      
      console.log(`TransactionHistory: Starting RPC-safe ERC20 events search...`);
      
      // Token contracts to monitor
      const tokenContracts = [
        { address: CONTRACTS.VG_TOKEN, symbol: 'VG' },
        { address: CONTRACTS.VC_TOKEN, symbol: 'VC' },
        { address: CONTRACTS.LP_TOKEN, symbol: 'LP' }
      ];
      
      for (const range of searchRanges) {
        if (transactions.length >= 30) break; // Limit to prevent too many results
        
        console.log(`TransactionHistory: Searching ERC20 events in ${range.label} (${range.from}-${range.to})`);
        
        for (const token of tokenContracts) {
          try {
            console.log(`TransactionHistory: Fetching ${token.symbol} events in ${range.label}...`);
            
            // Get transfers FROM user
            const fromLogs = await rpcProvider.getLogs({
              address: token.address,
              topics: [TRANSFER_TOPIC, ethers.zeroPadValue(account!, 32), null],
              fromBlock: range.from,
              toBlock: range.to
            });
            
            // Get transfers TO user
            const toLogs = await rpcProvider.getLogs({
              address: token.address,
              topics: [TRANSFER_TOPIC, null, ethers.zeroPadValue(account!, 32)],
              fromBlock: range.from,
              toBlock: range.to
            });
            
            // Get approvals FROM user
            const approvalLogs = await rpcProvider.getLogs({
              address: token.address,
              topics: [APPROVAL_TOPIC, ethers.zeroPadValue(account!, 32), null],
              fromBlock: range.from,
              toBlock: range.to
            });
            
            const allLogs = [...fromLogs, ...toLogs, ...approvalLogs];
            console.log(`TransactionHistory: Found ${allLogs.length} ${token.symbol} events in ${range.label} (${fromLogs.length} from, ${toLogs.length} to, ${approvalLogs.length} approvals)`);
            
            for (const log of allLogs) {
              try {
                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], log.data);
                const from = ethers.getAddress('0x' + log.topics[1]!.slice(26));
                const to = ethers.getAddress('0x' + log.topics[2]!.slice(26));
                
                const block = await rpcProvider.getBlock(log.blockNumber);
                
                if (log.topics[0] === APPROVAL_TOPIC) {
                  // Approval event
                  transactions.push({
                    id: `${log.transactionHash}-${log.logIndex}`,
                    hash: log.transactionHash,
                    type: 'approve',
                    status: 'confirmed',
                    timestamp: block ? block.timestamp * 1000 : Date.now(),
                    amount: ethers.formatEther(decoded[0]),
                    token: token.symbol,
                    blockNumber: log.blockNumber,
                    from,
                    to,
                    value: `Одобрено ${token.symbol} для ${to.slice(0, 8)}...`
                  });
                } else {
                  // Transfer event
                  // Skip if it's internal contract transfer
                  if (from === CONTRACTS.LP_LOCKER || to === CONTRACTS.LP_LOCKER) continue;
                  
                  const isOutgoing = from.toLowerCase() === account!.toLowerCase();
                  
                  transactions.push({
                    id: `${log.transactionHash}-${log.logIndex}`,
                    hash: log.transactionHash,
                    type: 'transfer',
                    status: 'confirmed',
                    timestamp: block ? block.timestamp * 1000 : Date.now(),
                    amount: ethers.formatEther(decoded[0]),
                    token: token.symbol,
                    blockNumber: log.blockNumber,
                    from,
                    to,
                    value: isOutgoing ? `Отправлено ${token.symbol}` : `Получено ${token.symbol}`
                  });
                }
              } catch (error) {
                console.warn(`TransactionHistory: Failed to decode ${token.symbol} event:`, error);
              }
            }
            
            // If we found events for this token in this range, note it
            if (allLogs.length > 0) {
              console.log(`TransactionHistory: Found ${token.symbol} events in ${range.label}`);
            }
            
          } catch (error) {
            console.warn(`TransactionHistory: Failed to fetch ${token.symbol} events in ${range.label}:`, error);
            // Continue with next token even if this one fails
            continue;
          }
        }
      }
    } catch (error) {
      console.warn('TransactionHistory: Failed to fetch ERC20 events:', error);
    }
    
    console.log(`TransactionHistory: Total ERC20 transactions found: ${transactions.length}`);
    return transactions;
  };

  // Parse BNB transactions
  const parseBNBTransactions = async (rpcProvider: ethers.JsonRpcProvider): Promise<Transaction[]> => {
    const transactions: Transaction[] = [];
    
    try {
      const currentBlock = await rpcProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 50); // Last 50 blocks for BNB txs (reduced for performance)
      
      console.log(`TransactionHistory: Fetching BNB transactions from block ${fromBlock} to ${currentBlock}`);
      
      // Get recent blocks and check for transactions involving our account
      for (let blockNumber = currentBlock; blockNumber > fromBlock && blockNumber > 0 && transactions.length < 10; blockNumber--) {
        try {
          const block = await rpcProvider.getBlock(blockNumber, true);
          if (!block || !block.transactions) continue;
          
          for (const tx of block.transactions) {
            if (typeof tx === 'string') continue;
            if (transactions.length >= 10) break; // Limit to 10 BNB transactions
            
            // Check if transaction involves our account
            const isFromUser = tx.from?.toLowerCase() === account!.toLowerCase();
            const isToUser = tx.to?.toLowerCase() === account!.toLowerCase();
            
            if (isFromUser || isToUser) {
              // Skip contract interactions (we handle them separately)
              if (tx.to && (
                tx.to.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase() ||
                tx.to.toLowerCase() === CONTRACTS.VG_TOKEN.toLowerCase() ||
                tx.to.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase() ||
                tx.to.toLowerCase() === CONTRACTS.LP_TOKEN.toLowerCase()
              )) {
                continue;
              }
              
              // Only include transactions with value > 0
              if (tx.value && tx.value > 0n) {
                transactions.push({
                  id: `${tx.hash}-bnb`,
                  hash: tx.hash,
                  type: 'transfer',
                  status: 'confirmed',
                  timestamp: block.timestamp * 1000,
                  amount: ethers.formatEther(tx.value),
                  token: 'BNB',
                  blockNumber: tx.blockNumber || blockNumber,
                  from: tx.from || '',
                  to: tx.to || '',
                  value: isFromUser ? `Отправлено BNB` : `Получено BNB`,
                  gasUsed: tx.gasLimit ? ethers.formatEther(tx.gasLimit * (tx.gasPrice || 0n)) : undefined
                });
              }
            }
          }
        } catch (error) {
          console.warn(`TransactionHistory: Failed to fetch block ${blockNumber}:`, error);
          // Continue with next block
        }
      }
    } catch (error) {
      console.warn('TransactionHistory: Failed to fetch BNB transactions:', error);
    }
    
    return transactions;
  };

  const fetchRecentTransactions = useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const now = Date.now();
    if (!isRefresh && now - lastFetchTime < 10000) {
      console.log('TransactionHistory: Skipping fetch - cached data is fresh');
      return;
    }
    
    if (!account) {
      console.log('TransactionHistory: Skipping fetch - no account');
      return;
    }
    
    console.log('TransactionHistory: Starting transaction fetch for account:', account);
    
    if (transactions.length === 0) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const allTransactions: Transaction[] = [];
      
      // Fetch LPLocker events
      console.log('TransactionHistory: Fetching LPLocker events...');
      const lpLockerTxs = await tryMultipleRpc(parseLPLockerEvents);
      console.log(`TransactionHistory: Found ${lpLockerTxs.length} LPLocker transactions`);
      allTransactions.push(...lpLockerTxs);
      
      // Fetch ERC20 Transfer events
      console.log('TransactionHistory: Fetching ERC20 events...');
      const erc20Txs = await tryMultipleRpc(parseERC20Events);
      console.log(`TransactionHistory: Found ${erc20Txs.length} ERC20 transactions`);
      allTransactions.push(...erc20Txs);
      
      // Fetch BNB transactions
      console.log('TransactionHistory: Fetching BNB transactions...');
      const bnbTxs = await tryMultipleRpc(parseBNBTransactions);
      console.log(`TransactionHistory: Found ${bnbTxs.length} BNB transactions`);
      allTransactions.push(...bnbTxs);
      
      console.log(`TransactionHistory: Total transactions before deduplication: ${allTransactions.length}`);
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      // Remove duplicates and limit to 50 transactions
      const uniqueTransactions = allTransactions
        .filter((tx, index, self) => index === self.findIndex(t => t.hash === tx.hash && t.id === tx.id))
        .slice(0, 50);
      
      console.log(`TransactionHistory: Final unique transactions: ${uniqueTransactions.length}`);
      
      if (isMountedRef.current && !signal.aborted) {
        setTransactions(uniqueTransactions);
        saveTransactions(uniqueTransactions);
        setLastFetchTime(now);
        console.log('TransactionHistory: Transactions updated successfully');
        
        if (uniqueTransactions.length === 0) {
          console.log('TransactionHistory: No transactions found for this account. This might be normal if the account has not interacted with our contracts yet.');
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('TransactionHistory: Fetch aborted');
        return;
      }
      console.error('TransactionHistory: Error fetching transactions:', error);
      
      // If no cached transactions, show empty state
      if (transactions.length === 0) {
        setTransactions([]);
      }
    } finally {
      if (isMountedRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
        setLastFetchTime(Date.now());
      }
    }
  }, [account, transactions.length, lastFetchTime]);

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
        <h3 className="text-xl font-semibold">История транзакций</h3>
          {refreshing && (
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm">{t('common:labels.refreshing')}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => fetchRecentTransactions(true)}
          className="btn-secondary p-2"
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
                  <div className="font-semibold">{getTypeLabel(tx.type)}</div>
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