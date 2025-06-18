import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { CONTRACTS } from '../constants/contracts';
import { log } from '../utils/logger';
import { getAllRpcEndpoints } from '../constants/rpcEndpoints';
import { rpcService } from '../services/rpcService';

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
  updateBSCTestnetRPC: () => Promise<boolean>;
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
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [isUpdatingRPC, setIsUpdatingRPC] = useState(false);
  const [lockedProvider, setLockedProvider] = useState<any>(null);
  
  // ✅ Используем Map для хранения времени последних запросов
  const [pendingRequests] = useState(new Map<string, number>());

  // EIP-6963 hooks
  const preferredProvider = usePreferredProvider();

  const createRequestGuard = (requestType: string) => {
    const key = `${requestType}_${Date.now()}`;
    const TIMEOUT = 15000; // ✅ Увеличиваем timeout до 15 секунд
    
    return {
      canProceed: () => {
        const now = Date.now();
        const lastRequest = pendingRequests.get(requestType);
        
        // ✅ Проверяем что прошло достаточно времени с последнего запроса
        if (lastRequest && (now - lastRequest) < TIMEOUT) {
          log.debug('Request blocked by guard - too soon', {
            component: 'Web3Context',
            function: 'createRequestGuard',
            requestType,
            timeSinceLastRequest: now - lastRequest,
            timeout: TIMEOUT
          });
          return false;
        }
        
        return true;
      },
      start: () => {
        pendingRequests.set(requestType, Date.now());
        log.debug('Request guard started', {
          component: 'Web3Context',
          function: 'createRequestGuard',
          requestType,
          key
        });
      },
      end: () => {
        // ✅ Очищаем guard только через небольшую задержку для предотвращения race conditions
        setTimeout(() => {
          pendingRequests.delete(requestType);
          log.debug('Request guard ended', {
            component: 'Web3Context',
            function: 'createRequestGuard',
            requestType,
            key
          });
        }, 1000); // 1 секунда задержка
      }
    };
  };

  // BSC Testnet configuration
  const BSC_TESTNET_CONFIG = {
    chainId: '0x61', // 97 in hex
    chainName: 'BSC Testnet',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    rpcUrls: getAllRpcEndpoints(), // ✅ Use centralized RPC endpoints
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  };

  /**
   * Get the best available Ethereum provider
   * Uses EIP-6963 first, then falls back to legacy detection
   */
  const getEthereumProvider = (): EIP1193Provider | null => {
    // Если кошелёк уже выбран – всегда возвращаем его
    if (lockedProvider) return lockedProvider;

    // 🧪 ВРЕМЕННО: Принудительно используем legacy для тестирования Arc browser popup проблемы
    const forceLegacy = localStorage.getItem('forceLegacyProvider') === 'true';
    if (forceLegacy) {
      if (process.env.NODE_ENV === 'development') {
        log.debug('FORCE LEGACY MODE - Using window.ethereum directly', { 
          component: 'Web3Context',
          function: 'getEthereumProvider'
        });
      }
      const legacyProvider = detectLegacyProvider();
      if (legacyProvider) {
        return legacyProvider;
      }
    }

    // 1. Try EIP-6963 preferred provider (MetaMask prioritized)
    if (preferredProvider) {
      if (process.env.NODE_ENV === 'development') {
        log.debug('Using EIP-6963 provider', {
          component: 'Web3Context',
          function: 'getEthereumProvider',
          providerName: preferredProvider.info.name,
          providerRdns: preferredProvider.info.rdns
        });
      }
      return preferredProvider.provider;
    }

    // 2. Fallback to legacy detection
    const legacyProvider = detectLegacyProvider();
    if (legacyProvider) {
      if (process.env.NODE_ENV === 'development') {
        log.debug('Using legacy provider detection', { 
          component: 'Web3Context',
          function: 'getEthereumProvider'
        });
      }
      return legacyProvider;
    }

    log.warn('No Ethereum provider found', { 
      component: 'Web3Context',
      function: 'getEthereumProvider'
    });
    return null;
  };

  // Helper function to create contract instances
  const getContract = (address: string, abi: any[]): ethers.Contract | null => {
    if (!signer || !account) return null;
    try {
      return new ethers.Contract(address, abi, signer);
    } catch (error) {
      log.error('Failed to create contract', {
        component: 'Web3Context',
        function: 'getContract',
        address,
        account
      }, error as Error);
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
    // ✅ ЗАЩИТА ОТ REACT STRICTMODE: Предотвращаем множественные вызовы подключения
    const guard = createRequestGuard('wallet_connect');
    
    if (!guard.canProceed()) {
      log.debug('Wallet connection already in progress', {
        component: 'Web3Context',
        function: 'connectWallet'
      });
      return;
    }

    guard.start();
    
    try {
      const ethereum = getEthereumProvider();
      if (!ethereum) {
        toast.error('MetaMask не найден');
        return;
      }

      // ✅ Улучшенная проверка ethereum объекта перед созданием BrowserProvider
      if (!ethereum || typeof ethereum !== 'object') {
        throw new Error('Invalid ethereum provider object');
      }

      // Проверяем наличие необходимых методов
      if (typeof ethereum.request !== 'function') {
        throw new Error('Ethereum provider missing request method');
      }

      // Получаем аккаунты
      let accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
      
      if (!accounts || accounts.length === 0) {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
        if (!accounts || accounts.length === 0) {
          toast.error('Подключение отменено пользователем');
          return;
        }
      }

      let ethProvider: ethers.BrowserProvider;
      try {
        ethProvider = new ethers.BrowserProvider(ethereum);
      } catch (providerError: any) {
        log.error('Failed to create BrowserProvider', {
          component: 'Web3Context',
          function: 'connectWallet',
          ethereumType: typeof ethereum,
          hasRequest: typeof ethereum.request === 'function'
        }, providerError);
        throw new Error(`MetaMask provider initialization failed: ${providerError.message}`);
      }

      const ethSigner = await ethProvider.getSigner();
      const network = await ethProvider.getNetwork();
      
      setProvider(ethProvider);
      setSigner(ethSigner);
      setAccount(accounts[0] || null);
      setIsConnected(true);
      setIsCorrectNetwork(Number(network.chainId) === 97); // BSC Testnet chainId
      setLockedProvider(ethereum); // 🔒 фиксируем провайдер
      
      // ✅ Синхронизируем с RPC сервисом
      rpcService.setWeb3Provider(ethProvider);
      
      log.info('Wallet connected successfully', {
        component: 'Web3Context',
        function: 'connectWallet',
        address: accounts[0],
        network: network.name,
        chainId: Number(network.chainId)
      });
      
      toast.success('Кошелёк подключён!');
      
      // ✅ НЕ ВЫЗЫВАЕМ АВТОМАТИЧЕСКИ RPC UPDATE ЧТОБЫ НЕ ОТКРЫВАТЬ MODAL
      // Пользователь может обновить RPC вручную если нужно
      if (Number(network.chainId) !== 97) {
        toast.error('Переключитесь на BSC Testnet');
      }
    } catch (error: any) {
      log.error('Wallet connection failed', {
        component: 'Web3Context',
        function: 'connectWallet'
      }, error);
      
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
        log.error('Detailed connection error', {
          component: 'Web3Context',
          function: 'connectWallet',
          errorCode: error.code,
          errorMessage: error.message,
          errorData: error.data
        });
        toast.error('Ошибка подключения к кошельку. Проверьте MetaMask.');
      }
    } finally {
      guard.end();
    }
  };

  const disconnectWallet = () => {
    log.info('Wallet disconnected', {
      component: 'Web3Context',
      function: 'disconnectWallet',
      address: account
    });
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setLockedProvider(null);
    
    // ✅ Синхронизируем с RPC сервисом
    rpcService.setWeb3Provider(null);
    
    toast.success('Кошелёк отключён');
  };

  const switchNetwork = async () => {
    // ✅ УЛУЧШЕННАЯ ЗАЩИТА: Используем requestGuard для предотвращения дублирующихся запросов
    const guard = createRequestGuard('wallet_switchEthereumChain');
    
    if (!guard.canProceed() || isSwitchingNetwork) {
      return;
    }

    const ethereum = getEthereumProvider();
    if (!ethereum) {
      toast.error('MetaMask не найден');
      return;
    }

    setIsSwitchingNetwork(true);
    guard.start();
    
    try {
      // Сначала пытаемся переключиться на BSC Testnet
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // BSC Testnet chainId in hex
      });
      
      log.info('Successfully switched to BSC Testnet', {
        component: 'Web3Context',
        function: 'switchNetwork'
      });
      
    } catch (switchError: any) {
      // ✅ Проверяем код ошибки для правильной обработки
      if (switchError.code === 4902) {
        // Сеть не найдена - добавляем с правильным RPC
        const addGuard = createRequestGuard('wallet_addEthereumChain');
        
        if (addGuard.canProceed()) {
          addGuard.start();
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
            toast.success('BSC Testnet добавлен с обновленными RPC!');
          } catch (addError: any) {
            // ✅ Обрабатываем ошибку "already pending"
            if (addError.code === -32002) {
              toast.error('Запрос уже обрабатывается. Пожалуйста, проверьте MetaMask.');
            } else {
              log.error('Failed to add BSC Testnet network', {
                component: 'Web3Context',
                function: 'switchNetwork',
                network: 'BSC_TESTNET'
              }, addError as Error);
              toast.error('Ошибка добавления BSC Testnet');
            }
          } finally {
            addGuard.end();
          }
        }
      } else if (switchError.code === -32002) {
        // ✅ Уже есть pending запрос
        toast.error('Запрос уже обрабатывается. Пожалуйста, проверьте MetaMask.');
      } else {
        log.warn('Network switch failed', {
          component: 'Web3Context',
          function: 'switchNetwork',
          errorCode: switchError.code,
          errorMessage: switchError.message
        });
        toast.error('Ошибка переключения сети. Попробуйте вручную в MetaMask.');
      }
    } finally {
      setIsSwitchingNetwork(false);
      guard.end();
    }
  };

  const updateBSCTestnetRPC = async (): Promise<boolean> => {
    // ✅ УЛУЧШЕННАЯ ЗАЩИТА: Используем requestGuard для предотвращения дублирующихся запросов
    const guard = createRequestGuard('wallet_addEthereumChain_update');
    
    if (!guard.canProceed() || isUpdatingRPC) {
      return false;
    }

    const ethereum = getEthereumProvider();
    if (!ethereum) return false;

    setIsUpdatingRPC(true);
    guard.start();
    
    try {
      log.info('Updating BSC Testnet RPC endpoints', {
        component: 'Web3Context',  
        function: 'updateBSCTestnetRPC',
        network: 'BSC_TESTNET'
      });
      
      // ✅ ТИХОЕ ОБНОВЛЕНИЕ БЕЗ МОДАЛЬНОГО ОКНА
      // Сначала проверяем текущую сеть
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x61') {
        // Не в BSC Testnet - не обновляем RPC
        log.debug('Not on BSC Testnet, skipping RPC update', {
          component: 'Web3Context',
          function: 'updateBSCTestnetRPC',
          currentChainId: chainId
        });
        return false;
      }

      // ✅ Обновляем RPC только если пользователь УЖЕ в BSC Testnet
      // Это не откроет modal, так как сеть уже добавлена
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: BSC_TESTNET_CONFIG.chainId,
            chainName: BSC_TESTNET_CONFIG.chainName,
            nativeCurrency: BSC_TESTNET_CONFIG.nativeCurrency,
            rpcUrls: BSC_TESTNET_CONFIG.rpcUrls, // ✅ Новые рабочие RPC
            blockExplorerUrls: BSC_TESTNET_CONFIG.blockExplorerUrls,
          },
        ],
      });
      
      log.info('BSC Testnet RPC endpoints updated successfully', {
        component: 'Web3Context',
        function: 'updateBSCTestnetRPC',
        rpcUrls: BSC_TESTNET_CONFIG.rpcUrls
      });
      
      return true;
    } catch (error: any) {
      // ✅ Специальная обработка для pending запросов
      if (error.code === -32002) {
        log.debug('RPC update request already pending - this is expected', {
          component: 'Web3Context',
          function: 'updateBSCTestnetRPC',
          network: 'BSC_TESTNET'
        });
        return false; // Не показываем ошибку пользователю
      }
      
      log.error('Failed to update BSC Testnet RPC endpoints', {
        component: 'Web3Context',
        function: 'updateBSCTestnetRPC',
        network: 'BSC_TESTNET',
        errorCode: error.code,
        errorMessage: error.message
      }, error);
      // ✅ Тихо игнорируем ошибки обновления RPC
      return false;
    } finally {
      setIsUpdatingRPC(false);
      guard.end();
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
        if (process.env.NODE_ENV === 'development') {
          log.debug('Account changed', {
            component: 'Web3Context',
            function: 'handleAccountsChanged',
            newAccount: accounts[0],
            previousAccount: account
          });
        }
        setAccount(accounts[0] || null);
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      if (process.env.NODE_ENV === 'development') {
        log.debug('Chain changed', {
          component: 'Web3Context',
          function: 'handleChainChanged',
          newChainId,
          isCorrectNetwork: newChainId === 97
        });
      }
      setIsCorrectNetwork(newChainId === 97);
      
      if (newChainId === 97) {
        toast.success('Переключено на BSC Testnet!');
      } else {
        toast.error('Переключитесь на BSC Testnet');
      }
    };

    const handleDisconnect = () => {
      if (process.env.NODE_ENV === 'development') {
        log.debug('Provider disconnected', {
          component: 'Web3Context',
          function: 'handleDisconnect'
        });
      }
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
      log.error('Failed to attach event listeners', {
        component: 'Web3Context',
        function: 'useEffect'
      }, error as Error);
    }

    return () => {
      try {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('disconnect', handleDisconnect);
        }
      } catch (error) {
        log.error('Failed to remove event listeners', {
          component: 'Web3Context',
          function: 'useEffect-cleanup'
        }, error as Error);
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
    updateBSCTestnetRPC,
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