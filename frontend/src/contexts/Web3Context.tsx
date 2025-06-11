import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { CONTRACTS, BSC_TESTNET } from '../constants/contracts';
import toast from 'react-hot-toast';

// Complete Contract ABIs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

const LPTOKEN_ABI = [
  ...ERC20_ABI,
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112, uint112, uint32)"
];

const LPLOCKER_ABI = [
  // Real LPLocker functions from the deployed contract
  "function earnVG(uint256 vcAmount, uint256 bnbAmount, uint16 slippageBps) external payable",
  "function depositVGTokens(uint256 amount) external",
  "function updateRates(uint256 newLpToVgRatio, uint256 newLpDivisor) external",
  "function updatePancakeConfig(address newRouter, address newLpToken) external",
  "function updateMevProtection(bool enabled, uint256 minTimeBetweenTxs, uint8 maxTxPerBlock) external",
  "function getPoolInfo() external view returns (uint256 totalLocked, uint256 totalIssued, uint256 totalDeposited, uint256 availableVG)",
  "function transferAuthority(address newAuthority) external",
  "function config() external view returns (tuple(address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint256 maxSlippageBps, uint256 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited))",
  "function lastUserTxTimestamp(address user) external view returns (uint256)",
  "function lastUserTxBlock(address user) external view returns (uint256)",
  "function userTxCountInBlock(address user) external view returns (uint8)",
  "function owner() view returns (address)",
  "function proxiableUUID() view returns (bytes32)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function upgradeTo(address newImplementation) external",
  "function upgradeToAndCall(address newImplementation, bytes memory data) payable external"
];

const VGVOTES_ABI = [
  ...ERC20_ABI,
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external", 
  "function getVotes(address account) view returns (uint256)",
  "function underlying() view returns (address)",
  "function delegate(address delegatee) external",
  "function delegates(address account) view returns (address)",
  "function getPastVotes(address account, uint256 blockNumber) view returns (uint256)",
  "function getPastTotalSupply(uint256 blockNumber) view returns (uint256)",
];

const GOVERNOR_ABI = [
  "function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string memory reason) returns (uint256)",
  "function execute(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) payable returns (uint256)",
  "function getVotes(address account, uint256 blockNumber) view returns (uint256)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function quorum(uint256 blockNumber) view returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function version() view returns (string)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
];

const TIMELOCK_ABI = [
  "function delay() view returns (uint256)",
  "function getMinDelay() view returns (uint256)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function isOperation(bytes32 id) view returns (bool)",
  "function isOperationPending(bytes32 id) view returns (bool)",
  "function isOperationReady(bytes32 id) view returns (bool)",
  "function isOperationDone(bytes32 id) view returns (bool)",
  "function getTimestamp(bytes32 id) view returns (uint256)",
  "function schedule(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, uint256 delay) external",
  "function execute(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt) payable external",
  "function cancel(bytes32 id) external",
];

const PANCAKE_ROUTER_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)",
  "function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)",
  "function factory() external pure returns (address)",
  "function WETH() external pure returns (address)",
];

const PANCAKE_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function createPair(address tokenA, address tokenB) external returns (address pair)",
  "function feeTo() external view returns (address)",
  "function feeToSetter() external view returns (address)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)",
];

const PANCAKE_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function price0CumulativeLast() external view returns (uint256)",
  "function price1CumulativeLast() external view returns (uint256)",
  "function kLast() external view returns (uint256)",
];

interface Web3ContextType {
  // Connection
  provider: BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  
  // Functions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToTestnet: () => Promise<void>;
  
