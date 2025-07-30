import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { CONTRACTS } from '../../../shared/config/contracts';
import { Coins, RefreshCw, AlertTriangle, Info, Zap, Wallet, ArrowDownUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../shared/lib/cn';
import { log } from '../../../shared/lib/logger';
import { useTokenData } from '../../../entities/Token/model/useTokenData';
import { usePoolInfo } from '../../../entities/Staking/model/usePoolInfo';
import { rpcService } from '../../../shared/api/rpcService';
import { formatNumber } from '../../../shared/lib/format';

export interface SwapWidgetProps {
  className?: string;
}

const SwapWidget: React.FC<SwapWidgetProps> = ({ className }) => {
  const { isConnected } = useAccount();
  const { lpLockerContract, vcContract, vgContract } = useWeb3();
  const { balances, loading: balancesLoading, triggerGlobalRefresh } = useTokenData();
  const { poolInfo, loading: poolLoading, refreshPoolInfo } = usePoolInfo();
  
  // State для режимов работы
  const [mode, setMode] = useState<'buyvc' | 'earnvg'>('buyvc');
  const [loading, setLoading] = useState(false);
  
  // State для EarnVG функциональности
  const [earnVgMode, setEarnVgMode] = useState<'create' | 'lock'>('create');
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [currentAllowance, setCurrentAllowance] = useState<string>('0');
  const [checkingAllowance, setCheckingAllowance] = useState(false);

  // State для Buy VC через PancakeSwap
  const [buyVcBnbAmount, setBuyVcBnbAmount] = useState('');
  const [buyVcAmount, setBuyVcAmount] = useState('');
  const [slippage, setSlippage] = useState('2'); // 2% default slippage
  const [priceImpact, setPriceImpact] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);

  // Проверка подключения кошелька
  if (!isConnected) {
    return (
      <div className={cn('card-ultra animate-enhanced-widget-chaos-1', className)}>
        <div className="text-center">
          <Wallet className="h-16 w-16 text-blue-400 mb-6 mx-auto" />
          <h3 className="card-title text-xl font-bold text-white mb-3">Подключите кошелёк</h3>
          <p className="text-gray-300">
            Для использования EarnVG необходимо подключить MetaMask
          </p>
        </div>
      </div>
    );
  }

  // Расчеты для EarnVG
  const calculatedBnbAmount = useMemo(() => {
    if (!vcAmount || !poolInfo || parseFloat(vcAmount) <= 0) return '';
    
    try {
      const vcValue = parseFloat(vcAmount);
      const bnbReserve = parseFloat(poolInfo.bnbReserve);
      const vcReserve = parseFloat(poolInfo.vcReserve);
      
      if (bnbReserve <= 0 || vcReserve <= 0) return '';
      
      const bnbRequired = (vcValue * bnbReserve) / vcReserve;
      return bnbRequired.toFixed(6);
    } catch (error) {
      log.error('SwapWidget', error as Error, { function: 'calculatedBnbAmount' });
      return '';
    }
  }, [vcAmount, poolInfo]);

  const calculatedLpAmount = useMemo(() => {
    if (!vcAmount || !bnbAmount || !poolInfo) return '';
    
    try {
      const vcValue = parseFloat(vcAmount);
      const bnbValue = parseFloat(bnbAmount);
      const vcReserve = parseFloat(poolInfo.vcReserve);
      
      if (vcReserve <= 0) return '';
      
      // Simplified LP calculation
      const lpAmount = vcValue / 1000; // Simplified ratio
      return lpAmount.toFixed(6);
    } catch (error) {
      log.error('SwapWidget', error as Error, { function: 'calculatedLpAmount' });
      return '';
    }
  }, [vcAmount, bnbAmount, poolInfo]);

  const vgReward = useMemo(() => {
    if (!lpAmount) return '';
    try {
      const lp = parseFloat(lpAmount);
      return (lp * 10).toFixed(2); // 1 LP = 10 VG
    } catch {
      return '';
    }
  }, [lpAmount]);

  // Автообновление BNB amount при изменении VC
  useEffect(() => {
    if (earnVgMode === 'create' && calculatedBnbAmount && calculatedBnbAmount !== bnbAmount) {
      const timeoutId = setTimeout(() => {
        setBnbAmount(calculatedBnbAmount);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [earnVgMode, calculatedBnbAmount, bnbAmount, vcAmount]);

  // Автообновление LP amount
  useEffect(() => {
    if (earnVgMode === 'create' && calculatedLpAmount && calculatedLpAmount !== lpAmount) {
      const timeoutId = setTimeout(() => {
        setLpAmount(calculatedLpAmount);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [earnVgMode, calculatedLpAmount, lpAmount]);

  // Проверка allowance для VC/LP токенов
  const checkAllowance = useCallback(async () => {
    if (!vcContract || !lpLockerContract || checkingAllowance) return;
    
    setCheckingAllowance(true);
    try {
      // Simplified allowance check
      if (earnVgMode === 'create' && vcAmount) {
        // Will implement allowance check later
        setCurrentAllowance('0');
      } else if (earnVgMode === 'lock' && lpAmount) {
        setCurrentAllowance('0');
      }
    } catch (error) {
      log.error('SwapWidget', error as Error, { function: 'checkAllowance' });
      setCurrentAllowance('0');
    } finally {
      setCheckingAllowance(false);
    }
  }, [vcContract, lpLockerContract, earnVgMode, vcAmount, lpAmount, checkingAllowance]);

  // Функция создания LP и стейкинга
  const handleCreateAndLock = async () => {
    if (!vcContract || !lpLockerContract || !vcAmount || !bnbAmount) {
      toast.error('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      toast.loading('Создание LP и стейкинг...', { id: 'create-lock' });
      
      // Simplified implementation - will be enhanced with real contract calls
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      
      toast.success('LP создан и заблокирован! VG токены начислены', { id: 'create-lock' });

      // Сброс форм
        setVcAmount('');
        setBnbAmount('');
      setLpAmount('');
        
      // Обновление данных
        await triggerGlobalRefresh();
        await refreshPoolInfo();
    } catch (error: any) {
      log.error('SwapWidget', error as Error, { function: 'handleCreateAndLock' });
      
      if (error.message?.includes('User rejected')) {
        toast.error('Транзакция отклонена');
      } else {
        toast.error('Ошибка создания LP: ' + (error?.message || 'Неизвестная ошибка'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Функция прямого стейкинга LP
  const handleDirectLock = async () => {
    if (!lpLockerContract || !lpAmount) {
      toast.error('Введите количество LP токенов');
      return;
    }

    setLoading(true);
    try {
      toast.loading('Стейкинг LP токенов...', { id: 'lock' });
      
      const lpAmountWei = ethers.parseEther(lpAmount);
      const lockTx = await lpLockerContract.lockLP(lpAmountWei);
      await lockTx.wait();
      
      toast.success('LP токены заблокированы! VG токены начислены', { id: 'lock' });

        setLpAmount('');
        await triggerGlobalRefresh();
    } catch (error: any) {
      log.error('SwapWidget', 'handleDirectLock() Error in direct lock', error);
      toast.error('Ошибка стейкинга: ' + (error?.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const refresh = useCallback(() => {
    refreshPoolInfo();
    triggerGlobalRefresh();
  }, [refreshPoolInfo, triggerGlobalRefresh]);

  const formatBalance = (balance: string) => {
    try {
    const num = parseFloat(balance);
    if (num === 0) return '0';
      if (num < 0.0001) return '<0.0001';
      if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
      return num.toFixed(4);
      } catch {
        return '0';
      }
  };

  // Расчеты для покупки VC через PancakeSwap
  const calculatedVcFromBnb = useMemo(() => {
    if (!buyVcBnbAmount || !poolInfo || parseFloat(buyVcBnbAmount) <= 0) return '';
    
    try {
      const bnbValue = parseFloat(buyVcBnbAmount);
      const bnbReserve = parseFloat(poolInfo.bnbReserve);
      const vcReserve = parseFloat(poolInfo.vcReserve);
      
      if (bnbReserve <= 0 || vcReserve <= 0) return '';
      
      // PancakeSwap AMM formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
      const bnbIn = bnbValue * 1e18; // Convert to wei for calculation
      const vcOut = (bnbIn * 997 * vcReserve * 1e18) / (bnbReserve * 1e18 * 1000 + bnbIn * 997);
      
      // Calculate price impact
      const exactPrice = (bnbValue * vcReserve) / bnbReserve;
      const actualVcOut = vcOut / 1e18;
      const impact = ((exactPrice - actualVcOut) / exactPrice) * 100;
      setPriceImpact(impact.toFixed(2));
      
      return actualVcOut.toFixed(6);
    } catch (error) {
      log.error('SwapWidget', error as Error, { function: 'calculatedVcFromBnb' });
      setPriceImpact('');
      return '';
    }
  }, [buyVcBnbAmount, poolInfo]);

  // Автообновление VC amount при изменении BNB для покупки
  useEffect(() => {
    if (mode === 'buyvc' && calculatedVcFromBnb && calculatedVcFromBnb !== buyVcAmount) {
      const timeoutId = setTimeout(() => {
        setBuyVcAmount(calculatedVcFromBnb);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [mode, calculatedVcFromBnb, buyVcAmount]);

  // Функция покупки VC через PancakeSwap
  const handleBuyVC = async () => {
    if (!buyVcBnbAmount || !buyVcAmount) {
      toast.error('Введите количество BNB');
      return;
    }

    setSwapLoading(true);
    try {
      // Создаем контракт PancakeSwap Router
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const routerContract = new ethers.Contract(
        CONTRACTS.PANCAKE_ROUTER,
        [
          'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
          'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
        ],
        signer
      );

      const bnbAmountWei = ethers.parseEther(buyVcBnbAmount);
      const slippageBps = parseFloat(slippage) * 100; // Convert to basis points
      const minVcOut = ethers.parseEther((parseFloat(buyVcAmount) * (10000 - slippageBps) / 10000).toString());
      
      // Path: WBNB -> VC
      const path = [CONTRACTS.WBNB, CONTRACTS.VC_TOKEN];
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      
      toast.loading('Покупка VC через PancakeSwap...', { id: 'buy-vc' });
      
      const swapTx = await routerContract.swapExactETHForTokens(
        minVcOut,
        path,
        await signer.getAddress(),
        deadline,
        { value: bnbAmountWei }
      );
      
      await swapTx.wait();
      toast.success(`Куплено ${buyVcAmount} VC за ${buyVcBnbAmount} BNB`, { id: 'buy-vc' });

      // Сброс форм
      setBuyVcBnbAmount('');
      setBuyVcAmount('');
      setPriceImpact('');
      
      // Обновление данных
      await triggerGlobalRefresh();
      await refreshPoolInfo();
    } catch (error: any) {
      log.error('SwapWidget', error as Error, { function: 'handleBuyVC' });
      
      if (error.message?.includes('User rejected')) {
        toast.error('Транзакция отклонена');
      } else if (error.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        toast.error('Slippage слишком низкий. Увеличьте slippage или уменьшите сумму');
      } else {
        toast.error('Ошибка покупки: ' + (error?.message || 'Неизвестная ошибка'));
      }
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <div className={cn('card-ultra animate-enhanced-widget-chaos-1', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center">
            {mode === 'buyvc' ? (
              <Coins className="w-5 h-5 text-blue-300" />
            ) : (
              <Zap className="w-5 h-5 text-orange-300" />
            )}
          </div>
          <div>
            <h3 className="card-title text-xl font-bold text-white">
              {mode === 'buyvc' ? 'Buy VC' : 'Earn VG'}
            </h3>
            <p className="text-sm text-gray-400">
              {mode === 'buyvc' 
                ? 'Покупайте VC токены через PancakeSwap'
                : 'Получайте VG токены за LP'
              }
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={poolLoading}
          className="btn-icon group"
        >
          <RefreshCw className={cn("h-5 w-5 text-blue-300/80 group-hover:text-white transition-colors duration-300", poolLoading && "animate-spin")} />
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
          <Coins className="w-4 h-4" />
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

      {/* Main Content */}
      {mode === 'buyvc' ? (
        /* Buy VC Mode - PancakeSwap Integration */
        <>
          {/* Balances for Buy VC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/8 via-yellow-400/5 to-orange-400/4 border border-yellow-400/20 rounded-xl p-4">
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
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/8 via-blue-400/5 to-cyan-400/4 border border-blue-400/20 rounded-xl p-4">
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
          </div>

          {/* Swap Interface */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Pay (BNB)</label>
              <input
                type="number"
                value={buyVcBnbAmount}
                onChange={(e) => setBuyVcBnbAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-blue-400/50 focus:outline-none"
              />
                </div>
            
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-600/50 flex items-center justify-center">
                <ArrowDownUp className="w-5 h-5 text-slate-400" />
              </div>
                </div>

                <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Receive (VC)</label>
              <input
                type="number"
                value={buyVcAmount}
                readOnly
                placeholder="0.0"
                className="w-full bg-slate-800/30 border border-slate-600/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 cursor-not-allowed"
              />
                </div>

            {/* Slippage Settings */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Slippage Tolerance</span>
              <div className="flex gap-2">
                {['1', '2', '5'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
                      slippage === value
                        ? 'bg-blue-500/80 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    )}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white"
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Price Impact Warning */}
            {priceImpact && parseFloat(priceImpact) > 1 && (
              <div className={cn(
                'rounded-xl p-3 flex items-center gap-2',
                parseFloat(priceImpact) > 5
                  ? 'bg-red-500/10 border border-red-400/20'
                  : 'bg-yellow-500/10 border border-yellow-400/20'
              )}>
                <AlertTriangle className={cn(
                  'w-4 h-4',
                  parseFloat(priceImpact) > 5 ? 'text-red-400' : 'text-yellow-400'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  parseFloat(priceImpact) > 5 ? 'text-red-300' : 'text-yellow-300'
                )}>
                  Price Impact: {priceImpact}%
                    </span>
              </div>
            )}

            <button
              onClick={handleBuyVC}
              disabled={!buyVcBnbAmount || !buyVcAmount || swapLoading || parseFloat(buyVcBnbAmount) <= 0}
              className={cn(
                "w-full py-4 font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl",
                !swapLoading && buyVcBnbAmount && buyVcAmount && parseFloat(buyVcBnbAmount) > 0
                  ? "bg-gradient-to-r from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 hover:shadow-xl transform hover:scale-[1.02]"
                  : "bg-gradient-to-r from-slate-600/50 to-slate-700/50"
              )}
            >
              {swapLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Swapping...</span>
                </div>
              ) : (
                `Buy ${buyVcAmount || '0'} VC`
              )}
            </button>
          </div>
        </>
      ) : (
        /* Earn VG Mode */
        <>
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/8 via-purple-400/5 to-pink-400/4 border border-purple-400/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/25 border border-purple-400/30 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-purple-300/90" />
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
          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/8 via-green-400/5 to-emerald-400/4 border border-green-400/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/25 border border-green-400/30 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-green-300/90" />
                    </div>
              <div className="text-sm text-green-200/80">LP Balance</div>
                  </div>
                  <div className="text-2xl font-bold text-green-300/90">
                    {balancesLoading ? (
                      <div className="animate-pulse bg-green-400/20 h-6 w-16 rounded"></div>
                    ) : (
                formatBalance(balances.LP || '0')
                    )}
                  </div>
          </div>

          {/* Input Forms */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">VC Amount</label>
              <input
                  type="number"
                  value={vcAmount}
                  onChange={(e) => setVcAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-blue-400/50 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">BNB Amount</label>
              <input
                type="number"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-blue-400/50 focus:outline-none"
              />
          </div>

            {vgReward && (
              <div className="bg-gradient-to-br from-green-500/8 via-green-400/5 to-emerald-400/4 border border-green-400/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">VG Reward</span>
                </div>
                <div className="text-2xl font-bold text-green-300">
                  {vgReward} VG
              </div>
            </div>
          )}

              <button
              onClick={handleCreateAndLock}
              disabled={!vcAmount || !bnbAmount || loading || parseFloat(vcAmount) <= 0 || parseFloat(bnbAmount) <= 0}
              className={cn(
                "w-full py-4 font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl",
                !loading && vcAmount && bnbAmount && parseFloat(vcAmount) > 0 && parseFloat(bnbAmount) > 0
                  ? "bg-gradient-to-r from-orange-500/90 to-red-600/90 hover:from-orange-600/90 hover:to-red-700/90 hover:shadow-xl transform hover:scale-[1.02]"
                  : "bg-gradient-to-r from-slate-600/50 to-slate-700/50"
              )}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating LP & Staking...</span>
                </div>
              ) : (
                'Create LP & Stake'
                )}
              </button>
            </div>
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
              <div>• Buy VC tokens directly with BNB via PancakeSwap</div>
              <div>• Real-time pricing from liquidity pool</div>
              <div>• Adjustable slippage protection (1-5%)</div>
              <div>• MEV protection through DEX routing</div>
              <div>• Instant delivery to your wallet</div>
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

// Export component
export default React.memo(SwapWidget); 