import React, { createContext, useContext } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import { config, customTheme } from '../config/rainbowkit';
import { CONTRACTS } from '../constants/contracts';
import { bscTestnet, bsc } from 'wagmi/chains';
import { useEthersProvider, useEthersSigner } from '../utils/ethers';

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
  provider: ethers.JsonRpcProvider | ethers.FallbackProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  chainId: number | undefined;
  
  // Contracts (memoized)
  vcContract: ethers.Contract | null;
  vgContract: ethers.Contract | null;
  vgVotesContract: ethers.Contract | null;
  lpContract: ethers.Contract | null;
  lpPairContract: ethers.Contract | null;
  lpLockerContract: ethers.Contract | null;
  
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

// Внутренний компонент для работы с Wagmi хуками
const Web3ContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Используем официальные ethers.js адаптеры от Wagmi
  const provider = useEthersProvider({ chainId });
  const signer = useEthersSigner({ chainId });

  // Проверяем правильность сети (BSC testnet или mainnet)
  const isCorrectNetwork = chainId === bscTestnet.id || chainId === bsc.id;

  // Helper function to create contract instances
  const getContract = (address: string, abi: any[]): ethers.Contract | null => {
    if (!signer || !address) return null;
    try {
      return new ethers.Contract(address, abi, signer);
    } catch (error) {
      console.error('Failed to create contract:', error);
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

  // Network switching functions
  const switchToTestnet = async () => {
    try {
      await switchChain({ chainId: bscTestnet.id });
    } catch (error) {
      console.error('Failed to switch to testnet:', error);
    }
  };

  const switchToMainnet = async () => {
    try {
      await switchChain({ chainId: bsc.id });
    } catch (error) {
      console.error('Failed to switch to mainnet:', error);
    }
  };

  // Compatibility function
  const updateBSCTestnetRPC = async (): Promise<boolean> => {
    // RainbowKit handles RPC automatically
    return true;
  };

  const contextValue: Web3ContextType = {
    provider,
    signer,
    account: address || null,
    isConnected,
    isCorrectNetwork,
    chainId,
    vcContract,
    vgContract,
    vgVotesContract,
    lpContract,
    lpPairContract,
    lpLockerContract,
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