  // Contracts
  getContract: (address: string, abi: string[]) => Contract | null;
  vcContract: Contract | null;
  vgContract: Contract | null;
  vgVotesContract: Contract | null;
  lpContract: Contract | null; // ERC20 LP token contract
  lpPairContract: Contract | null; // LP pair contract for getReserves()
  lpLockerContract: Contract | null;
  governorContract: Contract | null;
  timelockContract: Contract | null;
  // PancakeSwap Contracts
  pancakeRouterContract: Contract | null;
  pancakeFactoryContract: Contract | null;
  wbnbContract: Contract | null;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

// Advanced wallet detection that bypasses conflicting extensions
const detectWeb3Provider = (): any => {
  // 1. Try direct MetaMask detection (most reliable)
  if (window.ethereum?.isMetaMask && !window.ethereum?.isConnected?.()) {
    return window.ethereum;
  }

  // 2. Try EIP-6963 wallet discovery (modern standard)
  if (window.ethereum?.providers) {
    const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask);
    if (metaMaskProvider) return metaMaskProvider;
  }

  // 3. Try evmproviders (EIP-5749 standard)
  if ((window as any).evmproviders) {
    const providers = Object.values((window as any).evmproviders);
    const metaMaskProvider = providers.find((p: any) => p.info?.name?.toLowerCase().includes('metamask'));
    if (metaMaskProvider) return metaMaskProvider;
  }

  // 4. Check specific MetaMask namespace
  if ((window as any).ethereum?.selectedProvider?.isMetaMask) {
    return (window as any).ethereum.selectedProvider;
  }

  // 5. Final fallback to window.ethereum if available
  if (window.ethereum) {
    return window.ethereum;
  }

  return null;
};

