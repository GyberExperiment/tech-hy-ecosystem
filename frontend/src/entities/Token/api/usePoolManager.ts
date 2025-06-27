import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther, formatEther, getContract, parseUnits, formatUnits } from 'viem';
import { CONTRACTS, LP_POOL_CONFIG } from '../../../shared/config/contracts';
import type { 
  PoolInfo, 
  LiquidityPosition, 
  AddLiquidityParams, 
  RemoveLiquidityParams,
  SwapError 
} from '../model/types';

// PancakeSwap Factory ABI
const PANCAKE_FACTORY_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" }
    ],
    name: "getPair",
    outputs: [{ internalType: "address", name: "pair", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// PancakeSwap Pair ABI
const PANCAKE_PAIR_ABI = [
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// PancakeSwap Router ABI для ликвидности
const PANCAKE_ROUTER_LIQUIDITY_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amountTokenDesired", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "addLiquidityETH",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "removeLiquidityETH",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

interface PoolManagerState {
  isLoading: boolean;
  isSuccess: boolean;
  error: SwapError | null;
  txHash?: string;
}

export const usePoolManager = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [state, setState] = useState<PoolManagerState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [userPositions, setUserPositions] = useState<LiquidityPosition[]>([]);

  // Получение информации о пуле VC/WBNB
  const getVCPoolInfo = useCallback(async (): Promise<PoolInfo | null> => {
    if (!publicClient) return null;

    try {
      // Получаем адрес пула
      const factory = getContract({
        address: CONTRACTS.PANCAKE_FACTORY as `0x${string}`,
        abi: PANCAKE_FACTORY_ABI,
        client: publicClient,
      });

      const pairAddress = await factory.read.getPair([CONTRACTS.VC_TOKEN, CONTRACTS.WBNB]);
      
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return null; // Пул не существует
      }

      // Получаем информацию о резервах
      const pair = getContract({
        address: pairAddress as `0x${string}`,
        abi: PANCAKE_PAIR_ABI,
        client: publicClient,
      });

      const [reserve0, reserve1] = await pair.read.getReserves();
      const totalSupply = await pair.read.totalSupply();

      const poolData: PoolInfo = {
        address: pairAddress,
        token0: CONTRACTS.VC_TOKEN,
        token1: CONTRACTS.WBNB,
        token0Symbol: 'VC',
        token1Symbol: 'WBNB',
        fee: 0.25, // 0.25% для V2
        liquidity: formatEther(totalSupply),
        tvl: (parseFloat(formatEther(reserve0)) + parseFloat(formatEther(reserve1))).toString(),
        volume24h: '0', // Требует дополнительного API
        apr: 0, // Требует расчета
      };

      return poolData;
    } catch (error) {
      console.error('Error getting pool info:', error);
      return null;
    }
  }, [publicClient]);

  // Получение позиций пользователя
  const getUserPositions = useCallback(async (): Promise<LiquidityPosition[]> => {
    if (!publicClient || !address) return [];

    try {
      const poolData = await getVCPoolInfo();
      if (!poolData) return [];

      const pair = getContract({
        address: poolData.address as `0x${string}`,
        abi: PANCAKE_PAIR_ABI,
        client: publicClient,
      });

      const lpBalance = await pair.read.balanceOf([address]);
      
      if (lpBalance === 0n) return [];

      const [reserve0, reserve1] = await pair.read.getReserves();
      const totalSupply = await pair.read.totalSupply();

      // Рассчитываем долю пользователя
      const userShare = Number(lpBalance) / Number(totalSupply);
      const token0Amount = (Number(reserve0) * userShare).toString();
      const token1Amount = (Number(reserve1) * userShare).toString();

      const position: LiquidityPosition = {
        id: `${poolData.address}-${address}`,
        poolAddress: poolData.address,
        token0Amount: formatEther(BigInt(Math.floor(Number(token0Amount)))),
        token1Amount: formatEther(BigInt(Math.floor(Number(token1Amount)))),
        lpTokenAmount: formatEther(lpBalance),
        value: '0', // Требует расчета в USD
        fees: '0', // Требует дополнительного расчета
      };

      return [position];
    } catch (error) {
      console.error('Error getting user positions:', error);
      return [];
    }
  }, [publicClient, address, getVCPoolInfo]);

  // Добавление ликвидности VC/BNB
  const addLiquidity = useCallback(async (params: {
    vcAmount: string;
    bnbAmount: string;
    slippage: number;
  }) => {
    if (!walletClient || !address) {
      setState(prev => ({ ...prev, error: { code: 'WALLET_NOT_CONNECTED', message: 'Кошелек не подключен' } }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const router = getContract({
        address: CONTRACTS.PANCAKE_ROUTER as `0x${string}`,
        abi: PANCAKE_ROUTER_LIQUIDITY_ABI,
        client: walletClient,
      });

      const vcAmountBN = parseEther(params.vcAmount);
      const bnbAmountBN = parseEther(params.bnbAmount);
      
      // Применяем slippage
      const slippageBN = BigInt(Math.floor(params.slippage * 100));
      const vcAmountMin = (vcAmountBN * (10000n - slippageBN)) / 10000n;
      const bnbAmountMin = (bnbAmountBN * (10000n - slippageBN)) / 10000n;

      const deadline = Math.floor(Date.now() / 1000) + LP_POOL_CONFIG.DEADLINE_MINUTES * 60;

      const txHash = await router.write.addLiquidityETH([
        CONTRACTS.VC_TOKEN as `0x${string}`,
        vcAmountBN,
        vcAmountMin,
        bnbAmountMin,
        address,
        BigInt(deadline)
      ], {
        value: bnbAmountBN,
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSuccess: true, 
        txHash: txHash as string 
      }));

      // Обновляем данные
      const [newPoolInfo, newPositions] = await Promise.all([
        getVCPoolInfo(),
        getUserPositions()
      ]);
      
      if (newPoolInfo) setPoolInfo(newPoolInfo);
      setUserPositions(newPositions);

      return txHash;
    } catch (error: any) {
      const poolError: SwapError = {
        code: error.code || 'ADD_LIQUIDITY_FAILED',
        message: error.message || 'Ошибка при добавлении ликвидности',
        details: error.details
      };
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSuccess: false, 
        error: poolError 
      }));
      
      throw error;
    }
  }, [walletClient, address, getVCPoolInfo, getUserPositions]);

  // Удаление ликвидности
  const removeLiquidity = useCallback(async (params: {
    lpTokenAmount: string;
    slippage: number;
  }) => {
    if (!walletClient || !address) {
      setState(prev => ({ ...prev, error: { code: 'WALLET_NOT_CONNECTED', message: 'Кошелек не подключен' } }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const router = getContract({
        address: CONTRACTS.PANCAKE_ROUTER as `0x${string}`,
        abi: PANCAKE_ROUTER_LIQUIDITY_ABI,
        client: walletClient,
      });

      const liquidity = parseEther(params.lpTokenAmount);
      
      // Применяем slippage (минимальные суммы к получению)
      const slippageBN = BigInt(Math.floor(params.slippage * 100));
      // Здесь нужно рассчитать ожидаемые суммы и применить slippage
      const vcAmountMin = 0n; // Упрощенно, нужен расчет
      const bnbAmountMin = 0n; // Упрощенно, нужен расчет

      const deadline = Math.floor(Date.now() / 1000) + LP_POOL_CONFIG.DEADLINE_MINUTES * 60;

      const txHash = await router.write.removeLiquidityETH([
        CONTRACTS.VC_TOKEN as `0x${string}`,
        liquidity,
        vcAmountMin,
        bnbAmountMin,
        address,
        BigInt(deadline)
      ]);

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSuccess: true, 
        txHash: txHash as string 
      }));

      // Обновляем данные
      const [newPoolInfo, newPositions] = await Promise.all([
        getVCPoolInfo(),
        getUserPositions()
      ]);
      
      if (newPoolInfo) setPoolInfo(newPoolInfo);
      setUserPositions(newPositions);

      return txHash;
    } catch (error: any) {
      const poolError: SwapError = {
        code: error.code || 'REMOVE_LIQUIDITY_FAILED',
        message: error.message || 'Ошибка при удалении ликвидности',
        details: error.details
      };
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSuccess: false, 
        error: poolError 
      }));
      
      throw error;
    }
  }, [walletClient, address, getVCPoolInfo, getUserPositions]);

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      const [poolData, positions] = await Promise.all([
        getVCPoolInfo(),
        getUserPositions()
      ]);
      
      if (poolData) setPoolInfo(poolData);
      setUserPositions(positions);
    };

    if (publicClient) {
      loadData();
    }
  }, [publicClient, getVCPoolInfo, getUserPositions]);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    poolInfo,
    userPositions,
    getVCPoolInfo,
    getUserPositions,
    addLiquidity,
    removeLiquidity,
    resetState,
  };
}; 