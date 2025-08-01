import { log } from './logger';
import { getCurrentNetwork } from '../config/contracts';

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

interface BSCScanContractInfo {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

/*
 * BSCScan API Configuration
 * 
 * To enable transaction history, you need a BSCScan API key:
 * 
 * 1. Go to https://bscscan.com/register and create an account
 * 2. Login and go to https://bscscan.com/myapikey
 * 3. Create a new API key (free tier allows 5 calls/second, 100,000 calls/day)
 * 4. Copy your API key and replace the empty string below
 * 
 * Example: const BSCSCAN_API_KEY = 'YourApiKeyHere123456789';
 * 
 * Note: The same API key works for both mainnet and testnet
 */

// ✅ MAINNET/TESTNET DYNAMIC CONFIG
const BSCSCAN_API_KEY = process.env.VITE_BSCSCAN_API_KEY || 'YourApiKeyHere';

// ✅ Dynamic BSCScan URLs based on current network
const getBSCScanConfig = () => {
  const currentNetwork = getCurrentNetwork();
  
  return {
    baseUrl: currentNetwork === 'mainnet' 
      ? 'https://api.bscscan.com/api'
      : 'https://api-testnet.bscscan.com/api',
    explorerUrl: currentNetwork === 'mainnet'
      ? 'https://bscscan.com'
      : 'https://testnet.bscscan.com',
    networkName: currentNetwork === 'mainnet' ? 'BSC Mainnet' : 'BSC Testnet'
  };
};

// Add warning about API key requirement ONLY when API is called
let apiKeyWarningShown = false;

export class BSCScanAPI {
  private static async fetchWithRetry(url: string, retries = 2): Promise<any> {
    const config = getBSCScanConfig();
    
    // Show API key warning only once
    if (!BSCSCAN_API_KEY && !apiKeyWarningShown) {
      console.warn(`⚠️ BSCScan API Key is missing. Please add your API key to enable transaction history on ${config.networkName}.`);
      apiKeyWarningShown = true;
    }
    
    let lastError: Error;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // BSCScan returns status: "0" for errors
        if (data.status === '0') {
          if (data.message === 'NOTOK' && data.result === 'Missing/Invalid API Key') {
            throw new Error(`BSCScan API Key is required. Please add your API key to enable transaction history on ${config.networkName}.`);
          }
          if (data.message === 'NOTOK') {
            throw new Error(data.result || 'BSCScan API error');
          }
        }
        
        return data;
      } catch (error) {
        log.warn('BSCScan API attempt failed', {
          component: 'BSCScanAPI',
          function: 'fetchWithRetry',
          network: config.networkName,
          url,
          attempt: i + 1,
          retries
        }, error as Error);
        lastError = error as Error;
        
        // Don't retry on API key errors
        if ((error as Error).message.includes('API Key')) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError!;
  }

  // ✅ NEW: Get contract source code and ABI
  static async getContractSource(contractAddress: string): Promise<BSCScanContractInfo | null> {
    const config = getBSCScanConfig();
    const url = `${config.baseUrl}?module=contract&action=getsourcecode&address=${contractAddress}${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
    
    try {
      const data = await this.fetchWithRetry(url);
      
      if (Array.isArray(data.result) && data.result.length > 0) {
        return data.result[0];
      }
      
      return null;
    } catch (error) {
      log.warn('BSCScan getContractSource failed', {
        component: 'BSCScanAPI',
        function: 'getContractSource',
        network: config.networkName,
        contractAddress
      }, error as Error);
      return null;
    }
  }

  // ✅ NEW: Validate contract exists and is not empty
  static async validateContract(contractAddress: string): Promise<{
    exists: boolean;
    isContract: boolean;
    hasSource: boolean;
    contractName?: string;
    error?: string;
  }> {
    const config = getBSCScanConfig();
    
    try {
      // Check if contract exists and has code
      const codeUrl = `${config.baseUrl}?module=proxy&action=eth_getCode&address=${contractAddress}&tag=latest${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
      const codeData = await this.fetchWithRetry(codeUrl);
      
      const hasCode = codeData.result && codeData.result !== '0x';
      
      if (!hasCode) {
        return {
          exists: false,
          isContract: false,
          hasSource: false,
          error: 'Address is not a contract or has no code'
        };
      }

      // Try to get source code
      const sourceInfo = await this.getContractSource(contractAddress);
      
      return {
        exists: true,
        isContract: true,
        hasSource: !!(sourceInfo?.SourceCode && sourceInfo.SourceCode !== ''),
        contractName: sourceInfo?.ContractName || 'Unknown',
        error: null
      };
      
    } catch (error) {
      log.error('BSCScan validateContract failed', {
        component: 'BSCScanAPI',
        function: 'validateContract',
        network: config.networkName,
        contractAddress
      }, error as Error);
      
      return {
        exists: false,
        isContract: false,
        hasSource: false,
        error: (error as Error).message
      };
    }
  }

