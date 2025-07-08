import React, { createContext, useContext, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import { config, customTheme } from '../../config/rainbowkit';
import { CONTRACTS } from '../config/contracts';
import { rpcService } from '../api/rpcService';
import { bscTestnet, bsc } from 'wagmi/chains';
import { useEthersProvider, useEthersSigner } from './ethers';
import { log } from './logger';

// ABIs
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

const VCSALE_ABI = [
  // Main purchase function
  "function purchaseVC(uint256 vcAmount) external payable",
  
  // Calculation functions
  "function calculateBNBAmount(uint256 vcAmount) external view returns (uint256)",
  "function calculateVCAmount(uint256 bnbAmount) external view returns (uint256)",
  "function getAvailableVC() external view returns (uint256)",
  
  // Statistics and monitoring
  "function getSaleStats() external view returns (uint256 totalVCAvailable, uint256 totalVCSold, uint256 currentVCBalance, uint256 pricePerVC, bool saleActive, uint256 totalRevenue, uint256 dailySalesAmount, bool circuitBreakerActive, uint256 salesInCurrentWindow)",
  "function getUserStats(address user) external view returns (uint256 purchasedVC, uint256 spentBNB, uint256 lastPurchaseTimestamp, bool isBlacklisted, uint256 canPurchaseNext)",
  "function canPurchase(address user, uint256 vcAmount) external view returns (bool canPurchase, string memory reason)",
  
  // Configuration getters
  "function saleConfig() external view returns (address vcTokenAddress, uint256 pricePerVC, uint256 minPurchaseAmount, uint256 maxPurchaseAmount, uint256 totalVCAvailable, uint256 totalVCSold, bool saleActive, address treasury, uint256 maxDailySales, uint256 priceUpdateCooldown, uint256 lastPriceUpdate)",
  "function securityConfig() external view returns (bool mevProtectionEnabled, uint256 minTimeBetweenPurchases, uint256 maxPurchasesPerBlock, bool circuitBreakerActive, uint256 circuitBreakerThreshold, uint256 circuitBreakerWindow)",
  "function circuitBreaker() external view returns (uint256 salesInWindow, uint256 windowStartTime, bool triggered, uint256 triggeredAt)",
  "function dailySales() external view returns (uint256 date, uint256 amount)",
  
  // User mappings
  "function userPurchasedVC(address user) external view returns (uint256)",
  "function userSpentBNB(address user) external view returns (uint256)",
  "function blacklistedUsers(address user) external view returns (bool)",
  "function lastPurchaseTime(address user) external view returns (uint256)",
  
  // Admin functions (view only for frontend)
  "function paused() external view returns (bool)",
  
  // Events
  "event VCPurchased(address indexed buyer, uint256 vcAmount, uint256 bnbAmount, uint256 pricePerVC, uint256 timestamp, bytes32 indexed purchaseId)",
  "event SecurityEvent(address indexed user, string indexed eventType, string description, uint256 timestamp)",
  "event CircuitBreakerTriggered(uint256 salesAmount, uint256 threshold, uint256 timestamp)",
  "event SaleConfigUpdated(address indexed updater, string indexed field, uint256 oldValue, uint256 newValue, uint256 timestamp)",
  "event UserBlacklisted(address indexed user, address indexed admin, string reason, uint256 timestamp)",
  "event EmergencyAction(address indexed actor, string indexed action, uint256 timestamp)"
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

const GOVERNOR_ABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function getVotes(address account, uint256 blockNumber) view returns (uint256)",
  "function quorum(uint256 blockNumber) view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)"
];

interface Web3ContextType {
  // Connection state
  provider: ethers.JsonRpcProvider | ethers.FallbackProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  chainId: number | undefined;
  metaMaskAvailable: boolean;
  
  // Contracts (memoized)
  vcContract: ethers.Contract | null;
  vgContract: ethers.Contract | null;
  vgVotesContract: ethers.Contract | null;
  lpContract: ethers.Contract | null;
  lpPairContract: ethers.Contract | null;
  lpLockerContract: ethers.Contract | null;
  governorContract: ethers.Contract | null;
  vcsaleContract: ethers.Contract | null; // Added VCSale contract
  
  // Network switching
  switchToTestnet: () => Promise<void>;
  switchToMainnet: () => Promise<void>;
  updateBSCTestnetRPC: () => Promise<boolean>; // Compatibility
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// ✅ Utility function to check MetaMask availability
const checkMetaMaskAvailability = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask === true;
  } catch (error) {
    log.debug('MetaMask check failed', {
      component: 'Web3Context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
};

// Внутренний компонент для работы с Wagmi хуками
const Web3ContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Используем официальные ethers.js адаптеры от Wagmi
  const provider = useEthersProvider();
  const signer = useEthersSigner();

  // ✅ Check MetaMask availability
  const metaMaskAvailable = checkMetaMaskAvailability();

  // ✅ Enhanced network detection with logging
  const isCorrectNetwork = React.useMemo(() => {
    const validChains = [bscTestnet.id, bsc.id]; // 97, 56
    const result = chainId ? validChains.includes(chainId) : false;
    
    log.info('Network detection', {
      component: 'Web3Context',
      currentChainId: chainId,
      validChains,
      isCorrect: result,
      isConnected,
      hasProvider: !!provider
    });
    
    return result;
  }, [chainId, isConnected, provider]);

  // ✅ Integration with rpcService
  useEffect(() => {
    if (provider && provider instanceof ethers.BrowserProvider) {
      rpcService.setWeb3Provider(provider);
      log.info('Web3Context: Provider set in rpcService', {
        component: 'Web3Context',
        hasProvider: true,
        chainId,
        isConnected,
        isCorrectNetwork
      });
    } else {
      rpcService.setWeb3Provider(null);
      log.info('Web3Context: Provider cleared in rpcService', {
        component: 'Web3Context',
        hasProvider: false,
        chainId,
        isConnected,
        reason: !provider ? 'no provider' : 'not BrowserProvider'
      });
    }
  }, [provider, chainId, isConnected, isCorrectNetwork]);

  // ✅ Enhanced MetaMask logging
  useEffect(() => {
    if (!metaMaskAvailable) {
      log.warn('MetaMask not detected', {
        component: 'Web3Context',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        hasEthereum: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
        isMetaMask: typeof window !== 'undefined' && window.ethereum?.isMetaMask,
        ethereumProviders: typeof window !== 'undefined' && window.ethereum ? Object.keys(window.ethereum) : []
      });
    } else {
      log.info('MetaMask detected successfully', {
        component: 'Web3Context',
        version: window.ethereum?.version || 'unknown',
        chainId: chainId || 'not connected'
      });
    }
  }, [metaMaskAvailable, chainId]);

  // ✅ Log connection state changes
  useEffect(() => {
    log.info('Connection state changed', {
      component: 'Web3Context',
      isConnected,
      address: address || 'none',
      chainId: chainId || 'none',
      isCorrectNetwork,
      metaMaskAvailable
    });
  }, [isConnected, address, chainId, isCorrectNetwork, metaMaskAvailable]);

  // Helper function to create contract instances
  const getContract = (address: string, abi: any[]): ethers.Contract | null => {
    if (!signer || !address) return null;
    try {
      return new ethers.Contract(address, abi, signer);
    } catch (error) {
      log.error('Failed to create contract', {
        component: 'Web3Context',
        address,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  };

  // Memoized contracts
  const vcContract = getContract(CONTRACTS.VC_TOKEN, ERC20_ABI);
  const vgContract = getContract(CONTRACTS.VG_TOKEN, ERC20_ABI);
  const vgVotesContract = getContract(CONTRACTS.VG_TOKEN_VOTES, VGVOTES_ABI);
  const lpContract = getContract(CONTRACTS.LP_TOKEN, ERC20_ABI);
  const lpPairContract = getContract(CONTRACTS.LP_TOKEN, PANCAKE_PAIR_ABI);
  const lpLockerContract = getContract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI);
  const governorContract = getContract(CONTRACTS.GOVERNOR, GOVERNOR_ABI);
  const vcsaleContract = getContract(CONTRACTS.VCSALE, VCSALE_ABI); // Added VCSale contract

  // Log VCSale contract creation
  useEffect(() => {
    if (vcsaleContract) {
      log.info('VCSale contract created successfully', {
        component: 'Web3Context',
        contractAddress: CONTRACTS.VCSALE,
        hasContract: !!vcsaleContract,
        chainId,
        isConnected
      });
    }
  }, [vcsaleContract, chainId, isConnected]);

  // Network switching functions
  const switchToTestnet = async () => {
    try {
      await switchChain({ chainId: bscTestnet.id });
      log.info('Switched to BSC Testnet', {
        component: 'Web3Context',
        chainId: bscTestnet.id
      });
    } catch (error) {
      log.error('Failed to switch to testnet', {
        component: 'Web3Context',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const switchToMainnet = async () => {
    try {
      await switchChain({ chainId: bsc.id });
      log.info('Switched to BSC Mainnet', {
        component: 'Web3Context',
        chainId: bsc.id
      });
    } catch (error) {
      log.error('Failed to switch to mainnet', {
        component: 'Web3Context',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  // Compatibility function
  const updateBSCTestnetRPC = async (): Promise<boolean> => {
    // RainbowKit handles RPC automatically
    log.debug('updateBSCTestnetRPC called (compatibility mode)', {
      component: 'Web3Context'
    });
    return true;
  };

  const contextValue: Web3ContextType = {
    provider: provider || null,
    signer: signer || null,
    account: address || null,
    isConnected,
    isCorrectNetwork,
    chainId,
    metaMaskAvailable,
    vcContract,
    vgContract,
    vgVotesContract,
    lpContract,
    lpPairContract,
    lpLockerContract,
    governorContract,
    vcsaleContract, // Added VCSale contract to context
    switchToTestnet,
    switchToMainnet,
    updateBSCTestnetRPC,
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Создаем QueryClient вне компонента
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Главный провайдер
export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={customTheme}
          modalSize="compact"
          showRecentTransactions={true}
        >
          <Web3ContextProvider>
            {children}
          </Web3ContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}; 