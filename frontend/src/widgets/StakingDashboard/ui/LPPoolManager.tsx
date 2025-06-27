import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { CONTRACTS, LP_POOL_CONFIG } from '../../../shared/config/contracts';
import { Calculator, Plus, Minus, AlertTriangle, Info, RefreshCw, BarChart3, TrendingUp, Activity, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton as PoolInfoSkeleton } from '../../../shared/ui/LoadingSkeleton';
import { log } from '../../../shared/lib/logger';
import { cn } from '../../../shared/lib/cn';

// PancakeSwap Pair ABI (для работы с LP парами)
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

// PancakeSwap Router ABI (minimal)
const PANCAKE_ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)"
];

// PancakeSwap Factory ABI (minimal)
const PANCAKE_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

interface PoolInfo {
  reserve0: string;
  reserve1: string;
  token0: string;
  token1: string;
  totalSupply: string;
  userLPBalance: string;
  userVCBalance: string;
  userBNBBalance: string;
  vcPrice: string;
  bnbPrice: string;
}

interface LiquidityCalculation {
  vcAmount: string;
  bnbAmount: string;
  lpTokensToReceive: string;
  priceImpact: number;
  shareOfPool: number;
}

const LPPoolManager: React.FC = () => {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    vcContract,
    lpContract,
    provider,
    signer,
    connectWallet,
    switchNetwork
  } = useWeb3();

  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  
  // Add liquidity state
  const [vcInput, setVcInput] = useState('');
  const [bnbInput, setBnbInput] = useState('');
  const [slippage, setSlippage] = useState(LP_POOL_CONFIG.DEFAULT_SLIPPAGE);
  const [calculation, setCalculation] = useState<LiquidityCalculation | null>(null);
  
  // Remove liquidity state
  const [lpTokensInput, setLpTokensInput] = useState('');
  const [removePercentage, setRemovePercentage] = useState(25);

  // Approvals state
  const [vcApproved, setVcApproved] = useState(false);
  const [lpApproved, setLpApproved] = useState(false);

  // Create contract instances locally
  const pancakeRouterContract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACTS.PANCAKE_ROUTER, PANCAKE_ROUTER_ABI, signer);
  }, [signer]);

  const pancakeFactoryContract = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(CONTRACTS.PANCAKE_FACTORY, PANCAKE_FACTORY_ABI, provider);
  }, [provider]);

  // Auto-fetch pool info when wallet connects
  useEffect(() => {
    if (account && isConnected && isCorrectNetwork) {
      fetchPoolInfo();
      checkApprovals();
    }
  }, [account, isConnected, isCorrectNetwork]);

  // Auto-calculate liquidity when inputs change
  useEffect(() => {
    if (vcInput && bnbInput && poolInfo && parseFloat(vcInput) > 0 && parseFloat(bnbInput) > 0) {
      calculateLiquidity();
    } else {
      setCalculation(null);
    }
  }, [vcInput, bnbInput, poolInfo]);

  // Auto-check approvals when inputs change
  useEffect(() => {
    if (account && vcInput && parseFloat(vcInput) > 0) {
      checkVCApproval();
    }
  }, [account, vcInput]);

  useEffect(() => {
    if (account && lpTokensInput && parseFloat(lpTokensInput) > 0) {
      checkLPApproval();
    }
  }, [account, lpTokensInput]);

  const fetchPoolInfo = async () => {
    if (!account || !isConnected || !lpContract || !vcContract || !provider || !pancakeFactoryContract) return;
    
    try {
      setLoading(true);
      
      // Get LP pair address from PancakeSwap factory with enhanced error handling
      let pairAddress: string;
      try {
        log.info('Fetching LP pair address', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo',
          vcToken: CONTRACTS.VC_TOKEN,
          wbnb: CONTRACTS.WBNB,
          factory: CONTRACTS.PANCAKE_FACTORY
        });
        
        // First verify factory contract exists
        const factoryCode = await provider.getCode(CONTRACTS.PANCAKE_FACTORY);
        if (factoryCode === '0x') {
          throw new Error('PancakeSwap Factory контракт не найден по адресу: ' + CONTRACTS.PANCAKE_FACTORY);
        }
        
        pairAddress = await (pancakeFactoryContract as any).getPair(CONTRACTS.VC_TOKEN, CONTRACTS.WBNB);
        
        if (!pairAddress || pairAddress === ethers.ZeroAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
          log.warn('LP pool not found or not created', {
            component: 'LPPoolManager',
            function: 'fetchPoolInfo',
            pairAddress
          });
          toast.error('LP пул не найден. Возможно, ликвидность ещё не добавлена.');
          
          // Set minimal fallback data
          setPoolInfo({
            reserve0: '0',
            reserve1: '0',
            token0: CONTRACTS.VC_TOKEN,
            token1: CONTRACTS.WBNB,
            totalSupply: '0',
            userLPBalance: '0',
            userVCBalance: '0',
            userBNBBalance: '0',
            vcPrice: '0',
            bnbPrice: '0',
          });
          return;
        }
        
        log.info('LP pair found', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo',
          pairAddress
        });
      } catch (error: any) {
        log.error('Failed to get pair address', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo',
          factory: CONTRACTS.PANCAKE_FACTORY
        }, error);
        
        // Enhanced error handling based on error type
        if (error.message.includes('could not decode result data')) {
          toast.error('Ошибка декодирования данных Factory. Возможно неправильный адрес контракта.');
        } else if (error.message.includes('contract not found')) {
          toast.error('Factory контракт не найден. Проверьте адрес.');
        } else {
          toast.error('Ошибка получения адреса LP пула. Проверьте подключение к сети.');
        }
        
        // Set fallback data and exit
        setPoolInfo({
          reserve0: '0',
          reserve1: '0',
          token0: CONTRACTS.VC_TOKEN,
          token1: CONTRACTS.WBNB,
          totalSupply: '0',
          userLPBalance: '0',
          userVCBalance: '0',
          userBNBBalance: '0',
          vcPrice: '0',
          bnbPrice: '0',
        });
        return;
      }
      
      // Create LP pair contract for getReserves calls
      const lpPairContract: any = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, provider);
      
      // Get pool data with enhanced error handling and retries
      let reserves, token0, token1, totalSupply;
      let userLPBalance, userVCBalance, userBNBBalance;

      try {
        log.info('Fetching pool reserves', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo',
          pairAddress
        });
        // Get pool reserves from pair contract with timeout
        const poolDataPromise = Promise.all([
          lpPairContract.getReserves(),
          lpPairContract.token0(),
          lpPairContract.token1(),
          lpPairContract.totalSupply()
        ]);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout fetching pool data')), 10000)
        );
        
        [reserves, token0, token1, totalSupply] = await Promise.race([poolDataPromise, timeoutPromise]) as any;
        
        log.info('Pool data fetched successfully', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo',
          reserves: reserves.toString(),
          token0,
          token1,
          totalSupply: totalSupply.toString()
        });
      } catch (error: any) {
        log.error('Failed to fetch pool data', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo',
          pairAddress
        }, error);
        toast.error('Ошибка получения данных пула. Попробуйте обновить страницу.');
        
        // Use fallback values but continue to get user balances
        reserves = [0n, 0n, 0];
        token0 = CONTRACTS.VC_TOKEN;
        token1 = CONTRACTS.WBNB;
        totalSupply = 0n;
      }

      // Get user balances
      try {
        const balancePromises = [
          (lpContract as any)?.balanceOf(account),
          (vcContract as any)?.balanceOf(account),
          provider.getBalance(account)
        ];

        [userLPBalance, userVCBalance, userBNBBalance] = await Promise.all(balancePromises);
        
        log.info('User balances fetched', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo',
          userLPBalance: userLPBalance.toString(),
          userVCBalance: userVCBalance.toString(),
          userBNBBalance: userBNBBalance.toString()
        });
      } catch (error: any) {
        log.error('Failed to fetch user balances', {
          component: 'LPPoolManager',
          function: 'fetchPoolInfo'
        }, error);
        
        // Use fallback values
        userLPBalance = 0n;
        userVCBalance = 0n;
        userBNBBalance = 0n;
      }

      // Calculate prices
      const reserve0Formatted = ethers.formatEther(reserves[0]);
      const reserve1Formatted = ethers.formatEther(reserves[1]);
      
      let vcPrice = '0';
      let bnbPrice = '0';
      
      if (parseFloat(reserve0Formatted) > 0 && parseFloat(reserve1Formatted) > 0) {
        // Determine which token is which based on token addresses
        if (token0.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase()) {
          // token0 is VC, token1 is WBNB
          vcPrice = (parseFloat(reserve1Formatted) / parseFloat(reserve0Formatted)).toFixed(8);
          bnbPrice = (parseFloat(reserve0Formatted) / parseFloat(reserve1Formatted)).toFixed(2);
        } else {
          // token0 is WBNB, token1 is VC
          vcPrice = (parseFloat(reserve0Formatted) / parseFloat(reserve1Formatted)).toFixed(8);
          bnbPrice = (parseFloat(reserve1Formatted) / parseFloat(reserve0Formatted)).toFixed(2);
        }
      }

      setPoolInfo({
        reserve0: reserve0Formatted,
        reserve1: reserve1Formatted,
        token0,
        token1,
        totalSupply: ethers.formatEther(totalSupply),
        userLPBalance: ethers.formatEther(userLPBalance),
        userVCBalance: ethers.formatEther(userVCBalance),
        userBNBBalance: ethers.formatEther(userBNBBalance),
        vcPrice,
        bnbPrice,
      });

    } catch (error: any) {
      log.error('Failed to fetch pool info', {
        component: 'LPPoolManager',
        function: 'fetchPoolInfo'
      }, error);
      toast.error('Ошибка загрузки информации о пуле');
    } finally {
      setLoading(false);
    }
  };

  const calculateLiquidity = async () => {
    if (!poolInfo || !vcInput || !bnbInput) return;

    try {
      const vcAmount = parseFloat(vcInput);
      const bnbAmount = parseFloat(bnbInput);
      
      if (vcAmount <= 0 || bnbAmount <= 0) return;

      const reserve0 = parseFloat(poolInfo.reserve0);
      const reserve1 = parseFloat(poolInfo.reserve1);
      const totalSupply = parseFloat(poolInfo.totalSupply);
      
      if (reserve0 === 0 || reserve1 === 0) {
        // First liquidity provision
        const lpTokens = Math.sqrt(vcAmount * bnbAmount);
        setCalculation({
          vcAmount: vcInput,
          bnbAmount: bnbInput,
          lpTokensToReceive: lpTokens.toFixed(6),
          priceImpact: 0,
          shareOfPool: 100
        });
        return;
      }

      // Calculate optimal amounts based on current ratio
      let optimalVcAmount, optimalBnbAmount;
      
      // Determine which token is which
      if (poolInfo.token0.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase()) {
        // token0 is VC, token1 is BNB
        const ratio = reserve1 / reserve0; // BNB per VC
        optimalBnbAmount = vcAmount * ratio;
        optimalVcAmount = bnbAmount / ratio;
      } else {
        // token0 is BNB, token1 is VC
        const ratio = reserve0 / reserve1; // BNB per VC
        optimalBnbAmount = vcAmount * ratio;
        optimalVcAmount = bnbAmount / ratio;
      }

      // Use the limiting factor
      const finalVcAmount = Math.min(vcAmount, optimalVcAmount);
      const finalBnbAmount = Math.min(bnbAmount, optimalBnbAmount);

      // Calculate LP tokens to receive
      const lpTokens = Math.min(
        (finalVcAmount / reserve0) * totalSupply,
        (finalBnbAmount / reserve1) * totalSupply
      );

      // Calculate price impact
      const priceImpact = Math.abs((finalVcAmount / reserve0) * 100);
      
      // Calculate share of pool
      const shareOfPool = (lpTokens / (totalSupply + lpTokens)) * 100;

      setCalculation({
        vcAmount: finalVcAmount.toFixed(6),
        bnbAmount: finalBnbAmount.toFixed(6),
        lpTokensToReceive: lpTokens.toFixed(6),
        priceImpact,
        shareOfPool
      });

    } catch (error: any) {
      log.error('Failed to calculate liquidity', {
        component: 'LPPoolManager',
        function: 'calculateLiquidity'
      }, error);
    }
  };

  const checkApprovals = async () => {
    if (!account || !vcContract || !lpContract) return;

    try {
      await Promise.all([
        checkVCApproval(),
        checkLPApproval()
      ]);
    } catch (error: any) {
      log.error('Failed to check approvals', {
        component: 'LPPoolManager',
        function: 'checkApprovals'
      }, error);
    }
  };

  const checkVCApproval = async () => {
    if (!account || !vcContract) return;

    try {
      const allowance = await (vcContract as any)?.allowance(account, CONTRACTS.PANCAKE_ROUTER);
      const requiredAmount = vcInput ? ethers.parseEther(vcInput) : 0n;
      setVcApproved(allowance >= requiredAmount && requiredAmount > 0n);
    } catch (error: any) {
      log.error('Failed to check VC approval', {
        component: 'LPPoolManager',
        function: 'checkVCApproval'
      }, error);
      setVcApproved(false);
    }
  };

  const checkLPApproval = async () => {
    if (!account || !lpContract) return;

    try {
      const allowance = await (lpContract as any)?.allowance(account, CONTRACTS.PANCAKE_ROUTER);
      const requiredAmount = lpTokensInput ? ethers.parseEther(lpTokensInput) : 0n;
      setLpApproved(allowance >= requiredAmount && requiredAmount > 0n);
    } catch (error: any) {
      log.error('Failed to check LP approval', {
        component: 'LPPoolManager',
        function: 'checkLPApproval'
      }, error);
      setLpApproved(false);
    }
  };

  const approveVC = async () => {
    if (!vcContract || !account) return;

    try {
      const amount = ethers.parseEther(vcInput);
      const tx = await (vcContract as any)?.approve(CONTRACTS.PANCAKE_ROUTER, amount);
      
      toast.loading('Approving VC tokens...', { id: 'approve-vc' });
      await tx.wait();
      
      setVcApproved(true);
      toast.success('VC tokens approved!', { id: 'approve-vc' });
    } catch (error: any) {
      log.error('Failed to approve VC', {
        component: 'LPPoolManager',
        function: 'approveVC'
      }, error);
      toast.error('Failed to approve VC tokens', { id: 'approve-vc' });
    }
  };

  const approveLP = async () => {
    if (!lpContract || !account) return;

    try {
      const amount = ethers.parseEther(lpTokensInput);
      const tx = await (lpContract as any)?.approve(CONTRACTS.PANCAKE_ROUTER, amount);
      
      toast.loading('Approving LP tokens...', { id: 'approve-lp' });
      await tx.wait();
      
      setLpApproved(true);
      toast.success('LP tokens approved!', { id: 'approve-lp' });
    } catch (error: any) {
      log.error('Failed to approve LP', {
        component: 'LPPoolManager',
        function: 'approveLP'
      }, error);
      toast.error('Failed to approve LP tokens', { id: 'approve-lp' });
    }
  };

  const addLiquidity = async () => {
    if (!pancakeRouterContract || !calculation || !account) return;

    try {
      const vcAmount = ethers.parseEther(calculation.vcAmount);
      const bnbAmount = ethers.parseEther(calculation.bnbAmount);
      
      // Calculate minimum amounts with slippage
      const minVcAmount = vcAmount * BigInt(Math.floor((100 - slippage) * 100)) / 10000n;
      const minBnbAmount = bnbAmount * BigInt(Math.floor((100 - slippage) * 100)) / 10000n;
      
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      const tx = await (pancakeRouterContract as any)?.addLiquidityETH(
        CONTRACTS.VC_TOKEN,
        vcAmount,
        minVcAmount,
        minBnbAmount,
        account,
        deadline,
        { value: bnbAmount }
      );

      toast.loading('Adding liquidity...', { id: 'add-liquidity' });
      await tx.wait();
      
      toast.success('Liquidity added successfully!', { id: 'add-liquidity' });
      
      // Reset inputs and refresh data
      setVcInput('');
      setBnbInput('');
      setCalculation(null);
      setVcApproved(false);
      await fetchPoolInfo();
      
    } catch (error: any) {
      log.error('Failed to add liquidity', {
        component: 'LPPoolManager',
        function: 'addLiquidity'
      }, error);
      toast.error('Failed to add liquidity', { id: 'add-liquidity' });
    }
  };

  const removeLiquidity = async () => {
    if (!pancakeRouterContract || !lpTokensInput || !account) return;

    try {
      const lpAmount = ethers.parseEther(lpTokensInput);
      
      // Calculate minimum amounts with slippage (simplified)
      const minVcAmount = 0n; // Could be calculated based on pool ratio
      const minBnbAmount = 0n;
      
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      const tx = await (pancakeRouterContract as any)?.removeLiquidityETH(
        CONTRACTS.VC_TOKEN,
        lpAmount,
        minVcAmount,
        minBnbAmount,
        account,
        deadline
      );

      toast.loading('Removing liquidity...', { id: 'remove-liquidity' });
      await tx.wait();
      
      toast.success('Liquidity removed successfully!', { id: 'remove-liquidity' });
      
      // Reset inputs and refresh data
      setLpTokensInput('');
      setLpApproved(false);
      await fetchPoolInfo();
      
    } catch (error: any) {
      log.error('Failed to remove liquidity', {
        component: 'LPPoolManager',
        function: 'removeLiquidity'
      }, error);
      toast.error('Failed to remove liquidity', { id: 'remove-liquidity' });
    }
  };

  const setMaxVC = () => {
    if (poolInfo) {
      setVcInput(poolInfo.userVCBalance);
    }
  };

  const setMaxBNB = () => {
    if (poolInfo) {
      // Leave some BNB for gas
      const maxBnb = Math.max(0, parseFloat(poolInfo.userBNBBalance) - 0.01);
      setBnbInput(maxBnb.toString());
    }
  };

  const setRemovePercentageAmount = (percentage: number) => {
    setRemovePercentage(percentage);
    if (poolInfo) {
      const amount = (parseFloat(poolInfo.userLPBalance) * percentage) / 100;
      setLpTokensInput(amount.toString());
    }
  };

  // Connection check
  if (!isConnected) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-glass-pulse" />
        <h3 className="text-xl font-bold mb-4 text-white">Подключите кошелёк</h3>
        <p className="text-slate-400 mb-6">Для управления LP пулом необходимо подключить MetaMask</p>
        <button 
          onClick={connectWallet} 
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300"
        >
          Подключить кошелёк
        </button>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-glass-pulse" />
        <h3 className="text-xl font-bold mb-4 text-white">Неправильная сеть</h3>
        <p className="text-slate-400 mb-6">Переключитесь на BSC Testnet</p>
        <button 
          onClick={switchNetwork} 
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300"
        >
          Переключить сеть
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pool Information Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/12 via-cyan-500/8 to-indigo-500/6 border border-blue-400/20 rounded-2xl p-6 hover:from-blue-500/18 hover:via-cyan-500/12 hover:to-indigo-500/10 transition-all duration-300 shadow-xl shadow-blue-500/8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">VC/BNB Pool Information</h3>
              <p className="text-blue-200 text-sm">Current liquidity pool stats</p>
            </div>
          </div>
          <button
            onClick={fetchPoolInfo}
            disabled={loading}
            className="p-3 backdrop-blur-xl bg-white/10 border border-blue-400/30 rounded-xl hover:bg-blue-500/20 transition-all duration-300 group"
          >
            <RefreshCw className={cn("h-5 w-5 text-blue-300 group-hover:text-white transition-colors duration-300", loading && "animate-spin")} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-cyan-400/10 border border-blue-400/30 rounded-xl p-4 hover:from-blue-500/25 hover:via-blue-400/20 hover:to-cyan-400/15 transition-all duration-300 shadow-lg shadow-blue-500/15">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/40 border border-blue-400/50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-200" />
              </div>
              <div className="text-sm text-blue-200">VC Reserve</div>
            </div>
            <div className="text-2xl font-bold text-blue-200">
              {poolInfo ? `${parseFloat(poolInfo.reserve0).toFixed(2)}` : '0.00'}
            </div>
            <div className="text-xs text-blue-300 mt-1">VC Tokens</div>
          </div>
          
          <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 via-yellow-400/15 to-orange-400/10 border border-yellow-400/30 rounded-xl p-4 hover:from-yellow-500/25 hover:via-yellow-400/20 hover:to-orange-400/15 transition-all duration-300 shadow-lg shadow-yellow-500/15">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/40 border border-yellow-400/50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-200" />
              </div>
              <div className="text-sm text-yellow-200">BNB Reserve</div>
            </div>
            <div className="text-2xl font-bold text-yellow-200">
              {poolInfo ? `${parseFloat(poolInfo.reserve1).toFixed(4)}` : '0.0000'}
            </div>
            <div className="text-xs text-yellow-300 mt-1">BNB Tokens</div>
          </div>
          
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-pink-400/10 border border-purple-400/30 rounded-xl p-4 hover:from-purple-500/25 hover:via-purple-400/20 hover:to-pink-400/15 transition-all duration-300 shadow-lg shadow-purple-500/15">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/40 border border-purple-400/50 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-purple-200" />
              </div>
              <div className="text-sm text-purple-200">Total LP Supply</div>
            </div>
            <div className="text-2xl font-bold text-purple-200">
              {poolInfo ? `${parseFloat(poolInfo.totalSupply).toFixed(2)}` : '0.00'}
            </div>
            <div className="text-xs text-purple-300 mt-1">LP Tokens</div>
          </div>
          
          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 via-green-400/15 to-emerald-400/10 border border-green-400/30 rounded-xl p-4 hover:from-green-500/25 hover:via-green-400/20 hover:to-emerald-400/15 transition-all duration-300 shadow-lg shadow-green-500/15">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/40 border border-green-400/50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-200" />
              </div>
              <div className="text-sm text-green-200">Current Price</div>
            </div>
            <div className="text-lg font-bold text-green-200">
              {poolInfo ? `${parseFloat(poolInfo.vcPrice).toFixed(6)}` : '0.000000'}
            </div>
            <div className="text-xs text-green-300 mt-1">1 VC = {poolInfo?.vcPrice || '0'} BNB</div>
          </div>
        </div>
      </div>

      {/* LP Calculation Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-pink-500/6 to-rose-500/4 border border-purple-400/20 rounded-2xl p-6 hover:from-purple-500/15 hover:via-pink-500/10 hover:to-rose-500/8 transition-all duration-300 shadow-xl shadow-purple-500/8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Calculation of LP tokens</h3>
            <p className="text-purple-200 text-sm">Manage your liquidity positions</p>
          </div>
        </div>
        
        {/* Action Tabs */}
        <div className="flex rounded-xl bg-white/10 border border-purple-400/20 p-1 mb-6">
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
              activeTab === 'add'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                : 'text-purple-200 hover:text-white hover:bg-purple-500/10'
            )}
          >
            <Plus className="w-4 h-4" />
            Add liquidity
          </button>
          <button
            onClick={() => setActiveTab('remove')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
              activeTab === 'remove'
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30'
                : 'text-purple-200 hover:text-white hover:bg-purple-500/10'
            )}
          >
            <Minus className="w-4 h-4" />
            Remove liquidity
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">VC Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={vcInput}
                    onChange={(e) => setVcInput(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                  <button
                    onClick={setMaxVC}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-300"
                  >
                    MAX
                  </button>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Balance: {poolInfo?.userVCBalance ? parseFloat(poolInfo.userVCBalance).toFixed(4) : '0.0000'} VC
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">BNB Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={bnbInput}
                    onChange={(e) => setBnbInput(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                  />
                  <button
                    onClick={setMaxBNB}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors duration-300"
                  >
                    MAX
                  </button>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Balance: {poolInfo?.userBNBBalance ? parseFloat(poolInfo.userBNBBalance).toFixed(4) : '0.0000'} BNB
                </div>
              </div>
            </div>

            {/* Calculation Preview */}
            {calculation && (
              <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-white mb-3">Expected Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">LP Tokens</div>
                    <div className="text-lg font-bold text-green-400">{calculation.lpTokensToReceive}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Price Impact</div>
                    <div className="text-lg font-bold text-yellow-400">{calculation.priceImpact.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Pool Share</div>
                    <div className="text-lg font-bold text-purple-400">{calculation.shareOfPool.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Approve & Add Buttons */}
            <div className="space-y-3">
              {!vcApproved && vcInput && parseFloat(vcInput) > 0 && (
                <button
                  onClick={approveVC}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Approve VC Tokens
                </button>
              )}
              
              <button
                onClick={addLiquidity}
                disabled={!vcApproved || !calculation || loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Add Liquidity
              </button>
            </div>
          </div>
        )}

        {activeTab === 'remove' && (
          <div className="space-y-6">
            {/* Remove Percentage Buttons */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Remove Percentage</label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[25, 50, 75, 100].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setRemovePercentageAmount(percentage)}
                    className={cn(
                      'py-2 px-3 text-sm font-medium rounded-lg transition-all duration-300',
                      removePercentage === percentage
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>

            {/* LP Amount Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">LP Token Amount</label>
              <input
                type="number"
                placeholder="0.0"
                value={lpTokensInput}
                onChange={(e) => setLpTokensInput(e.target.value)}
                className="w-full pl-4 pr-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300"
              />
              <div className="text-xs text-slate-400 mt-1">
                Balance: {poolInfo?.userLPBalance ? parseFloat(poolInfo.userLPBalance).toFixed(4) : '0.0000'} LP
              </div>
            </div>

            {/* Remove Buttons */}
            <div className="space-y-3">
              {!lpApproved && lpTokensInput && parseFloat(lpTokensInput) > 0 && (
                <button
                  onClick={approveLP}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Approve LP Tokens
                </button>
              )}
              
              <button
                onClick={removeLiquidity}
                disabled={!lpApproved || !lpTokensInput || loading}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Remove Liquidity
              </button>
            </div>
          </div>
        )}

        {/* Slippage Settings */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Slippage Tolerance</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="w-16 px-2 py-1 text-xs backdrop-blur-xl bg-white/5 border border-white/10 rounded text-white text-center"
                min="0.1"
                max="50"
                step="0.1"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LPPoolManager; 