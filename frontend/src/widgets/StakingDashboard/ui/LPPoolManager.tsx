import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { CONTRACTS, LP_POOL_CONFIG } from '../../../shared/config/contracts';
import { Calculator, Plus, Minus, AlertTriangle, Info, RefreshCw, BarChart3, TrendingUp, Activity, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton as PoolInfoSkeleton } from '../../../shared/ui/LoadingSkeleton';
import { log } from '../../../shared/lib/logger';
import { cn } from '../../../shared/lib/cn';
import { rpcService } from '../../../shared/api/rpcService';
import { useTokenData } from '../../../entities/Token/model/useTokenData';
import { usePoolInfo } from '../../../entities/Staking/model/usePoolInfo';

// ERC20 ABI - базовые функции для токенов
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

// PancakeSwap Pair ABI (для работы с LP парами)
const PANCAKE_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
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
    provider,
    signer,
    connectWallet,
    switchNetwork
  } = useWeb3();

  // ✅ Используем централизованные хуки для данных
  const { balances, loading: balancesLoading, refreshData: refreshTokens } = useTokenData();
  const { poolInfo, loading: poolLoading, refreshPoolInfo, error: poolError } = usePoolInfo();

  const [pairAddress, setPairAddress] = useState<string>('');
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

  // ✅ Получаем адрес пула при подключении кошелька
  useEffect(() => {
    if (isConnected && isCorrectNetwork && account) {
      fetchPairAddress();
    }
  }, [isConnected, isCorrectNetwork, account]);

  // ✅ Автоматический расчет BNB при изменении VC (используем poolInfo из usePoolInfo)
  const calculatedBnbAmount = useMemo(() => {
    if (!vcInput || !poolInfo.isLoaded || parseFloat(vcInput) <= 0) return '';
    
    try {
      const vcValue = parseFloat(vcInput);
      if (isNaN(vcValue) || vcValue <= 0) return '';
      
      const vcReserve = parseFloat(poolInfo.vcReserve);
      const bnbReserve = parseFloat(poolInfo.bnbReserve);
      
      if (vcReserve <= 0 || bnbReserve <= 0) return '';
      
      const ratio = bnbReserve / vcReserve; // BNB per VC
      const calculatedBnb = (vcValue * ratio).toFixed(6);
      
      log.debug('Auto-calculated BNB amount from VC', {
            component: 'LPPoolManager',
        vcAmount: vcInput,
        bnbAmount: calculatedBnb,
        ratio: ratio.toFixed(8),
        vcReserve: poolInfo.vcReserve,
        bnbReserve: poolInfo.bnbReserve
      });
      
      return calculatedBnb;
    } catch (error) {
      log.error('Failed to calculate BNB amount', {
        component: 'LPPoolManager',
        function: 'calculatedBnbAmount',
        vcAmount: vcInput
      }, error as Error);
      return '';
    }
  }, [vcInput, poolInfo.vcReserve, poolInfo.bnbReserve, poolInfo.isLoaded]);

  // ✅ Автоматическое обновление BNB поля при изменении расчета
  useEffect(() => {
    if (calculatedBnbAmount && calculatedBnbAmount !== bnbInput) {
      const timeoutId = setTimeout(() => {
        setBnbInput(calculatedBnbAmount);
      }, 100); // 100ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [calculatedBnbAmount, bnbInput]);

  // ✅ Автоматический расчет ликвидности когда изменяются входные данные
  useEffect(() => {
    if (vcInput && bnbInput && poolInfo.isLoaded) {
      calculateLiquidity();
    }
  }, [vcInput, bnbInput, poolInfo]);

  // ✅ Автоматическая проверка approve при изменении входных данных
  useEffect(() => {
    checkApprovals();
  }, [vcInput, lpTokensInput, account]);

  const fetchPairAddress = async () => {
    if (!account) return;

    try {
      log.info('Fetching pair address from factory', {
          component: 'LPPoolManager',
        function: 'fetchPairAddress',
        vcToken: CONTRACTS.VC_TOKEN,
        wbnb: CONTRACTS.WBNB
      });

      const pairAddress = await rpcService.withFallback(async (provider) => {
        const pancakeFactoryContract = new ethers.Contract(CONTRACTS.PANCAKE_FACTORY, PANCAKE_FACTORY_ABI, provider);
        return await pancakeFactoryContract.getPair(CONTRACTS.VC_TOKEN, CONTRACTS.WBNB);
      });

      if (pairAddress && pairAddress !== ethers.ZeroAddress) {
        setPairAddress(pairAddress);
        log.info('Pair address found', {
          component: 'LPPoolManager',
          function: 'fetchPairAddress',
          pairAddress
        });
        } else {
        log.warn('LP pool not found', {
          component: 'LPPoolManager',
          function: 'fetchPairAddress'
        });
      }
    } catch (error: any) {
      log.error('Failed to fetch pair address', {
        component: 'LPPoolManager',
        function: 'fetchPairAddress'
      }, error);
    }
  };

  const calculateLiquidity = async () => {
    if (!poolInfo.isLoaded || !vcInput || !bnbInput) return;

    try {
      const vcAmount = parseFloat(vcInput);
      const bnbAmount = parseFloat(bnbInput);
      
      if (vcAmount <= 0 || bnbAmount <= 0) return;

      const vcReserve = parseFloat(poolInfo.vcReserve);
      const bnbReserve = parseFloat(poolInfo.bnbReserve);
      
      if (vcReserve === 0 || bnbReserve === 0) {
        // First liquidity provision - используем формулу sqrt(x * y)
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

      // Рассчитываем оптимальные суммы на основе текущего соотношения в пуле
      const currentRatio = bnbReserve / vcReserve; // BNB per VC
      let finalVcAmount = vcAmount;
      let finalBnbAmount = bnbAmount;
      
      // Проверяем какой токен лимитирующий и корректируем суммы
      const requiredBnbForVc = vcAmount * currentRatio;
      const requiredVcForBnb = bnbAmount / currentRatio;
      
      if (requiredBnbForVc > bnbAmount) {
        // BNB лимитирующий фактор
        finalVcAmount = requiredVcForBnb;
        finalBnbAmount = bnbAmount;
      } else {
        // VC лимитирующий фактор  
        finalVcAmount = vcAmount;
        finalBnbAmount = requiredBnbForVc;
      }

      // Получаем общее количество LP токенов из пула
      const totalSupply = await rpcService.withFallback(async (provider) => {
        if (!pairAddress) return 0n;
        const lpPairContract = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, provider);
        return await lpPairContract.totalSupply();
      });

      const totalSupplyFormatted = parseFloat(ethers.formatEther(totalSupply));

      // Рассчитываем LP токены исходя из доли в пуле
      const lpTokens = Math.min(
        (finalVcAmount / vcReserve) * totalSupplyFormatted,
        (finalBnbAmount / bnbReserve) * totalSupplyFormatted
      );

      // Рассчитываем влияние на цену
      const priceImpact = Math.abs((finalVcAmount / vcReserve) * 100);
      
      // Рассчитываем долю в пуле
      const shareOfPool = (lpTokens / (totalSupplyFormatted + lpTokens)) * 100;

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
    if (!account || !provider) return;

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
    if (!account) return;

    try {
      const allowance = await rpcService.withFallback(async (provider) => {
        const vcContract = new ethers.Contract(CONTRACTS.VC_TOKEN, ERC20_ABI, provider);
        return await vcContract.allowance(account, CONTRACTS.PANCAKE_ROUTER);
      });
      
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
    if (!account || !pairAddress) return;

    try {
      const allowance = await rpcService.withFallback(async (provider) => {
        const lpPairContract = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, provider);
        return await lpPairContract.allowance(account, CONTRACTS.PANCAKE_ROUTER);
      });
      
      const requiredAmount = lpTokensInput ? ethers.parseEther(lpTokensInput) : 0n;
      setLpApproved(allowance >= requiredAmount && requiredAmount > 0n);
    } catch (error: any) {
      log.error('Failed to check LP approval', {
        component: 'LPPoolManager',
        function: 'checkLPApproval',
        pairAddress
      }, error);
      setLpApproved(false);
    }
  };

  const approveVC = async () => {
    if (!account || !signer) return;

    try {
      const vcContract = new ethers.Contract(CONTRACTS.VC_TOKEN, ERC20_ABI, signer);
      const amount = ethers.parseEther(vcInput);
      const tx = await vcContract.approve(CONTRACTS.PANCAKE_ROUTER, amount);
      
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
    if (!account || !signer || !pairAddress) return;

    try {
      const lpPairContract = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, signer);
      const amount = ethers.parseEther(lpTokensInput);
      const tx = await lpPairContract.approve(CONTRACTS.PANCAKE_ROUTER, amount);
      
      toast.loading('Approving LP tokens...', { id: 'approve-lp' });
      await tx.wait();
      
      setLpApproved(true);
      toast.success('LP tokens approved!', { id: 'approve-lp' });
    } catch (error: any) {
      log.error('Failed to approve LP', {
        component: 'LPPoolManager',
        function: 'approveLP',
        pairAddress
      }, error);
      toast.error('Failed to approve LP tokens', { id: 'approve-lp' });
    }
  };

  const addLiquidity = async () => {
    if (!signer || !calculation || !account) return;

    try {
      const pancakeRouterContract = new ethers.Contract(CONTRACTS.PANCAKE_ROUTER, PANCAKE_ROUTER_ABI, signer);
      
      const vcAmount = ethers.parseEther(calculation.vcAmount);
      const bnbAmount = ethers.parseEther(calculation.bnbAmount);
      
      // Calculate minimum amounts with slippage
      const minVcAmount = vcAmount * BigInt(Math.floor((100 - slippage) * 100)) / 10000n;
      const minBnbAmount = bnbAmount * BigInt(Math.floor((100 - slippage) * 100)) / 10000n;
      
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      const tx = await pancakeRouterContract.addLiquidityETH(
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
      
      // ✅ Обновляем данные через централизованные хуки
      refreshTokens();
      refreshPoolInfo();
      
    } catch (error: any) {
      log.error('Failed to add liquidity', {
        component: 'LPPoolManager',
        function: 'addLiquidity'
      }, error);
      toast.error('Failed to add liquidity', { id: 'add-liquidity' });
    }
  };

  const removeLiquidity = async () => {
    if (!signer || !lpTokensInput || !account) return;

    try {
      const pancakeRouterContract = new ethers.Contract(CONTRACTS.PANCAKE_ROUTER, PANCAKE_ROUTER_ABI, signer);
      
      const lpAmount = ethers.parseEther(lpTokensInput);
      
      // Calculate minimum amounts with slippage (simplified)
      const minVcAmount = 0n; // Could be calculated based on pool ratio
      const minBnbAmount = 0n;
      
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      const tx = await pancakeRouterContract.removeLiquidityETH(
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
      
      // ✅ Обновляем данные через централизованные хуки
      refreshTokens();
      refreshPoolInfo();
      
    } catch (error: any) {
      log.error('Failed to remove liquidity', {
        component: 'LPPoolManager',
        function: 'removeLiquidity'
      }, error);
      toast.error('Failed to remove liquidity', { id: 'remove-liquidity' });
    }
  };

  const setMaxVC = () => {
    if (balances.VC) {
      setVcInput(balances.VC);
    }
  };

  const setMaxBNB = () => {
    if (balances.BNB) {
      // Leave some BNB for gas
      const maxBnb = Math.max(0, parseFloat(balances.BNB) - 0.01);
      setBnbInput(maxBnb.toString());
    }
  };

  const setRemovePercentageAmount = (percentage: number) => {
    setRemovePercentage(percentage);
    if (balances.LP) {
      const amount = (parseFloat(balances.LP) * percentage) / 100;
      setLpTokensInput(amount.toString());
    }
  };

  // ✅ Unified refresh function
  const refreshAllData = () => {
    refreshTokens();
    refreshPoolInfo();
    fetchPairAddress();
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
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/6 via-cyan-500/4 to-indigo-500/3 border border-blue-400/15 rounded-2xl p-6 hover:from-blue-500/8 hover:via-cyan-500/6 hover:to-indigo-500/4 transition-all duration-300 shadow-xl shadow-blue-500/4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/80 to-cyan-600/80 shadow-lg shadow-blue-500/20">
              <BarChart3 className="h-6 w-6 text-white" />
          </div>
                <div>
              <h3 className="text-xl font-bold text-white">VC/BNB Pool Information</h3>
              <p className="text-blue-200/80 text-sm">Current liquidity pool stats</p>
                </div>
                </div>
          <button
            onClick={refreshAllData}
            disabled={poolLoading || balancesLoading}
            className="p-3 backdrop-blur-xl bg-white/8 border border-blue-400/25 rounded-xl hover:bg-blue-500/15 transition-all duration-300 group"
          >
            <RefreshCw className={cn("h-5 w-5 text-blue-300/80 group-hover:text-white transition-colors duration-300", (poolLoading || balancesLoading) && "animate-spin")} />
          </button>
                </div>
        
        {poolLoading && <PoolInfoSkeleton />}
        
        {!poolLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-blue-400/8 to-cyan-400/5 border border-blue-400/25 rounded-xl p-4 hover:from-blue-500/15 hover:via-blue-400/12 hover:to-cyan-400/8 transition-all duration-300 shadow-lg shadow-blue-500/8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-200/90" />
                </div>
                <div className="text-sm text-blue-200/80">VC Reserve</div>
                </div>
              <div className="text-2xl font-bold text-blue-200/90">
                {parseFloat(poolInfo.vcReserve).toFixed(2)}
                </div>
              <div className="text-xs text-blue-300/80 mt-1">VC Tokens</div>
              </div>
            
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 via-yellow-400/8 to-orange-400/5 border border-yellow-400/25 rounded-xl p-4 hover:from-yellow-500/15 hover:via-yellow-400/12 hover:to-orange-400/8 transition-all duration-300 shadow-lg shadow-yellow-500/8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/30 border border-yellow-400/40 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-yellow-200/90" />
                  </div>
                <div className="text-sm text-yellow-200/80">BNB Reserve</div>
                  </div>
              <div className="text-2xl font-bold text-yellow-200/90">
                {parseFloat(poolInfo.bnbReserve).toFixed(4)}
                </div>
              <div className="text-xs text-yellow-300/80 mt-1">BNB Tokens</div>
              </div>
            
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-purple-400/8 to-pink-400/5 border border-purple-400/25 rounded-xl p-4 hover:from-purple-500/15 hover:via-purple-400/12 hover:to-pink-400/8 transition-all duration-300 shadow-lg shadow-purple-500/8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/30 border border-purple-400/40 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-purple-200/90" />
            </div>
                <div className="text-sm text-purple-200/80">Total LP Supply</div>
              </div>
              <div className="text-2xl font-bold text-purple-200/90">
                {balances.LP ? parseFloat(balances.LP).toFixed(2) : '0.00'}
              </div>
              <div className="text-xs text-purple-300/80 mt-1">LP Tokens</div>
            </div>
            
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-green-400/8 to-emerald-400/5 border border-green-400/25 rounded-xl p-4 hover:from-green-500/15 hover:via-green-400/12 hover:to-emerald-400/8 transition-all duration-300 shadow-lg shadow-green-500/8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/30 border border-green-400/40 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-200/90" />
                </div>
                <div className="text-sm text-green-200/80">Current Price</div>
              </div>
              <div className="text-lg font-bold text-green-200/90">
                {parseFloat(poolInfo.price).toFixed(6)}
              </div>
              <div className="text-xs text-green-300/80 mt-1">1 VC = {poolInfo.price} BNB</div>
            </div>
          </div>
          )}
        </div>

      {/* LP Calculation Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-rose-500/2 border border-purple-400/15 rounded-2xl p-6 hover:from-purple-500/8 hover:via-pink-500/5 hover:to-rose-500/3 transition-all duration-300 shadow-xl shadow-purple-500/4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/80 to-pink-600/80 shadow-lg shadow-purple-500/20">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Add Liquidity</h3>
            <p className="text-purple-200/80 text-sm">Manage your liquidity positions</p>
          </div>
          </div>

        {/* Action Tabs */}
        <div className="flex rounded-xl bg-white/5 border border-purple-400/15 p-1 mb-6">
            <button
              onClick={() => setActiveTab('add')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
                activeTab === 'add'
                ? 'bg-gradient-to-r from-green-500/80 to-emerald-600/80 text-white shadow-lg shadow-green-500/25'
                : 'text-purple-200/80 hover:text-white hover:bg-purple-500/8'
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
                ? 'bg-gradient-to-r from-red-500/80 to-pink-600/80 text-white shadow-lg shadow-red-500/25'
                : 'text-purple-200/80 hover:text-white hover:bg-purple-500/8'
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
                    className="w-full pl-4 pr-16 py-3 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/40 rounded-xl text-white placeholder-slate-300 focus:border-blue-400/80 focus:ring-2 focus:ring-blue-400/30 focus:bg-gradient-to-r focus:from-blue-500/30 focus:to-cyan-500/30 transition-all duration-300 shadow-lg shadow-blue-500/20 font-medium"
                    />
                    <button
                      onClick={setMaxVC}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-blue-500/40 text-blue-200 rounded-lg hover:bg-blue-500/60 hover:text-white transition-all duration-300 font-semibold border border-blue-400/30"
                    >
                      MAX
                    </button>
                  </div>
                <div className="text-xs text-blue-300/80 mt-1 font-medium">
                  Balance: {balances.VC ? parseFloat(balances.VC).toFixed(4) : '0.0000'} VC
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
                    className="w-full pl-4 pr-16 py-3 backdrop-blur-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/40 rounded-xl text-white placeholder-slate-300 focus:border-yellow-400/80 focus:ring-2 focus:ring-yellow-400/30 focus:bg-gradient-to-r focus:from-yellow-500/30 focus:to-orange-500/30 transition-all duration-300 shadow-lg shadow-yellow-500/20 font-medium"
                    />
                    <button
                      onClick={setMaxBNB}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-yellow-500/40 text-yellow-200 rounded-lg hover:bg-yellow-500/60 hover:text-white transition-all duration-300 font-semibold border border-yellow-400/30"
                    >
                      MAX
                    </button>
                  </div>
                <div className="text-xs text-yellow-300/80 mt-1 font-medium">
                  Balance: {balances.BNB ? parseFloat(balances.BNB).toFixed(4) : '0.0000'} BNB
                    </div>
                </div>
              </div>

              {/* Calculation Preview */}
              {calculation && (
              <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/6 to-blue-500/6 border border-green-500/15 rounded-xl p-4">
                <h4 className="text-sm font-medium text-white mb-3">Expected Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400/80">LP Tokens</div>
                    <div className="text-lg font-bold text-green-400/90">{calculation.lpTokensToReceive}</div>
                    </div>
                  <div>
                    <div className="text-slate-400/80">Price Impact</div>
                    <div className="text-lg font-bold text-yellow-400/90">{calculation.priceImpact.toFixed(2)}%</div>
                    </div>
                  <div>
                    <div className="text-slate-400/80">Pool Share</div>
                    <div className="text-lg font-bold text-purple-400/90">{calculation.shareOfPool.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              )}

            {/* Approve & Add Buttons */}
              <div className="space-y-3">
                {!vcApproved && vcInput && parseFloat(vcInput) > 0 && (
                <button
                  onClick={approveVC}
                  className="w-full py-3 bg-gradient-to-r from-orange-500/90 to-yellow-600/90 hover:from-orange-600/90 hover:to-yellow-700/90 text-white font-semibold rounded-xl transition-all duration-300"
                >
                    Approve VC Tokens
                  </button>
                )}
                
                <button
                  onClick={addLiquidity}
                disabled={!vcApproved || !calculation || loading}
                className="w-full py-3 bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-600/90 hover:to-emerald-700/90 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                        ? 'bg-gradient-to-r from-red-500/80 to-pink-600/80 text-white'
                        : 'bg-white/3 text-slate-300/80 hover:text-white hover:bg-white/6'
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
                className="w-full pl-4 pr-4 py-3 backdrop-blur-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-400/40 rounded-xl text-white placeholder-slate-300 focus:border-red-400/80 focus:ring-2 focus:ring-red-400/30 focus:bg-gradient-to-r focus:from-red-500/30 focus:to-pink-500/30 transition-all duration-300 shadow-lg shadow-red-500/20 font-medium"
                />
              <div className="text-xs text-red-300/80 mt-1 font-medium">
                Balance: {balances.LP ? parseFloat(balances.LP).toFixed(4) : '0.0000'} LP
                  </div>
              </div>

            {/* Remove Buttons */}
              <div className="space-y-3">
                {!lpApproved && lpTokensInput && parseFloat(lpTokensInput) > 0 && (
                <button
                  onClick={approveLP}
                  className="w-full py-3 bg-gradient-to-r from-orange-500/90 to-yellow-600/90 hover:from-orange-600/90 hover:to-yellow-700/90 text-white font-semibold rounded-xl transition-all duration-300"
                >
                    Approve LP Tokens
                  </button>
                )}
                
                <button
                  onClick={removeLiquidity}
                disabled={!lpApproved || !lpTokensInput || loading}
                className="w-full py-3 bg-gradient-to-r from-red-500/90 to-pink-600/90 hover:from-red-600/90 hover:to-pink-700/90 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                Remove Liquidity
                </button>
              </div>
            </div>
          )}

        {/* Slippage Settings */}
        <div className="mt-6 pt-6 border-t border-white/8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400/80">Slippage Tolerance</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="w-16 px-2 py-1 text-xs backdrop-blur-xl bg-white/3 border border-white/8 rounded text-white text-center"
                min="0.1"
                max="50"
                step="0.1"
              />
              <span className="text-xs text-slate-400/80">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LPPoolManager; 