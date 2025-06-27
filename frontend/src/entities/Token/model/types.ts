export interface SwapParams {
  amountIn: string;
  amountOutMin: string;
  path: string[];
  to: string;
  deadline: number;
}

export interface BuyVCParams {
  bnbAmount: string;
  slippage: number;
  recipient: string;
  version?: SwapVersion;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  path: string[];
  priceImpact: number;
}

export interface SwapError {
  code: string;
  message: string;
  details?: string;
}

export type SwapMode = 'bnb' | 'usdt';
export type SwapVersion = 'v2' | 'v3';

export interface SwapState {
  isLoading: boolean;
  isSuccess: boolean;
  error: SwapError | null;
  txHash?: string;
}

// Pool Management Types
export interface PoolInfo {
  address: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  fee: number;
  liquidity: string;
  tvl: string;
  volume24h: string;
  apr: number;
}

export interface LiquidityPosition {
  id: string;
  poolAddress: string;
  token0Amount: string;
  token1Amount: string;
  lpTokenAmount: string;
  value: string;
  fees: string;
}

export interface AddLiquidityParams {
  token0: string;
  token1: string;
  amount0: string;
  amount1: string;
  amount0Min: string;
  amount1Min: string;
  deadline: number;
  recipient: string;
}

export interface RemoveLiquidityParams {
  token0: string;
  token1: string;
  lpTokenAmount: string;
  amount0Min: string;
  amount1Min: string;
  deadline: number;
  recipient: string;
} 