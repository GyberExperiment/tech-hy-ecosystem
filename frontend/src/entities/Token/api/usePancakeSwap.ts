import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther, formatEther, getContract } from 'viem';
import { CONTRACTS, LP_POOL_CONFIG } from '../../../shared/config/contracts';
import type { BuyVCParams, SwapQuote, SwapState, SwapError, SwapVersion } from '../model/types';

const USDT_ADDRESS = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'; // BSC Testnet USDT

// PancakeSwap V2 Router ABI (только нужные функции)
const PANCAKE_ROUTER_V2_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" }
    ],
    name: "getAmountsOut",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "swapExactETHForTokens",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// PancakeSwap V3 Router ABI (Smart Router)
const PANCAKE_ROUTER_V3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "bytes", name: "path", type: "bytes" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" }
        ],
        internalType: "struct IV3SwapRouter.ExactInputParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "exactInput",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  }
] as const;

// V3 Smart Router адрес для BSC
const PANCAKE_V3_ROUTER = '0x1b81D678ffb9C0263b24A97847620C99d213eB14'; // BSC Testnet V3 Router

export const usePancakeSwap = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [state, setState] = useState<SwapState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  // Расчет цены VC за BNB (V2)
  const getVCQuoteV2 = useCallback(async (bnbAmount: string): Promise<SwapQuote | null> => {
    if (!publicClient || !bnbAmount || parseFloat(bnbAmount) <= 0) return null;

    try {
      const router = getContract({
        address: CONTRACTS.PANCAKE_ROUTER as `0x${string}`,
        abi: PANCAKE_ROUTER_V2_ABI,
        client: publicClient,
      });

      const amountIn = parseEther(bnbAmount);
      const path = [CONTRACTS.WBNB, CONTRACTS.VC_TOKEN];

      const amounts = await router.read.getAmountsOut([amountIn, path]);
      const amountOut = amounts[1];

      if (!amountOut) {
        throw new Error('Не удалось получить котировку');
      }

      return {
        amountIn: bnbAmount,
        amountOut: formatEther(amountOut),
        path,
        priceImpact: 0, // Упрощенно, можно доработать
      };
    } catch (error) {
      console.error('Error getting VC quote V2:', error);
      return null;
    }
  }, [publicClient]);

  // Расчет цены VC за BNB (общий)
  const getVCQuote = useCallback(async (bnbAmount: string, version: SwapVersion = 'v2'): Promise<SwapQuote | null> => {
    if (version === 'v2') {
      return getVCQuoteV2(bnbAmount);
    }
    // V3 котировки можно добавить позже
    return getVCQuoteV2(bnbAmount);
  }, [getVCQuoteV2]);

  // BNB → VC swap V2
  const buyVCWithBNBV2 = useCallback(async (params: BuyVCParams) => {
    if (!walletClient || !address) {
      setState(prev => ({ ...prev, error: { code: 'WALLET_NOT_CONNECTED', message: 'Кошелек не подключен' } }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const router = getContract({
        address: CONTRACTS.PANCAKE_ROUTER as `0x${string}`,
        abi: PANCAKE_ROUTER_V2_ABI,
        client: walletClient,
      });

      const amountIn = parseEther(params.bnbAmount);
      const path = [CONTRACTS.WBNB, CONTRACTS.VC_TOKEN];
      
      // Получаем ожидаемое количество VC
      const amounts = await getVCQuoteV2(params.bnbAmount);
      if (!amounts) {
        throw new Error('Не удалось получить котировку');
      }

      // Применяем slippage
      const slippageBN = BigInt(Math.floor(params.slippage * 100)); // 0.5% = 50
      const amountOutMin = (parseEther(amounts.amountOut) * (10000n - slippageBN)) / 10000n;

      // Deadline - 20 минут
      const deadline = Math.floor(Date.now() / 1000) + LP_POOL_CONFIG.DEADLINE_MINUTES * 60;

      // Выполняем swap
      const txHash = await router.write.swapExactETHForTokens([
        amountOutMin,
        path,
        params.recipient as `0x${string}`,
        BigInt(deadline)
      ], {
        value: amountIn,
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSuccess: true, 
        txHash: txHash as string 
      }));

      return txHash;
    } catch (error: any) {
      const swapError: SwapError = {
        code: error.code || 'SWAP_FAILED',
        message: error.message || 'Ошибка при выполнении swap',
        details: error.details
      };
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSuccess: false, 
        error: swapError 
      }));
      
      throw error;
    }
  }, [walletClient, address, getVCQuoteV2]);

  // BNB → VC swap (общий)
  const buyVCWithBNB = useCallback(async (params: BuyVCParams & { version?: SwapVersion }) => {
    const version = params.version || 'v2';
    
    if (version === 'v2') {
      return buyVCWithBNBV2(params);
    }
    
    // V3 пока не реализован, используем V2
    return buyVCWithBNBV2(params);
  }, [buyVCWithBNBV2]);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getVCQuote,
    getVCQuoteV2,
    buyVCWithBNB,
    buyVCWithBNBV2,
    resetState,
  };
}; 