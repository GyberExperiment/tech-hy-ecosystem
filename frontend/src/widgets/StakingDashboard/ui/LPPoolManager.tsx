import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS, LP_POOL_CONFIG } from '../constants/contracts';
import { Calculator, Plus, Minus, AlertTriangle, Info, RefreshCw, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PoolInfoSkeleton } from './LoadingSkeleton';
import { log } from '../utils/logger';

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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-glass-pulse" />
          <h3 className="hero-title text-xl font-bold text-slate-100 mb-2">Wallet Not Connected</h3>
          <p className="text-gray-400 mb-6">Please connect your wallet to manage LP tokens</p>
          <button onClick={connectWallet} className="btn-glass-morphic animate-glass-pulse">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-glass-pulse" />
          <h3 className="hero-title text-xl font-bold text-slate-100 mb-2">Wrong Network</h3>
          <p className="text-gray-400 mb-6">Please switch to BSC Testnet</p>
          <button onClick={switchNetwork} className="btn-glass-morphic animate-glass-pulse">
            Switch to BSC Testnet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-responsive">
      {/* ContractStatus виджет удалён по требованию */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-responsive">
        {/* Pool Information */}
        <div className="liquid-glass p-6 animate-glass-float">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400 animate-glass-pulse" />
            <h3 className="section-title text-xl font-bold text-slate-100">Pool Information</h3>
          </div>
          {loading ? (
            <PoolInfoSkeleton />
          ) : poolInfo ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">VC Reserve</p>
                  <p className="font-bold text-slate-100">{parseFloat(poolInfo.reserve0).toFixed(2)} VC</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">BNB Reserve</p>
                  <p className="font-bold text-slate-100">{parseFloat(poolInfo.reserve1).toFixed(4)} BNB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">VC Price</p>
                  <p className="font-bold text-slate-100">{poolInfo.vcPrice} BNB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">BNB Price</p>
                  <p className="font-bold text-slate-100">{poolInfo.bnbPrice} VC</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Your LP Balance</p>
                  <p className="font-bold text-slate-100">{parseFloat(poolInfo.userLPBalance).toFixed(6)} LP</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total LP Supply</p>
                  <p className="font-bold text-slate-100">{parseFloat(poolInfo.totalSupply).toFixed(2)} LP</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-700/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Your VC Balance</p>
                    <p className="font-bold text-green-400">{parseFloat(poolInfo.userVCBalance).toFixed(6)} VC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Your BNB Balance</p>
                    <p className="font-bold text-blue-400">{parseFloat(poolInfo.userBNBBalance).toFixed(6)} BNB</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Loading pool information...</p>
          )}
        </div>

        {/* Виджет управления ликвидностью скрыт */}
        <div className="liquid-glass animate-glass-float">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title text-xl font-bold flex items-center text-slate-100">
              <Calculator className="mr-3 text-blue-400 animate-glass-pulse" />
              LP Pool Management
            </h3>
            <button
              onClick={fetchPoolInfo}
              disabled={loading}
              className="btn-glass-blue text-sm flex items-center space-x-2 animate-glass-pulse"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'add'
                  ? 'btn-glass-blue text-blue-400 animate-glass-pulse'
                  : 'glass-ultra text-gray-400 hover:text-white hover:glass-accent'
              }`}
            >
              <Plus size={16} />
              <span>Добавить ликвидность</span>
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'remove'
                  ? 'btn-glass-fire text-red-400 animate-glass-pulse'
                  : 'glass-ultra text-gray-400 hover:text-white hover:glass-accent'
              }`}
            >
              <Minus size={16} />
              <span>Удалить ликвидность</span>
            </button>
          </div>

          {/* Add Liquidity Tab */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-200">VC Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={vcInput}
                      onChange={(e) => setVcInput(e.target.value)}
                      placeholder="0.0"
                      className="input-field pr-16"
                    />
                    <button
                      onClick={setMaxVC}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-glass-orange text-sm px-2 py-1"
                    >
                      MAX
                    </button>
                  </div>
                  {poolInfo && (
                    <div className="text-xs text-gray-400 mt-1">
                      Balance: {poolInfo ? parseFloat(poolInfo.userVCBalance).toFixed(4) : '0.0000'} VC
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-200">BNB Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={bnbInput}
                      onChange={(e) => setBnbInput(e.target.value)}
                      placeholder="0.0"
                      className="input-field pr-16"
                    />
                    <button
                      onClick={setMaxBNB}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-glass-orange text-sm px-2 py-1"
                    >
                      MAX
                    </button>
                  </div>
                  {poolInfo && (
                    <div className="text-xs text-gray-400 mt-1">
                      Balance: {poolInfo ? parseFloat(poolInfo.userBNBBalance).toFixed(4) : '0.0000'} BNB
                    </div>
                  )}
                </div>
              </div>

              {/* Slippage Settings */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">Slippage Tolerance</label>
                <div className="flex space-x-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                        slippage === value
                          ? 'btn-glass-blue text-blue-400 animate-glass-pulse'
                          : 'glass-ultra text-gray-400 hover:text-white hover:glass-accent'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="50"
                    className="w-20 px-2 py-1 glass-ultra border border-white/20 rounded text-sm"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              {calculation && (
                <div className="glass-primary p-4 animate-glass-float">
                  <h5 className="font-semibold mb-2 flex items-center text-slate-100">
                    <Info className="mr-2 animate-glass-pulse" size={16} />
                    Preview
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>LP Tokens to receive:</span>
                      <span className="font-semibold text-slate-100">{calculation?.lpTokensToReceive || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Share of pool:</span>
                      <span className="font-semibold text-slate-100">{calculation?.shareOfPool.toFixed(4) || '0.0000'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price impact:</span>
                      <span className={`font-semibold ${(calculation?.priceImpact || 0) > 2 ? 'text-red-400' : 'text-green-400'}`}>
                        {calculation?.priceImpact.toFixed(2) || '0.00'}%
                      </span>
                    </div>
                  </div>
                  {(calculation?.priceImpact || 0) > 2 && (
                    <div className="flex items-center mt-2 text-red-400 text-xs">
                      <AlertTriangle size={12} className="mr-1 animate-glass-pulse" />
                      High price impact
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {!vcApproved && vcInput && parseFloat(vcInput) > 0 && (
                  <button onClick={approveVC} className="btn-glass-orange w-full animate-glass-pulse">
                    Approve VC Tokens
                  </button>
                )}
                
                <button
                  onClick={addLiquidity}
                  disabled={!calculation || !vcApproved || parseFloat(vcInput) === 0 || parseFloat(bnbInput) === 0}
                  className="btn-glass-morphic w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 animate-glass-pulse"
                >
                  <Plus size={18} />
                  <span>Add Liquidity</span>
                </button>
              </div>
            </div>
          )}

          {/* Remove Liquidity Tab */}
          {activeTab === 'remove' && (
            <div className="space-y-4">
              {/* Percentage Buttons */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">Remove Amount</label>
                <div className="flex space-x-2 mb-3">
                  {[25, 50, 75, 100].map((percentage) => (
                    <button
                      key={percentage}
                      onClick={() => setRemovePercentageAmount(percentage)}
                      className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                        removePercentage === percentage
                          ? 'btn-glass-fire text-red-400 animate-glass-pulse'
                          : 'glass-ultra text-gray-400 hover:text-white hover:glass-accent'
                      }`}
                    >
                      {percentage}%
                    </button>
                  ))}
                </div>
                
                <input
                  type="number"
                  value={lpTokensInput}
                  onChange={(e) => setLpTokensInput(e.target.value)}
                  placeholder="0.0"
                  className="input-field"
                />
                {poolInfo && (
                  <div className="text-xs text-gray-400 mt-1">
                    Available: {poolInfo ? parseFloat(poolInfo.userLPBalance).toFixed(4) : '0.0000'} LP Tokens
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!lpApproved && lpTokensInput && parseFloat(lpTokensInput) > 0 && (
                  <button onClick={approveLP} className="btn-glass-orange w-full animate-glass-pulse">
                    Approve LP Tokens
                  </button>
                )}
                
                <button
                  onClick={removeLiquidity}
                  disabled={!lpApproved || parseFloat(lpTokensInput) === 0}
                  className="btn-glass-fire w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 animate-glass-pulse"
                >
                  <Minus size={18} />
                  <span>Remove Liquidity</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LPPoolManager; 