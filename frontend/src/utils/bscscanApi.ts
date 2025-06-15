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
    maxResults = 50
  ): Promise<{
    normalTxs: BSCScanTransaction[];
    tokenTxs: BSCScanTokenTransfer[];
    eventLogs: BSCScanEventLog[];
  }> {
    try {
      log.info('BSCScan: Fetching transactions', {
        component: 'BSCScanAPI',
        function: 'getAllTransactions',
        address,
        contractCount: contractAddresses.length,
        maxResults
      });
      
      // Get normal transactions (reduced limit for free tier)
      const normalTxs = await this.getNormalTransactions(address, 0, 99999999, 1, Math.min(maxResults / 2, 20));
      log.info('BSCScan: Found normal transactions', {
        component: 'BSCScanAPI',
        function: 'getAllTransactions',
        address,
        count: normalTxs.length
      });
      
      // Get token transfers (reduced limit for free tier)
      const tokenTxs = await this.getTokenTransfers(address, undefined, 0, 99999999, 1, Math.min(maxResults / 2, 20));
      log.info('BSCScan: Found token transfers', {
        component: 'BSCScanAPI',
        function: 'getAllTransactions',
        address,
        count: tokenTxs.length
      });
      
      // Skip event logs for free tier (often requires API key)
      const eventLogs: BSCScanEventLog[] = [];
      log.info('BSCScan: Skipping event logs (requires API key)', {
        component: 'BSCScanAPI',
        function: 'getAllTransactions',
        address
      });
      
      return { normalTxs, tokenTxs, eventLogs };
      
    } catch (error) {
      log.error('BSCScan getAllTransactions failed', {
        component: 'BSCScanAPI',
        function: 'getAllTransactions',
        address
      }, error as Error);
      return { normalTxs: [], tokenTxs: [], eventLogs: [] };
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