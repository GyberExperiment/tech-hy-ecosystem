import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { CONTRACTS } from '../../../shared/config/contracts';
import { toast } from 'react-hot-toast';
import { Coins, Zap, TrendingUp, Wallet, Info, RefreshCw, AlertCircle, ArrowRightLeft, ShoppingCart, Lock } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { useTokenData } from '../../../entities/Token/model/useTokenData';
import { usePoolInfo } from '../../../entities/Staking/model/usePoolInfo';
import { useVCSale } from '../../VCSaleWidget/hooks/useVCSale';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';
import { formatNumber, formatCurrency } from '../../../shared/lib/format';
import { ErrorBoundary } from '../../../shared/ui/ErrorBoundary';
import { NetworkWarning } from '../../../shared/ui/NetworkWarning';
import { Input } from '../../../shared/ui/Input';

interface SwapWidgetProps {
  className?: string;
}

const SwapWidget: React.FC<SwapWidgetProps> = ({ className = '' }) => {
  const { account, signer, isConnected, vcContract, lpLockerContract, vgContract, chainId } = useWeb3();
  
  // Use centralized hooks
  const { balances, loading: balancesLoading, triggerGlobalRefresh } = useTokenData();
  const { poolInfo, loading: poolLoading, refreshPoolInfo } = usePoolInfo();
  
  // VCSale hook for Buy VC mode
  const {
    saleStats,
    userStats: vcsaleUserStats,
    securityStatus,
    vcAmount: vcsaleVcAmount,
    bnbAmount: vcsaleBnbAmount,
    isLoading: vcsaleLoading,
    isDataLoading: vcsaleDataLoading,
    isRefreshing: vcsaleRefreshing,
    error: vcsaleError,
    isNetworkSupported,
    canPurchase,
    setVcAmount: setVcsaleVcAmount,
    refreshAllData: refreshVcsaleData,
    executePurchase,
  } = useVCSale();
  
  // 🔍 DEBUG: Log canPurchase state for debugging
  React.useEffect(() => {
    if (account) {
      console.log('🔍 [SwapWidget] DEBUG canPurchase state:', {
        account,
        vcAmount: vcsaleVcAmount,
        parseFloatVcAmount: vcsaleVcAmount ? parseFloat(vcsaleVcAmount) : 'empty',
        securityStatus,
        canPurchase,
        isLoading: vcsaleLoading,
        saleStats,
        isNetworkSupported,
        // Individual checks
        hasAccount: !!account,
        hasVcAmount: !!vcsaleVcAmount,
        vcAmountGt0: vcsaleVcAmount ? parseFloat(vcsaleVcAmount) > 0 : false,
        notContractPaused: !securityStatus?.contractPaused,
        notUserBlacklisted: !securityStatus?.userBlacklisted,  
        notCircuitBreakerActive: !securityStatus?.circuitBreakerActive,
        notRateLimited: !securityStatus?.rateLimited,
        notIsLoading: !vcsaleLoading,
      });
    }
  }, [account, vcsaleVcAmount, securityStatus, canPurchase, vcsaleLoading, saleStats, isNetworkSupported]);
  
  // State management for modes
  const [mode, setMode] = useState<'buyvc' | 'earnvg'>('buyvc'); // Default to BuyVC
  
  // State for Earn VG mode
  const [loading, setLoading] = useState(false);
  const [earnVgMode, setEarnVgMode] = useState<'create' | 'lock'>('create');
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [currentAllowance, setCurrentAllowance] = useState<string>('0');
  const [checkingAllowance, setCheckingAllowance] = useState(false);

  // Network validation
  if (!isNetworkSupported) {
    return (
      <div className={cn('card-ultra animate-enhanced-widget-chaos-1', className)}>
        <NetworkWarning 
          currentChainId={chainId}
          variant="card"
          className="mb-0"
        />
      </div>
    );
  }

  // Memoized calculations for EarnVG mode
  const calculatedBnbAmount = useMemo(() => {
    if (!vcAmount || !poolInfo || parseFloat(vcAmount) <= 0) return '';
    
    try {
      const vcValue = parseFloat(vcAmount);
      if (isNaN(vcValue) || vcValue <= 0) return '';
      
      const ratio = parseFloat(poolInfo.bnbReserve) / parseFloat(poolInfo.vcReserve);
      const calculatedBnb = (vcValue * ratio).toFixed(6);
      
      return calculatedBnb;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Failed to calculate BNB amount', {
          component: 'SwapWidget',
          function: 'calculatedBnbAmount',
          vcAmount
        }, error as Error);
      }
      return '';
    }
  }, [vcAmount, poolInfo?.bnbReserve, poolInfo?.vcReserve]);

  // Auto-update BNB amount when VC amount changes (EarnVG mode)
  useEffect(() => {
    if (mode === 'earnvg' && calculatedBnbAmount && calculatedBnbAmount !== bnbAmount) {
      const timeoutId = setTimeout(() => {
        setBnbAmount(calculatedBnbAmount);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [mode, calculatedBnbAmount, bnbAmount, vcAmount]);

  // Check allowance for EarnVG mode
  const checkCurrentAllowance = async () => {
    if (!account || !vcContract) {
      toast.error('Подключите кошелёк');
      return;
    }
    
    setCheckingAllowance(true);
    try {
      const allowance = await rpcService.withFallback(async (provider) => {
        const readOnlyVCContract = new ethers.Contract(CONTRACTS.VC_TOKEN, [
          "function allowance(address owner, address spender) view returns (uint256)"
        ], provider);
        
        return await (readOnlyVCContract as any).allowance(account, CONTRACTS.LP_LOCKER);
      });
      
      const allowanceFormatted = ethers.formatEther(allowance);
      setCurrentAllowance(allowanceFormatted);
      
      if (parseFloat(allowanceFormatted) > 0) {
        toast.success(`Approve уже выполнен! Allowance: ${parseFloat(allowanceFormatted).toFixed(2)} VC`);
      } else {
        toast.success('Approve не выполнен. Allowance: 0 VC');
      }
    } catch (error) {
      toast.error('Ошибка проверки allowance');
    } finally {
      setCheckingAllowance(false);
    }
  };

  // EarnVG transaction handler
  const handleEarnVG = async () => {
    if (!signer || !account || !vcContract || !lpLockerContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    if (!vcAmount || !bnbAmount) {
      toast.error('Введите количество VC и BNB');
      return;
    }

    const vcAmountWei = ethers.parseEther(vcAmount);
    const bnbAmountWei = ethers.parseEther(bnbAmount);

    if (parseFloat(balances.VC || '0') < parseFloat(vcAmount)) {
      toast.error('Недостаточно VC токенов');
      return;
    }

    if (parseFloat(balances.BNB || '0') < parseFloat(bnbAmount)) {
      toast.error('Недостаточно BNB');
      return;
    }

    setLoading(true);
    
    try {
      // Configuration values
      const stakingVault = CONTRACTS.LP_LOCKER;
      const maxSlippageBps = 1000;
      const lpDivisor = ethers.parseEther('1000');
      const lpToVgRatio = 10;
      
      // Check VG vault balance
      const vaultVGBalance = await rpcService.withFallback(async (provider) => {
        const readOnlyVGContract = new ethers.Contract(CONTRACTS.VG_TOKEN, [
          "function balanceOf(address) view returns (uint256)"
        ], provider);
        
        return await (readOnlyVGContract as any).balanceOf(stakingVault);
      });
      
      if (vaultVGBalance === 0n) {
        toast.error('VG vault пустой - обратитесь к администратору');
        return;
      }
      
      // Calculate expected reward
      const expectedLp = (vcAmountWei * bnbAmountWei) / lpDivisor;
      const expectedVGReward = expectedLp * BigInt(lpToVgRatio);
      
      if (vaultVGBalance < expectedVGReward) {
        toast.error(`Недостаточно VG в vault. Нужно: ${ethers.formatEther(expectedVGReward)}, доступно: ${ethers.formatEther(vaultVGBalance)}`);
        return;
      }

      // Check allowance
      const allowance = await rpcService.withFallback(async (provider) => {
        const readOnlyVCContract = new ethers.Contract(CONTRACTS.VC_TOKEN, [
          "function allowance(address owner, address spender) view returns (uint256)"
        ], provider);
        
        return await (readOnlyVCContract as any).allowance(account, CONTRACTS.LP_LOCKER);
      });

      // Approve if needed
      if (allowance < vcAmountWei) {
        toast.loading('Approve VC токенов...');
        const vcContractWithSigner = vcContract.connect(signer);
        const MAX_UINT256 = (2n ** 256n - 1n).toString();
        
        const approveTx = await (vcContractWithSigner as any).approve(CONTRACTS.LP_LOCKER, MAX_UINT256, {
          gasLimit: 100000,
        });
        
        await approveTx.wait();
        toast.success('VC токены approved!');
      }

      // Execute earnVG
      const lpLockerWithSigner = lpLockerContract.connect(signer);
      toast.loading('Создание LP позиции и получение VG токенов...');
      
      const finalSlippage = Math.min(1500, maxSlippageBps);
      
      const tx = await (lpLockerWithSigner as any).earnVG(vcAmountWei, bnbAmountWei, finalSlippage, {
        value: bnbAmountWei,
        gasLimit: 500000,
      });
      
      toast.loading('Ожидание подтверждения транзакции...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success(`Транзакция успешна! LP создан и сожжен. Получено ${ethers.formatEther(expectedVGReward)} VG`);
        
        // Clear form
        setVcAmount('');
        setBnbAmount('');
        setCurrentAllowance('0');
        
        // Refresh balances
        await triggerGlobalRefresh();
        await refreshPoolInfo();
      } else {
        toast.error('Транзакция не удалась');
      }
    } catch (error: any) {
      if (error.message?.includes('Too frequent transactions')) {
        toast.error('MEV Protection: Подождите 5 минут между транзакциями');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Недостаточно средств для транзакции');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Транзакция отклонена пользователем');
      } else {
        toast.error(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Lock LP handler
  const handleLockLP = async () => {
    if (!signer || !account || !lpLockerContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    if (!lpAmount) {
      toast.error('Введите количество LP токенов');
      return;
    }

    if (parseFloat(balances.LP || '0') < parseFloat(lpAmount)) {
      toast.error('Недостаточно LP токенов');
      return;
    }

    setLoading(true);
    
    try {
      const lpAmountWei = ethers.parseEther(lpAmount);
      
      // Check if LP token needs approval
      const lpTokenContract = new ethers.Contract(CONTRACTS.LP_TOKEN, [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
      ], signer);

      const allowance = await (lpTokenContract as any).allowance(account, CONTRACTS.LP_LOCKER);

      if (allowance < lpAmountWei) {
        toast.loading('Approve LP токенов...');
        const MAX_UINT256 = (2n ** 256n - 1n).toString();
        
        const approveTx = await (lpTokenContract as any).approve(CONTRACTS.LP_LOCKER, MAX_UINT256, {
          gasLimit: 100000,
        });
        
        await approveTx.wait();
        toast.success('LP токены approved!');
      }

      const lpLockerWithSigner = lpLockerContract.connect(signer);
      toast.loading('Сжигание LP токенов и получение VG...');
      
      const tx = await (lpLockerWithSigner as any).lockLPTokens(lpAmountWei, {
        gasLimit: 300000,
      });
      
      toast.loading('Ожидание подтверждения транзакции...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        const expectedVGReward = parseFloat(lpAmount) * 10;
        toast.success(`LP токены сожжены! Получено ${expectedVGReward} VG`);
        
        // Clear form
        setLpAmount('');
        
        // Refresh balances
        await triggerGlobalRefresh();
      } else {
        toast.error('Транзакция не удалась');
      }
    } catch (error: any) {
      if (error.message?.includes('Too frequent transactions')) {
        toast.error('MEV Protection: Подождите 5 минут между транзакциями');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Недостаточно средств для транзакции');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Транзакция отклонена пользователем');
      } else {
        toast.error(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const calculateVGReward = (): string => {
    if (earnVgMode === 'create') {
      if (!vcAmount || !bnbAmount) return '0';
      try {
        const vcValue = parseFloat(vcAmount);
        const bnbValue = parseFloat(bnbAmount);
        
        const lpToVgRatio = 10;
        const lpAmount = Math.sqrt(vcValue * bnbValue);
        const vgReward = lpAmount * lpToVgRatio;
        
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    } else if (earnVgMode === 'lock') {
      if (!lpAmount) return '0';
      try {
        const lpValue = parseFloat(lpAmount);
        const lpToVgRatio = 10;
        const vgReward = lpValue * lpToVgRatio;
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    }
    return '0';
  };

  const refreshAllData = async () => {
    if (process.env.NODE_ENV === 'development') {
      log.info('Manual refresh triggered', {
        component: 'SwapWidget',
        function: 'refreshAllData'
      });
    }
    
    if (mode === 'buyvc') {
      await refreshVcsaleData();
    } else {
      triggerGlobalRefresh();
      await refreshPoolInfo();
    }
  };

  if (!isConnected) {
    return (
      <div className={`card-ultra animate-enhanced-widget-chaos-1 ${className}`}>
        <div className="text-center">
          <Wallet className="h-16 w-16 text-blue-400 mb-6 mx-auto" />
          <h3 className="card-title text-xl font-bold text-white mb-3">Подключите кошелёк</h3>
          <p className="text-gray-300">
            Для использования Swap необходимо подключить MetaMask
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-ultra animate-enhanced-widget-chaos-1 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/80 to-purple-600/80 shadow-lg shadow-blue-500/20">
            <ArrowRightLeft className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Token Swap</h3>
            <p className="text-slate-200 text-sm">
              {mode === 'buyvc' 
                ? 'Buy VC tokens with BNB at fixed price'
                : 'Burn LP and earn VG tokens (10:1)'
              }
            </p>
          </div>
        </div>
        <button
          onClick={refreshAllData}
          disabled={poolLoading || vcsaleLoading}
          className="p-3 backdrop-blur-xl bg-white/8 border border-blue-400/25 rounded-xl hover:bg-blue-500/15 transition-all duration-300 group"
        >
          <RefreshCw className={cn("h-5 w-5 text-blue-300/80 group-hover:text-white transition-colors duration-300", (poolLoading || vcsaleLoading) && "animate-spin")} />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-white/5 border border-yellow-400/15 p-1 mb-6">
        <button
          onClick={() => setMode('buyvc')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
            mode === 'buyvc'
              ? 'bg-gradient-to-r from-blue-500/80 to-purple-600/80 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-200 hover:text-white hover:bg-blue-500/8'
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Buy VC
        </button>
        <button
          onClick={() => setMode('earnvg')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
            mode === 'earnvg'
              ? 'bg-gradient-to-r from-orange-500/80 to-red-600/80 text-white shadow-lg shadow-orange-500/25'
              : 'text-slate-200 hover:text-white hover:bg-orange-500/8'
          )}
        >
          <Zap className="w-4 h-4" />
          Earn VG
        </button>
      </div>

      {/* Mode-specific content */}
      {mode === 'buyvc' ? (
        /* Buy VC Mode - Active */
        <>
          {/* Balances for Buy VC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/8 via-yellow-400/5 to-orange-400/4 border border-yellow-400/20 rounded-xl p-4 hover:from-yellow-500/12 hover:via-yellow-400/8 hover:to-orange-400/6 transition-all duration-300 shadow-lg shadow-yellow-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/25 border border-yellow-400/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-300">BNB</span>
                </div>
                <div className="text-sm text-yellow-200/80">BNB Balance</div>
              </div>
              <div className="text-2xl font-bold text-yellow-300/90">
                {balancesLoading ? (
                  <div className="animate-pulse bg-yellow-400/20 h-6 w-16 rounded"></div>
                ) : (
                  formatBalance(balances.BNB || '0')
                )}
              </div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/8 via-purple-400/5 to-blue-400/4 border border-purple-400/20 rounded-xl p-4 hover:from-purple-500/12 hover:via-purple-400/8 hover:to-blue-400/6 transition-all duration-300 shadow-lg shadow-purple-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/25 border border-purple-400/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-300">VC</span>
                </div>
                <div className="text-sm text-purple-200/80">VC Balance</div>
              </div>
              <div className="text-2xl font-bold text-purple-300/90">
                {balancesLoading ? (
                  <div className="animate-pulse bg-purple-400/20 h-6 w-16 rounded"></div>
                ) : (
                  formatBalance(balances.VC || '0')
                )}
              </div>
            </div>
          </div>

          {/* Sale Information */}
          {saleStats && (
            <div className="backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Sale Information</span>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  saleStats.saleActive
                    ? "bg-green-500/20 text-green-300 border border-green-400/30"
                    : "bg-red-500/20 text-red-300 border border-red-400/30"
                )}>
                  {saleStats.saleActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Available VC:</span>
                  <div className="text-white font-medium">{formatNumber(saleStats.currentVCBalance, 0)} VC</div>
                </div>
                <div>
                  <span className="text-slate-400">Price per VC:</span>
                  <div className="text-white font-medium">{formatCurrency(parseFloat(saleStats.pricePerVC) / 1e18, 6)} BNB</div>
                </div>
              </div>
            </div>
          )}

          {/* Input Fields for Buy VC */}
          <div className="space-y-4 mb-6">
            <Input
              type="number"
              label="VC Amount to Buy"
              value={vcsaleVcAmount}
              name="vcAmount"
              placeholder="Enter VC amount"
              onChange={(e) => setVcsaleVcAmount(e.target.value)}
              disabled={vcsaleLoading}
              error={vcsaleError}
              leftIcon={<Coins className="h-4 w-4 text-purple-400/80" />}
            />

            <Input
              type="text"
              label="BNB Required"
              value={vcsaleBnbAmount}
              name="bnbAmount"
              placeholder="Calculated automatically"
              readOnly
              disabled
              leftIcon={<Coins className="h-4 w-4 text-yellow-400/80" />}
            />

            {/* Purchase Preview */}
            {vcsaleVcAmount && vcsaleBnbAmount && saleStats && (
              <div className="bg-gradient-to-br from-blue-500/8 via-blue-400/5 to-cyan-400/4 border border-blue-400/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Purchase Preview</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">You pay:</span>
                    <span className="text-white font-medium">{vcsaleBnbAmount} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">You receive:</span>
                    <span className="text-white font-medium">{vcsaleVcAmount} VC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rate:</span>
                    <span className="text-white font-medium">
                      1 VC = {formatCurrency(parseFloat(saleStats.pricePerVC) / 1e18, 6)} BNB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Purchase Button */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                VC Amount to Buy
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={vcsaleVcAmount}
                  onChange={(e) => setVcsaleVcAmount(e.target.value)}
                  placeholder="Enter VC amount"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500/50 focus:outline-none transition-colors"
                  min="0"
                  step="0.001"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-purple-400 text-sm font-medium">VC</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                BNB Required
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vcsaleBnbAmount}
                  readOnly
                  placeholder="Calculated automatically"
                  className="w-full px-4 py-3 bg-slate-900/30 border border-slate-700/30 rounded-xl text-slate-300 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-yellow-400 text-sm font-medium">BNB</span>
                </div>
              </div>
            </div>

            {/* 🔍 TEMPORARY DEBUG INFO - показываем для диагностики */}
            {process.env.NODE_ENV === 'development' && account && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-xs">
                <div className="text-red-300 font-medium mb-2">🔍 DEBUG: Purchase Block Diagnosis</div>
                <div className="space-y-1 text-red-200">
                  <div>Account: {account ? '✅' : '❌'} {account?.slice(0, 8)}...</div>
                  <div>VC Amount: {vcsaleVcAmount || 'empty'} {vcsaleVcAmount && parseFloat(vcsaleVcAmount) > 0 ? '✅' : '❌'}</div>
                  <div>Network: {isNetworkSupported ? '✅' : '❌'}</div>
                  <div>Loading: {vcsaleLoading ? '❌ (loading)' : '✅'}</div>
                  <div className="border-t border-red-500/20 pt-1 mt-1">
                    <div>Security Status:</div>
                    <div className="ml-2">
                      <div>Contract Paused: {securityStatus?.contractPaused ? '❌ YES' : '✅ NO'}</div>
                      <div>User Blacklisted: {securityStatus?.userBlacklisted ? '❌ YES' : '✅ NO'}</div>
                      <div>Circuit Breaker: {securityStatus?.circuitBreakerActive ? '❌ YES' : '✅ NO'}</div>
                      <div>Rate Limited: {securityStatus?.rateLimited ? '❌ YES' : '✅ NO'}</div>
                    </div>
                  </div>
                  <div className="border-t border-red-500/20 pt-1 mt-1">
                    <div>Sale Stats:</div>
                    <div className="ml-2">
                      <div>Sale Active: {saleStats?.saleActive ? '✅ YES' : '❌ NO'}</div>
                      <div>Available VC: {saleStats?.currentVCBalance || 'unknown'}</div>
                      <div>Price: {saleStats?.pricePerVC ? (parseFloat(saleStats.pricePerVC) / 1e18).toFixed(6) : 'unknown'} BNB</div>
                    </div>
                  </div>
                  <div className="border-t border-red-500/20 pt-1 mt-1 font-bold">
                    <div>Final canPurchase: {canPurchase ? '✅ TRUE' : '❌ FALSE'}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={executePurchase}
              disabled={!canPurchase || vcsaleLoading}
              className={cn(
                "w-full py-4 font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl",
                canPurchase && !vcsaleLoading
                  ? "bg-gradient-to-r from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 hover:shadow-xl transform hover:scale-[1.02]"
                  : "bg-gradient-to-r from-slate-600/50 to-slate-700/50"
              )}
            >
              {vcsaleLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : !vcsaleVcAmount || parseFloat(vcsaleVcAmount) <= 0 ? (
                'Enter Amount'
              ) : !canPurchase ? (
                'Cannot Purchase'
              ) : (
                `Buy ${vcsaleVcAmount} VC`
              )}
            </button>
          </div>
        </>
      ) : (
        /* Earn VG Mode - Active */
        <>
          {/* Mode Switcher for EarnVG */}
          <div className="flex rounded-xl bg-white/5 border border-yellow-400/15 p-1 mb-6">
            <button
              onClick={() => setEarnVgMode('create')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                earnVgMode === 'create'
                  ? 'bg-gradient-to-r from-orange-500/80 to-red-600/80 text-white shadow-lg shadow-orange-500/25'
                  : 'text-slate-200 hover:text-white hover:bg-orange-500/8'
              )}
            >
              Token Burn
            </button>
            <button
              onClick={() => setEarnVgMode('lock')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                earnVgMode === 'lock'
                  ? 'bg-gradient-to-r from-purple-500/80 to-blue-600/80 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-200 hover:text-white hover:bg-purple-500/8'
              )}
            >
              LP Burn
            </button>
          </div>

          {/* Balances for Earn VG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {earnVgMode === 'create' ? (
              <>
                <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/8 via-blue-400/5 to-cyan-400/4 border border-blue-400/20 rounded-xl p-4 hover:from-blue-500/12 hover:via-blue-400/8 hover:to-cyan-400/6 transition-all duration-300 shadow-lg shadow-blue-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/25 border border-blue-400/30 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-blue-300/90" />
                    </div>
                    <div className="text-sm text-blue-200/80">VC Balance</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-300/90">
                    {balancesLoading ? (
                      <div className="animate-pulse bg-blue-400/20 h-6 w-16 rounded"></div>
                    ) : (
                      formatBalance(balances.VC || '0')
                    )}
                  </div>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/8 via-yellow-400/5 to-orange-400/4 border border-yellow-400/20 rounded-xl p-4 hover:from-yellow-500/12 hover:via-yellow-400/8 hover:to-orange-400/6 transition-all duration-300 shadow-lg shadow-yellow-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/25 border border-yellow-400/30 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-yellow-300/90" />
                    </div>
                    <div className="text-sm text-yellow-200/80">BNB Balance</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-300/90">
                    {balancesLoading ? (
                      <div className="animate-pulse bg-yellow-400/20 h-6 w-16 rounded"></div>
                    ) : (
                      formatBalance(balances.BNB || '0')
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/8 via-purple-400/5 to-pink-400/4 border border-purple-400/20 rounded-xl p-4 hover:from-purple-500/12 hover:via-purple-400/8 hover:to-pink-400/6 transition-all duration-300 shadow-lg shadow-purple-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/25 border border-purple-400/30 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-purple-300/90" />
                    </div>
                    <div className="text-sm text-purple-200/80">LP Balance</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-300/90">
                    {balancesLoading ? (
                      <div className="animate-pulse bg-purple-400/20 h-6 w-16 rounded"></div>
                    ) : (
                      formatBalance(balances.LP || '0')
                    )}
                  </div>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/8 via-green-400/5 to-emerald-400/4 border border-green-400/20 rounded-xl p-4 hover:from-green-500/12 hover:via-green-400/8 hover:to-emerald-400/6 transition-all duration-300 shadow-lg shadow-green-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/25 border border-green-400/30 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-green-300/90" />
                    </div>
                    <div className="text-sm text-green-200/80">VG Balance</div>
                  </div>
                  <div className="text-2xl font-bold text-green-300/90">
                    {balancesLoading ? (
                      <div className="animate-pulse bg-green-400/20 h-6 w-16 rounded"></div>
                    ) : (
                      formatBalance(balances.VG || '0')
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pool Information for Create mode */}
          {earnVgMode === 'create' && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/6 via-blue-500/4 to-indigo-500/3 border border-cyan-400/15 rounded-xl p-4 mb-6 hover:from-cyan-500/8 hover:via-blue-500/6 hover:to-indigo-500/4 transition-all duration-300 shadow-lg shadow-cyan-500/4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-cyan-200/80 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-300/80" />
                  Pool Information
                </span>
                {!poolInfo.isLoaded && (
                  <div className="flex items-center gap-1 text-xs text-yellow-300/80">
                    <AlertCircle className="w-3 h-3" />
                    Fallback
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-cyan-300/80 mb-1">VC Reserve</div>
                  <div className="font-medium text-white">
                    {poolLoading ? (
                      <div className="animate-pulse bg-cyan-400/20 h-4 w-16 rounded"></div>
                    ) : (
                      formatBalance(poolInfo.vcReserve)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-cyan-300/80 mb-1">BNB Reserve</div>
                  <div className="font-medium text-white">
                    {poolLoading ? (
                      <div className="animate-pulse bg-cyan-400/20 h-4 w-16 rounded"></div>
                    ) : (
                      formatBalance(poolInfo.bnbReserve)
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-4 mb-6">
            {earnVgMode === 'create' ? (
              <>
                <Input
                  type="number"
                  label="VC Amount"
                  value={vcAmount}
                  name="vcAmount"
                  placeholder="Enter VC amount"
                  onChange={(e) => setVcAmount(e.target.value)}
                  disabled={loading}
                  leftIcon={<Coins className="h-4 w-4 text-blue-400/80" />}
                />

                <Input
                  type="number"
                  label="BNB Amount (Auto-calculated)"
                  value={bnbAmount}
                  name="bnbAmount"
                  placeholder={poolInfo.isLoaded ? "Auto-calculated from VC" : "Using fallback ratio"}
                  onChange={(e) => setBnbAmount(e.target.value)}
                  disabled={loading}
                  leftIcon={<Coins className="h-4 w-4 text-yellow-400/80" />}
                />
              </>
            ) : (
              <Input
                type="number"
                label="LP Token Amount"
                value={lpAmount}
                name="lpAmount"
                placeholder="Enter LP token amount"
                onChange={(e) => setLpAmount(e.target.value)}
                disabled={loading}
                leftIcon={<Coins className="h-4 w-4 text-purple-400/80" />}
              />
            )}
          </div>

          {/* VG Reward Preview */}
          {((earnVgMode === 'create' && vcAmount && bnbAmount) || (earnVgMode === 'lock' && lpAmount)) && (
            <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/6 to-blue-500/6 border border-green-500/15 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400/80" />
                  Expected VG Reward:
                </span>
                <span className="text-lg font-bold text-green-400/90">
                  {calculateVGReward()} VG
                </span>
              </div>
            </div>
          )}

          {/* Allowance Check Button for Create mode */}
          {earnVgMode === 'create' && (
            <div className="mb-4">
              <button
                onClick={checkCurrentAllowance}
                disabled={checkingAllowance}
                className="w-full py-3 backdrop-blur-xl bg-slate-700/60 border border-slate-500/50 rounded-xl text-white hover:bg-slate-600/70 hover:border-slate-400/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingAllowance ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Checking allowance...
                  </>
                ) : (
                  <>
                    <Info className="h-4 w-4" />
                    Check VC Allowance ({formatBalance(currentAllowance)} VC)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={earnVgMode === 'create' ? handleEarnVG : handleLockLP}
            disabled={
              loading || 
              (earnVgMode === 'create' && (!vcAmount || !bnbAmount)) ||
              (earnVgMode === 'lock' && !lpAmount)
            }
            className="w-full py-4 bg-gradient-to-r from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 group"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                Burn / Earn VG
              </>
            )}
          </button>
        </>
      )}

      {/* Information */}
      <div className="mt-6 backdrop-blur-xl bg-gradient-to-br from-slate-700/40 via-slate-600/30 to-slate-500/20 border border-slate-400/30 rounded-xl p-4 shadow-lg shadow-slate-500/10">
        <div className="font-medium text-white mb-3 text-sm">
          {mode === 'buyvc' ? 'Buy VC Information:' : 'Earn VG Information:'}
        </div>
        <div className="text-xs text-slate-200 space-y-1">
          {mode === 'buyvc' ? (
            <>
              <div>• Purchase VC tokens directly with BNB</div>
              <div>• Fixed price rate set by contract</div>
              <div>• Instant delivery to your wallet</div>
              <div>• No slippage, MEV protection active</div>
            </>
          ) : (
            <>
              <div>• LP tokens are burned forever (permanent burn)</div>
              <div>• Get 10 VG for every 1 LP token (instantly)</div>
              <div>• VG tokens can be used for governance</div>
              <div>• This is NOT staking - LP cannot be retrieved</div>
              {earnVgMode === 'lock' && (
                <div>• Make sure you have ready LP tokens VC/BNB</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Export with Error Boundary
export default React.memo((props: SwapWidgetProps) => (
  <ErrorBoundary 
    componentName="SwapWidget"
    enableReporting={true}
  >
    <SwapWidget {...props} />
  </ErrorBoundary>
)); 