// Safe provider request wrapper that handles conflicts
const safeProviderRequest = async (provider: any, method: string, params: any[] = []) => {
  try {
    // Direct method call if available
    if (provider.request) {
      return await provider.request({ method, params });
    }
    
    // Fallback to send if request not available
    if (provider.send) {
      return new Promise((resolve, reject) => {
        provider.send({ method, params }, (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result.result);
        });
      });
    }
    
    throw new Error('Provider does not support request or send');
  } catch (error: any) {
    // Handle specific extension conflicts
    if (error.message?.includes('evmAsk') || error.message?.includes('Extension conflict')) {
      console.warn('Extension conflict detected, trying alternative method');
      // Add delay and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return await provider.request({ method, params });
    }
    throw error;
  }
};

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === BSC_TESTNET.chainId;

  // Contract instances
  const getContract = (address: string, abi: string[]) => {
    if (!signer) return null;
    return new Contract(address, abi, signer);
  };

  const vcContract = getContract(CONTRACTS.VC_TOKEN, ERC20_ABI);
  const vgContract = getContract(CONTRACTS.VG_TOKEN, ERC20_ABI);
  const vgVotesContract = getContract(CONTRACTS.VG_TOKEN_VOTES, VGVOTES_ABI);
  const lpContract = getContract(CONTRACTS.LP_TOKEN, ERC20_ABI);
  const lpPairContract = null;
  const lpLockerContract = getContract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI);
  const governorContract = getContract(CONTRACTS.GOVERNOR, GOVERNOR_ABI);
  const timelockContract = getContract(CONTRACTS.TIMELOCK, TIMELOCK_ABI);
  // PancakeSwap contracts
  const pancakeRouterContract = getContract(CONTRACTS.PANCAKE_ROUTER, PANCAKE_ROUTER_ABI);
  const pancakeFactoryContract = getContract(CONTRACTS.PANCAKE_FACTORY, PANCAKE_FACTORY_ABI);
  const wbnbContract = getContract(CONTRACTS.WBNB, ERC20_ABI);

  const connectWallet = async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      
      const detectedProvider = detectWeb3Provider();
      if (!detectedProvider) {
        toast.error('MetaMask не найден! Установите MetaMask.');
        return;
      }

      // Check if already connected to avoid unnecessary prompts
      const accounts = await safeProviderRequest(detectedProvider, 'eth_accounts');
      
      let finalAccounts = accounts;
      if (!accounts || accounts.length === 0) {
        // Request connection only if not connected
        finalAccounts = await safeProviderRequest(detectedProvider, 'eth_requestAccounts');
      }

      if (!finalAccounts || finalAccounts.length === 0) {
        toast.error('Подключение отменено пользователем');
        return;
      }

      const provider = new BrowserProvider(detectedProvider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      
      toast.success('Кошелёк подключён!');
      
      if (Number(network.chainId) !== BSC_TESTNET.chainId) {
        toast.error('Переключитесь на BSC Testnet');
      }
    } catch (error: any) {
      console.error('Ошибка подключения:', error);
      
      // Better error handling
      if (error.code === 4001) {
        toast.error('Подключение отклонено пользователем');
      } else if (error.code === -32002) {
        toast.error('Уже есть запрос на подключение. Проверьте MetaMask.');
      } else if (error.message?.includes('evmAsk')) {
        toast.error('Конфликт расширений. Отключите evmAsk или другие кошельки.');
      } else {
        toast.error('Ошибка подключения к кошельку');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    toast.success('Кошелёк отключён');
  };

  const switchToTestnet = async () => {
    const ethereum = detectWeb3Provider();
    if (!ethereum) {
      toast.error('MetaMask не найден');
      return;
    }

    try {
      // Try to switch to BSC Testnet
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BSC_TESTNET.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${BSC_TESTNET.chainId.toString(16)}`,
                chainName: BSC_TESTNET.name,
                nativeCurrency: {
                  name: BSC_TESTNET.currency,
                  symbol: BSC_TESTNET.currency,
                  decimals: 18,
                },
                rpcUrls: [BSC_TESTNET.rpcUrl, ...BSC_TESTNET.fallbackRpcUrls],
                blockExplorerUrls: [BSC_TESTNET.blockExplorer],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding BSC Testnet:', addError);
          toast.error('Ошибка добавления BSC Testnet в MetaMask');
        }
      } else {
        console.error('Error switching to BSC Testnet:', switchError);
        toast.error('Ошибка переключения на BSC Testnet');
      }
    }
  };

  // Listen for account/chain changes
  useEffect(() => {
    const detectedProvider = detectWeb3Provider();
    if (!detectedProvider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        toast.info('Аккаунт изменён');
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      
      if (newChainId === BSC_TESTNET.chainId) {
        toast.success('Переключено на BSC Testnet!');
      } else {
        toast.warning('Сеть изменена. Рекомендуется BSC Testnet.');
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    // Safe event listener attachment
    try {
      if (detectedProvider.on) {
        detectedProvider.on('accountsChanged', handleAccountsChanged);
        detectedProvider.on('chainChanged', handleChainChanged);
        detectedProvider.on('disconnect', handleDisconnect);
      }
    } catch (error) {
      console.warn('Error attaching event listeners:', error);
    }

    return () => {
      try {
        if (detectedProvider.removeListener) {
          detectedProvider.removeListener('accountsChanged', handleAccountsChanged);
          detectedProvider.removeListener('chainChanged', handleChainChanged);
          detectedProvider.removeListener('disconnect', handleDisconnect);
        }
      } catch (error) {
        console.warn('Error removing event listeners:', error);
      }
    };
  }, [account]);

  // Auto-connect if previously connected (with advanced detection)
  useEffect(() => {
    const checkConnection = async () => {
      const detectedProvider = detectWeb3Provider();
      if (!detectedProvider) return;
      
      try {
        const accounts = await safeProviderRequest(detectedProvider, 'eth_accounts');
        
        if (accounts && accounts.length > 0) {
          const provider = new BrowserProvider(detectedProvider);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));
        }
      } catch (error) {
        console.error('Ошибка автоподключения:', error);
        // Не показываем toast при автоподключении - это не критично
      }
    };

    // Добавляем задержку для избежания конфликтов с расширениями
    const timeoutId = setTimeout(checkConnection, 1500);
    return () => clearTimeout(timeoutId);
  }, []);

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToTestnet,
    getContract,
    vcContract,
    vgContract,
    vgVotesContract,
    lpContract,
    lpPairContract,
    lpLockerContract,
    governorContract,
    timelockContract,
    // PancakeSwap contracts
    pancakeRouterContract,
    pancakeFactoryContract,
    wbnbContract,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
    evmproviders?: any;
  }
} 