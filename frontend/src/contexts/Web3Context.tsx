import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { CONTRACTS } from '../constants/contracts';

// EIP-6963 imports
import { usePreferredProvider } from '../hooks/useWalletProviders';
import { detectLegacyProvider } from '../hooks/walletStore';
import type { EIP1193Provider } from '../types/eip6963';

// Contract ABIs
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

const LPLOCKER_ABI = [
  "function earnVG(uint256 vcAmount, uint256 bnbAmount, uint16 slippageBps) external payable",
  "function lockLPTokens(uint256 lpAmount) external",
  "function depositVGTokens(uint256 amount) external",
  "function updateRates(uint256 newLpToVgRatio, uint256 newLpDivisor) external",
  "function updatePancakeConfig(address newRouter, address newLpToken) external",
  "function updateMevProtection(bool enabled, uint256 minTimeBetweenTxs, uint8 maxTxPerBlock) external",
  "function getPoolInfo() external view returns (uint256 totalLocked, uint256 totalIssued, uint256 totalDeposited, uint256 availableVG)",
  "function transferAuthority(address newAuthority) external",
  "function config() external view returns (address authority, address vgTokenAddress, address vcTokenAddress, address pancakeRouter, address lpTokenAddress, address stakingVaultAddress, uint256 lpDivisor, uint256 lpToVgRatio, uint256 minBnbAmount, uint256 minVcAmount, uint16 maxSlippageBps, uint16 defaultSlippageBps, bool mevProtectionEnabled, uint256 minTimeBetweenTxs, uint8 maxTxPerUserPerBlock, uint256 totalLockedLp, uint256 totalVgIssued, uint256 totalVgDeposited)",
  "function lastUserTxTimestamp(address user) external view returns (uint256)",
  "function lastUserTxBlock(address user) external view returns (uint256)",
  "function userTxCountInBlock(address user) external view returns (uint8)",
  "function owner() view returns (address)",
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
  // Connection state
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  
  // Contracts (memoized)
  vcContract: ethers.Contract | null;
  vgContract: ethers.Contract | null;
  vgVotesContract: ethers.Contract | null;
  lpContract: ethers.Contract | null;
  lpPairContract: ethers.Contract | null;
  lpLockerContract: ethers.Contract | null;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  // State
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // EIP-6963 hooks
  const preferredProvider = usePreferredProvider();

  // BSC Testnet configuration
  const BSC_TESTNET_CONFIG = {
    chainId: '0x61', // 97 in hex
    chainName: 'BSC Testnet',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-testnet-rpc.publicnode.com'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  };

  /**
   * Get the best available Ethereum provider
   * Uses EIP-6963 first, then falls back to legacy detection
   */
  const getEthereumProvider = (): EIP1193Provider | null => {
    // 1. Try EIP-6963 preferred provider (MetaMask prioritized)
    if (preferredProvider) {
      console.log(`Web3Context: Using EIP-6963 provider: ${preferredProvider.info.name} (${preferredProvider.info.rdns})`);
      return preferredProvider.provider;
    }

    // 2. Fallback to legacy detection
    const legacyProvider = detectLegacyProvider();
    if (legacyProvider) {
      console.log('Web3Context: Using legacy provider detection');
      return legacyProvider;
    }

    console.log('Web3Context: No Ethereum provider found');
    return null;
  };

  // Helper function to create contract instances
  const getContract = (address: string, abi: any[]): ethers.Contract | null => {
    if (!signer || !account) return null;
    try {
      return new ethers.Contract(address, abi, signer);
    } catch (error) {
      console.error(`Web3Context: Failed to create contract at ${address}:`, error);
      return null;
    }
  };

  // Memoized contracts to prevent unnecessary re-renders
  const vcContract = useMemo(() => {
    return getContract(CONTRACTS.VC_TOKEN, ERC20_ABI);
  }, [signer, account]);

  const vgContract = useMemo(() => {
    return getContract(CONTRACTS.VG_TOKEN, ERC20_ABI);
  }, [signer, account]);

  const vgVotesContract = useMemo(() => {
    return getContract(CONTRACTS.VG_TOKEN_VOTES, VGVOTES_ABI);
  }, [signer, account]);

  const lpContract = useMemo(() => {
    return getContract(CONTRACTS.LP_TOKEN, ERC20_ABI);
  }, [signer, account]);

  const lpPairContract = useMemo(() => {
    return getContract(CONTRACTS.LP_TOKEN, PANCAKE_PAIR_ABI);
  }, [signer, account]);

  const lpLockerContract = useMemo(() => {
    return getContract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI);
  }, [signer, account]);

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumProvider();
      if (!ethereum) {
        toast.error('MetaMask не найден');
        return;
      }

      let accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
      
      if (!accounts || accounts.length === 0) {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
        if (!accounts || accounts.length === 0) {
          toast.error('Подключение отменено пользователем');
          return;
        }
      }

      const ethProvider = new ethers.BrowserProvider(ethereum);
      const ethSigner = await ethProvider.getSigner();
      const network = await ethProvider.getNetwork();
      
      setProvider(ethProvider);
      setSigner(ethSigner);
      setAccount(accounts[0] || null);
      setIsConnected(true);
      setIsCorrectNetwork(Number(network.chainId) === 97); // BSC Testnet chainId
      
      toast.success('Кошелёк подключён!');
      
      if (Number(network.chainId) !== 97) {
        toast.error('Переключитесь на BSC Testnet');
      }
    } catch (error: any) {
      console.error('Web3Context: Connection error:', error);
      
      // Better error handling with Phantom conflict detection
      if (error.code === 4001) {
        toast.error('Подключение отклонено пользователем');
      } else if (error.code === -32002) {
        toast.error('Уже есть запрос на подключение. Проверьте MetaMask.');
      } else if (error.message?.includes('evmAsk')) {
        toast.error('Конфликт расширений. Отключите evmAsk или другие кошельки.');
      } else if (error.message?.includes('phantom') || error.message?.toLowerCase().includes('solana')) {
        toast.error('Конфликт с Phantom кошельком. Используйте MetaMask для Ethereum/BSC.');
      } else if (error.message?.includes('User rejected')) {
        toast.error('Подключение отменено пользователем');
      } else {
        console.error('Web3Context: Detailed connection error:', {
          code: error.code,
          message: error.message,
          data: error.data
        });
        toast.error('Ошибка подключения к кошельку. Проверьте MetaMask.');
      }
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    toast.success('Кошелёк отключён');
  };

  const switchNetwork = async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      toast.error('MetaMask не найден');
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // BSC Testnet chainId in hex
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x61',
                chainName: BSC_TESTNET_CONFIG.chainName,
                nativeCurrency: BSC_TESTNET_CONFIG.nativeCurrency,
                rpcUrls: BSC_TESTNET_CONFIG.rpcUrls,
                blockExplorerUrls: BSC_TESTNET_CONFIG.blockExplorerUrls,
              },
            ],
          });
        } catch (addError) {
          console.error('Ошибка добавления сети:', addError);
          toast.error('Ошибка добавления BSC Testnet');
        }
      } else {
        console.error('Ошибка переключения сети:', switchError);
        toast.error('Ошибка переключения на BSC Testnet');
      }
    }
  };

  // Listen for account/chain changes
  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0] || null);
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setIsCorrectNetwork(newChainId === 97);
      
      if (newChainId === 97) {
        toast.success('Переключено на BSC Testnet!');
      } else {
        toast.error('Переключитесь на BSC Testnet');
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    // Safe event listener attachment
    try {
      if (ethereum.on) {
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('disconnect', handleDisconnect);
      }
    } catch (error) {
      console.error('Ошибка подключения слушателей событий:', error);
    }

    return () => {
      try {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('disconnect', handleDisconnect);
        }
      } catch (error) {
        console.error('Ошибка отключения слушателей событий:', error);
      }
    };
  }, [account]);

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    vcContract,
    vgContract,
    vgVotesContract,
    lpContract,
    lpPairContract,
    lpLockerContract,
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

// Export ABI for use in other components
export { PANCAKE_PAIR_ABI }; 