  // ✅ NEW: Get token information
  static async getTokenInfo(contractAddress: string): Promise<{
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
    error?: string;
  }> {
    const config = getBSCScanConfig();
    
    try {
      // Get token info using multiple parallel requests
      const promises = [
        fetch(`${config.baseUrl}?module=stats&action=tokensupply&contractaddress=${contractAddress}${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`),
        // We can also use contract calls if needed
      ];

      const [supplyResponse] = await Promise.allSettled(promises);
      
      let totalSupply = '0';
      if (supplyResponse.status === 'fulfilled') {
        const supplyData = await supplyResponse.value.json();
        if (supplyData.status === '1') {
          totalSupply = supplyData.result;
        }
      }

      return {
        totalSupply,
        error: null
      };
      
    } catch (error) {
      log.error('BSCScan getTokenInfo failed', {
        component: 'BSCScanAPI',
        function: 'getTokenInfo',
        network: config.networkName,
        contractAddress
      }, error as Error);
      
      return {
        error: (error as Error).message
      };
    }
  }

  // Get normal transactions for an address
  static async getNormalTransactions(
    address: string, 
    startBlock = 0, 
    endBlock = 99999999,
    page = 1,
    offset = 20
  ): Promise<BSCScanTransaction[]> {
    const config = getBSCScanConfig();
    const url = `${config.baseUrl}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=desc${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
    
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
        network: config.networkName,
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
    const config = getBSCScanConfig();
    let url = `${config.baseUrl}?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=desc${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
    
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
        network: config.networkName,
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
    const config = getBSCScanConfig();
    let url = `${config.baseUrl}?module=logs&action=getLogs&address=${contractAddress}&fromBlock=${fromBlock}&toBlock=${toBlock}${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
    
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
        network: config.networkName,
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
    const config = getBSCScanConfig();
    const url = `${config.baseUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}${BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''}`;
    
    try {
      const data = await this.fetchWithRetry(url);
      return data.result;
    } catch (error) {
      log.warn('BSCScan getTransactionReceipt failed', {
        component: 'BSCScanAPI',
        function: 'getTransactionReceipt',
        network: config.networkName,
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
  console.log('🔍 DEBUG: Converting BSCScan transaction:', { bscscanTx, type });
  
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
    const result = {
      ...baseTransaction,
      type: 'transfer' as const,
      amount: (parseFloat(tx.value) / 1e18).toString(),
      token: 'BNB',
      from: tx.from,
      to: tx.to,
      value: `${(parseFloat(tx.value) / 1e18).toFixed(4)} BNB`
    };
    console.log('🔍 DEBUG: Normal transaction converted:', result);
    return result;
  }

  if (type === 'token') {
    const tx = bscscanTx as BSCScanTokenTransfer;
    const decimals = parseInt(tx.tokenDecimal) || 18;
    const amount = parseFloat(tx.value) / Math.pow(10, decimals);
    
    const result = {
      ...baseTransaction,
      type: 'transfer' as const,
      amount: amount.toString(),
      token: tx.tokenSymbol,
      from: tx.from,
      to: tx.to,
      value: `${amount.toFixed(4)} ${tx.tokenSymbol}`
    };
    console.log('🔍 DEBUG: Token transaction converted:', result);
    return result;
  }

  if (type === 'event') {
    const log = bscscanTx as BSCScanEventLog;
    // Determine event type based on topics
    let eventType = 'governance' as const;
    
    if (log.topics[0] === '0x30055ed7adb0b12d89a788d6382669f76b428bc35501622086ef69df37df8cd5') {
      eventType = 'earn_vg' as const;
    }
    
    const result = {
      ...baseTransaction,
      type: eventType,
      amount: '0',
      token: 'VG',
      from: log.address,
      to: log.address,
      value: 'Contract Event'
    };
    console.log('🔍 DEBUG: Event transaction converted:', result);
    return result;
  }

  console.log('🔍 DEBUG: Returning base transaction:', baseTransaction);
  return baseTransaction;
} 