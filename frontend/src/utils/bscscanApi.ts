import { log } from './logger';

interface BSCScanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

interface BSCScanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

interface BSCScanEventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  logIndex: string;
  transactionHash: string;
  transactionIndex: string;
}

const BSCSCAN_API_KEY = ''; // No API key - use free tier
const BSCSCAN_BASE_URL = 'https://api-testnet.bscscan.com/api';

export class BSCScanAPI {
  private static async fetchWithRetry(url: string, retries = 2): Promise<any> {
    let lastError: Error;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // BSCScan returns status: "0" for errors, but sometimes still has data
        if (data.status === '0' && data.message === 'NOTOK' && !data.result) {
          throw new Error(data.result || 'BSCScan API error - no API key');
        }
        
        return data;
      } catch (error) {
        log.warn('BSCScan API attempt failed', {
          component: 'BSCScanAPI',
          function: 'fetchWithRetry',
          url,
          attempt: i + 1,
          retries
        }, error as Error);
        lastError = error as Error;
        
        // Wait before retry (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError!;
  }

  // Get normal transactions for an address
  static async getNormalTransactions(
    address: string, 
    startBlock = 0, 
    endBlock = 99999999,
    page = 1,
    offset = 20
  ): Promise<BSCScanTransaction[]> {
    const url = `${BSCSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=desc${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
    
    try {
      const data = await this.fetchWithRetry(url);
      
      // Handle case where BSCScan returns data even with status "0"
      if (Array.isArray(data.result)) {
        return data.result.filter(tx => tx && tx.hash);
      }
      
      return [];
    } catch (error) {
      log.warn('BSCScan getNormalTransactions failed', {
        component: 'BSCScanAPI',
        function: 'getNormalTransactions',
        address,
        startBlock,
        endBlock
      }, error as Error);
      return [];
    }
  }

  // Get ERC20 token transfers for an address
  static async getTokenTransfers(
    address: string,
    contractAddress?: string,
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 20
  ): Promise<BSCScanTokenTransfer[]> {
    let url = `${BSCSCAN_BASE_URL}?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=desc${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
    
    if (contractAddress) {
      url += `&contractaddress=${contractAddress}`;
    }
    
    try {
      const data = await this.fetchWithRetry(url);
      
      // Handle case where BSCScan returns data even with status "0"
      if (Array.isArray(data.result)) {
        return data.result.filter(tx => tx && tx.hash);
      }
      
      return [];
    } catch (error) {
      log.warn('BSCScan getTokenTransfers failed', {
        component: 'BSCScanAPI',
        function: 'getTokenTransfers',
        address,
        contractAddress: contractAddress ? contractAddress : 'undefined',
        startBlock,
        endBlock,
        page,
        offset
      }, error as Error);
      return [];
    }
  }

  // Get event logs for a contract
  static async getEventLogs(
    contractAddress: string,
    fromBlock = 0,
    toBlock = 'latest',
    topic0?: string,
    topic1?: string,
    topic2?: string,
    topic3?: string
  ): Promise<BSCScanEventLog[]> {
    let url = `${BSCSCAN_BASE_URL}?module=logs&action=getLogs&address=${contractAddress}&fromBlock=${fromBlock}&toBlock=${toBlock}&apikey=${BSCSCAN_API_KEY}`;
    
    if (topic0) url += `&topic0=${topic0}`;
    if (topic1) url += `&topic1=${topic1}`;
    if (topic2) url += `&topic2=${topic2}`;
    if (topic3) url += `&topic3=${topic3}`;
    
    try {
      const data = await this.fetchWithRetry(url);
      return data.result || [];
    } catch (error) {
      log.warn('BSCScan getEventLogs failed', {
        component: 'BSCScanAPI',
        function: 'getEventLogs',
        contractAddress,
        fromBlock,
        toBlock,
        topic0,
        topic1,
        topic2,
        topic3
      }, error as Error);
      return [];
    }
  }

  // Get transaction receipt
  static async getTransactionReceipt(txHash: string): Promise<any> {
    const url = `${BSCSCAN_BASE_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`;
    
    try {
      const data = await this.fetchWithRetry(url);
      return data.result;
    } catch (error) {
      log.warn('BSCScan getTransactionReceipt failed', {
        component: 'BSCScanAPI',
        function: 'getTransactionReceipt',
        txHash
      }, error as Error);
      return null;
    }
  }

  // Simplified method to get all transactions for an address
  static async getAllTransactions(
    address: string,
    contractAddresses: string[] = [],
    maxResults = 200,
    page = 1
  ): Promise<{
    normalTxs: BSCScanTransaction[];
    tokenTxs: BSCScanTokenTransfer[];
    eventLogs: BSCScanEventLog[];
    hasMore: boolean;
  }> {
    log.info('Fetching all transactions from BSCScan', {
      component: 'BSCScanAPI',
      function: 'getAllTransactions',
      address,
      contractAddresses,
      maxResults,
      page
    });

    try {
      const promises = [
        // Get normal transactions (BNB transfers, contract calls)
        this.getNormalTransactions(address, 0, 99999999, page, Math.min(maxResults, 100)),
        
        // Get token transfers for our specific tokens
        this.getTokenTransfers(address, undefined, 0, 99999999, page, Math.min(maxResults, 100))
      ];

      // Add event logs for each contract
      for (const contractAddr of contractAddresses) {
        promises.push(
          this.getEventLogs(contractAddr, 0, 'latest')
        );
      }

      const results = await Promise.allSettled(promises);
      
      const normalTxs = results[0].status === 'fulfilled' ? results[0].value : [];
      const tokenTxs = results[1].status === 'fulfilled' ? results[1].value : [];
      const eventLogs: BSCScanEventLog[] = [];
      
      // Collect event logs from all contracts
      for (let i = 2; i < results.length; i++) {
        if (results[i].status === 'fulfilled') {
          eventLogs.push(...(results[i] as any).value);
        }
      }

      // Determine if there are more transactions available
      const hasMore = normalTxs.length >= Math.min(maxResults, 100) || 
                      tokenTxs.length >= Math.min(maxResults, 100);

      log.info('BSCScan transactions fetched', {
        component: 'BSCScanAPI',
        function: 'getAllTransactions',
        address,
        normalTxsCount: normalTxs.length,
        tokenTxsCount: tokenTxs.length,
        eventLogsCount: eventLogs.length,
        hasMore,
        page
      });

      return {
        normalTxs,
        tokenTxs,
        eventLogs,
        hasMore
      };
    } catch (error) {
      log.error('Failed to fetch transactions from BSCScan', {
        component: 'BSCScanAPI',
        function: 'getAllTransactions',
        address,
        maxResults,
        page
      }, error as Error);
      
      return {
        normalTxs: [],
        tokenTxs: [],
        eventLogs: [],
        hasMore: false
      };
    }
  }

  // Get ALL transactions for an address without filtering
  static async getAllUserTransactions(
    address: string,
    page = 1,
    maxResults = 100
  ): Promise<{
    normalTxs: BSCScanTransaction[];
    tokenTxs: BSCScanTokenTransfer[];
    hasMore: boolean;
  }> {
    log.info('Fetching ALL user transactions from BSCScan', {
      component: 'BSCScanAPI',
      function: 'getAllUserTransactions',
      address,
      page,
      maxResults
    });

    try {
      const promises = [
        // Get ALL normal transactions
        this.getNormalTransactions(address, 0, 99999999, page, Math.min(maxResults, 100)),
        
        // Get ALL token transfers
        this.getTokenTransfers(address, undefined, 0, 99999999, page, Math.min(maxResults, 100))
      ];

      const results = await Promise.allSettled(promises);
      
      const normalTxs = results[0].status === 'fulfilled' ? results[0].value : [];
      const tokenTxs = results[1].status === 'fulfilled' ? results[1].value : [];
      
      // Determine if there are more transactions available
      const hasMore = normalTxs.length >= Math.min(maxResults, 100) || 
                      tokenTxs.length >= Math.min(maxResults, 100);

      log.info('All user transactions fetched', {
        component: 'BSCScanAPI',
        function: 'getAllUserTransactions',
        address,
        normalTxsCount: normalTxs.length,
        tokenTxsCount: tokenTxs.length,
        hasMore,
        page
      });

      return {
        normalTxs,
        tokenTxs,
        hasMore
      };
    } catch (error) {
      log.error('Failed to fetch all user transactions from BSCScan', {
        component: 'BSCScanAPI',
        function: 'getAllUserTransactions',
        address,
        maxResults,
        page
      }, error as Error);
      
      return {
        normalTxs: [],
        tokenTxs: [],
        hasMore: false
      };
    }
  }
}

// Helper function to convert BSCScan data to our Transaction format
export function convertBSCScanToTransaction(
  bscscanTx: BSCScanTransaction | BSCScanTokenTransfer | BSCScanEventLog,
  type: 'normal' | 'token' | 'event'
): any {
  const baseTransaction = {
    id: `bscscan-${bscscanTx.hash}-${bscscanTx.transactionIndex || '0'}`,
    hash: bscscanTx.hash,
    status: 'confirmed' as const,
    timestamp: parseInt(bscscanTx.timeStamp) * 1000,
    blockNumber: parseInt(bscscanTx.blockNumber),
    gasUsed: bscscanTx.gasUsed,
    gasPrice: bscscanTx.gasPrice
  };

  if (type === 'normal') {
    const tx = bscscanTx as BSCScanTransaction;
    return {
      ...baseTransaction,
      type: 'transfer' as const,
      amount: (parseFloat(tx.value) / 1e18).toString(),
      token: 'BNB',
      from: tx.from,
      to: tx.to,
      value: `${(parseFloat(tx.value) / 1e18).toFixed(4)} BNB`
    };
  }

  if (type === 'token') {
    const tx = bscscanTx as BSCScanTokenTransfer;
    const decimals = parseInt(tx.tokenDecimal) || 18;
    const amount = parseFloat(tx.value) / Math.pow(10, decimals);
    
    return {
      ...baseTransaction,
      type: 'transfer' as const,
      amount: amount.toString(),
      token: tx.tokenSymbol,
      from: tx.from,
      to: tx.to,
      value: `${amount.toFixed(4)} ${tx.tokenSymbol}`
    };
  }

  if (type === 'event') {
    const log = bscscanTx as BSCScanEventLog;
    // Determine event type based on topics
    let eventType = 'governance' as const;
    
    if (log.topics[0] === '0x30055ed7adb0b12d89a788d6382669f76b428bc35501622086ef69df37df8cd5') {
      eventType = 'earn_vg' as const;
    }
    
    return {
      ...baseTransaction,
      type: eventType,
      amount: '0',
      token: 'VG',
      from: log.address,
      to: log.address,
      value: 'Contract Event'
    };
  }

  return baseTransaction;
} 