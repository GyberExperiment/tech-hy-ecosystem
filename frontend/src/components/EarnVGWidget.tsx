import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS } from '../constants/contracts';
import { toast } from 'react-hot-toast';
import { Coins, Zap, TrendingUp, Wallet, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTokenData } from '../hooks/useTokenData';
import { usePoolInfo } from '../hooks/usePoolInfo';

interface EarnVGWidgetProps {
  className?: string;
}

const EarnVGWidget: React.FC<EarnVGWidgetProps> = ({ className = '' }) => {
  const { account, signer, isConnected, vcContract, lpLockerContract, lpContract } = useWeb3();
  
  // Use centralized hooks
  const { balances, loading: balancesLoading, fetchTokenData } = useTokenData();
  const { poolInfo, loading: poolLoading, refreshPoolInfo } = usePoolInfo();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'lock'>('create');
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  
  // Memoized calculations
  const calculatedBnbAmount = useMemo(() => {
    if (!vcAmount || !poolInfo.isLoaded || poolInfo.vcReserve === '0' || poolInfo.bnbReserve === '0') {
      return '';
    }
    
    try {
      const vcValue = parseFloat(vcAmount);
      if (isNaN(vcValue) || vcValue <= 0) return '';
      
      const ratio = parseFloat(poolInfo.bnbReserve) / parseFloat(poolInfo.vcReserve);
      const calculatedBnb = (vcValue * ratio).toFixed(6);
      
      console.log(`EarnVGWidget: Auto-calc BNB: ${vcValue} VC * ${ratio.toFixed(8)} = ${calculatedBnb} BNB`);
      return calculatedBnb;
    } catch (error) {
      console.error('EarnVGWidget: Error calculating BNB amount:', error);
      return '';
    }
  }, [vcAmount, poolInfo]);

  // Auto-update BNB amount when VC changes
  useEffect(() => {
    if (calculatedBnbAmount && calculatedBnbAmount !== bnbAmount) {
      setBnbAmount(calculatedBnbAmount);
    }
  }, [calculatedBnbAmount]);

  // Transaction handlers
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
      const vcContractWithSigner = vcContract.connect(signer);

      // Check and approve VC tokens
      const allowance = await (vcContractWithSigner as any).allowance(account, CONTRACTS.LP_LOCKER);
      if (allowance < vcAmountWei) {
        toast.loading('Подтверждение VC токенов...');
        const approveTx = await (vcContractWithSigner as any).approve(CONTRACTS.LP_LOCKER, vcAmountWei);
        await approveTx.wait();
      }

      const lpLockerWithSigner = lpLockerContract.connect(signer);

      toast.loading('Создание LP позиции и получение VG токенов...');
      
      let finalSlippage = 1500; // 15%
      try {
        const config = await (lpLockerWithSigner as any).config();
        const maxAllowedSlippage = config[11];
        if (finalSlippage > maxAllowedSlippage) {
          finalSlippage = maxAllowedSlippage;
        }
      } catch {
        // Use default slippage
      }

      const tx = await (lpLockerWithSigner as any).earnVG(vcAmountWei, bnbAmountWei, finalSlippage, {
        value: bnbAmountWei,
        gasLimit: 500000,
      });
      
      toast.loading('Ожидание подтверждения транзакции...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success('VG токены успешно получены!');
        
        // Refresh data
        setTimeout(() => {
          fetchTokenData(true);
          refreshPoolInfo();
        }, 2000);

        setVcAmount('');
        setBnbAmount('');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('EarnVG Error:', error);
      
      if (error.message?.includes('Too frequent transactions')) {
        toast.error('MEV Protection: Подождите 5 минут между транзакциями');
      } else if (error.message?.includes('Slippage exceeded')) {
        toast.error('Slippage превышен. Попробуйте позже');
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

  const handleLockLP = async () => {
    if (!signer || !account || !lpContract || !lpLockerContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    if (!lpAmount) {
      toast.error('Введите количество LP токенов');
      return;
    }

    const lpAmountWei = ethers.parseEther(lpAmount);

    if (parseFloat(balances.LP || '0') < parseFloat(lpAmount)) {
      toast.error('Недостаточно LP токенов');
      return;
    }

    setLoading(true);

    try {
      const lpContractWithSigner = lpContract.connect(signer);

      // Check and approve LP tokens
      const allowance = await (lpContractWithSigner as any).allowance(account, CONTRACTS.LP_LOCKER);
      if (allowance < lpAmountWei) {
        toast.loading('Подтверждение LP токенов...');
        const approveTx = await (lpContractWithSigner as any).approve(CONTRACTS.LP_LOCKER, lpAmountWei);
        await approveTx.wait();
      }

      const lpLockerWithSigner = lpLockerContract.connect(signer);

      toast.loading('Блокировка LP токенов и получение VG наград...');
      
      const tx = await (lpLockerWithSigner as any).lockLPTokens(lpAmountWei, {
        gasLimit: 300000,
      });
      
      toast.loading('Ожидание подтверждения транзакции...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success('LP токены заблокированы, VG награды получены!');
        
        // Refresh data
        setTimeout(() => {
          fetchTokenData(true);
          refreshPoolInfo();
        }, 2000);

        setLpAmount('');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('LockLP Error:', error);
      
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
    if (mode === 'create') {
      if (!vcAmount || !bnbAmount) return '0';
      try {
        const vcValue = parseFloat(vcAmount);
        const bnbValue = parseFloat(bnbAmount);
        const lpAmount = Math.sqrt(vcValue * bnbValue);
        const vgReward = lpAmount * 15;
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    } else {
      if (!lpAmount) return '0';
      try {
        const lpValue = parseFloat(lpAmount);
        const vgReward = lpValue * 15;
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    }
  };

  const refreshAllData = async () => {
    console.log('EarnVGWidget: Manual refresh triggered');
    await fetchTokenData(true);
    await refreshPoolInfo();
  };

  if (!isConnected) {
    return (
      <div className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl ${className}`}>
        <div className="text-center">
          <Wallet className="h-16 w-16 text-blue-400 mb-6 mx-auto" />
          <h3 className="text-xl font-bold text-white mb-3">Подключите кошелёк</h3>
          <p className="text-gray-300">
            Для использования LP Staking необходимо подключить MetaMask
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30">
            <Zap className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">⚡ Получить VG токены</h3>
            <p className="text-gray-300 text-sm">
              {mode === 'create' 
                ? 'Создайте LP позицию и получите VG (15:1)'
                : 'Заблокируйте LP токены и получите VG (15:1)'
              }
            </p>
          </div>
        </div>
        <button
          onClick={refreshAllData}
          disabled={poolLoading}
          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <RefreshCw className={cn("h-5 w-5", poolLoading && "animate-spin")} />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-black/40 p-1 border border-gray-600/50 mb-6">
        <button
          onClick={() => setMode('create')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
            mode === 'create'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          )}
        >
          Create LP
        </button>
        <button
          onClick={() => setMode('lock')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
            mode === 'lock'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          )}
        >
          Lock LP Tokens
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {mode === 'create' ? (
          <>
            <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-sm text-gray-400 mb-1">VC Balance</div>
              <div className="text-xl font-bold text-blue-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                ) : (
                  formatBalance(balances.VC || '0')
                )}
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-sm text-gray-400 mb-1">BNB Balance</div>
              <div className="text-xl font-bold text-amber-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                ) : (
                  formatBalance(balances.BNB || '0')
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-sm text-gray-400 mb-1">LP Balance</div>
              <div className="text-xl font-bold text-purple-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                ) : (
                  formatBalance(balances.LP || '0')
                )}
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-sm text-gray-400 mb-1">VG Balance</div>
              <div className="text-xl font-bold text-green-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                ) : (
                  formatBalance(balances.VG || '0')
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pool Information */}
      {mode === 'create' && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/30 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Pool Information
            </span>
            {!poolInfo.isLoaded && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Fallback
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">VC Reserve</div>
              <div className="font-medium text-white">
                {poolLoading ? (
                  <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
                ) : (
                  formatBalance(poolInfo.vcReserve)
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">BNB Reserve</div>
              <div className="font-medium text-white">
                {poolLoading ? (
                  <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
                ) : (
                  formatBalance(poolInfo.bnbReserve)
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-500/30">
            <div className="text-xs text-gray-400">Current Price</div>
            <div className="text-sm font-medium text-green-400">
              {poolLoading ? (
                <div className="animate-pulse bg-gray-600 h-4 w-24 rounded"></div>
              ) : (
                `1 VC = ${poolInfo.price} BNB`
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-4 mb-6">
        {mode === 'create' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-white mb-2">VC Amount</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Coins className="h-4 w-4 text-blue-400" />
                </div>
                <input
                  type="number"
                  placeholder="Enter VC amount"
                  value={vcAmount}
                  onChange={(e) => setVcAmount(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">BNB Amount (Auto-calculated)</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Coins className="h-4 w-4 text-amber-400" />
                </div>
                <input
                  type="number"
                  placeholder={poolInfo.isLoaded ? "Auto-calculated from VC" : "Using fallback ratio"}
                  value={bnbAmount}
                  onChange={(e) => setBnbAmount(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-white mb-2">LP Token Amount</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Coins className="h-4 w-4 text-purple-400" />
              </div>
              <input
                type="number"
                placeholder="Enter LP token amount"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* VG Reward Preview */}
      {((mode === 'create' && vcAmount && bnbAmount) || (mode === 'lock' && lpAmount)) && (
        <div className="rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/40 p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Expected VG Reward:
            </span>
            <span className="text-xl font-bold text-green-400">
              {calculateVGReward()} VG
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={mode === 'create' ? handleEarnVG : handleLockLP}
        disabled={
          loading || 
          (mode === 'create' && (!vcAmount || !bnbAmount)) ||
          (mode === 'lock' && !lpAmount)
        }
        className={cn(
          "w-full h-12 text-base font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        )}
      >
        {loading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" />
            {mode === 'create' ? 'Create LP + Earn VG' : 'Lock LP + Earn VG'}
          </>
        )}
      </button>

      {/* Information */}
      <div className="mt-6 space-y-2 bg-black/20 rounded-lg p-4 border border-gray-600/30">
        <div className="font-medium text-white mb-3">Important Information:</div>
        <div className="text-sm text-gray-300 space-y-1">
          <div>• LP токены блокируются навсегда (permanent lock)</div>
          <div>• Получаете 15 VG за каждый 1 LP токен (мгновенно)</div>
          <div>• VG токены можно использовать для governance</div>
          <div>• Это НЕ стейкинг - LP нельзя забрать обратно</div>
          {mode === 'lock' && (
            <div>• Убедитесь, что у вас есть готовые LP токены VC/BNB</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarnVGWidget; 