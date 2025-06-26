import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { CONTRACTS } from '../../../shared/config/contracts';
import { toast } from 'react-hot-toast';
import { Coins, Zap, TrendingUp, Wallet, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { useCryptoDataManager, withContractSafety } from '../../../shared/lib/useCryptoDataManager';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';

interface EarnVGWidgetProps {
  className?: string;
}

const EarnVGWidget: React.FC<EarnVGWidgetProps> = ({ className }) => {
  // ✅ Используем централизованную систему данных
  const {
    balances,
    poolData,
    tokensLoading,
    poolLoading,
    refreshAll,
    formatBalance,
    contractsReady,
    isSystemReady
  } = useCryptoDataManager();

  const { 
    account, 
    signer, 
    isConnected, 
    isCorrectNetwork,
    vcContract, 
    lpLockerContract, 
    vgContract 
  } = useWeb3();
  
  // State management
  const [mode, setMode] = useState<'create' | 'lock'>('create');
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAllowance, setCurrentAllowance] = useState('0');
  const [vaultVGBalance, setVaultVGBalance] = useState('0');
  const [maxSlippageBps, setMaxSlippageBps] = useState(200);
  const [mevEnabled, setMevEnabled] = useState(false);

  // ✅ Мемоизированные проверки готовности контрактов
  const isContractsReady = useMemo(() => {
    return contractsReady.vcContract && 
           contractsReady.lpLockerContract && 
           contractsReady.vgContract;
  }, [contractsReady]);

  // ✅ Исправленная функция расчета VG наград с гарантированным return
  const calculateVGReward = (): string => {
    if (mode === 'create') {
      if (!vcAmount || !bnbAmount) return '0';
    try {
      const vcValue = parseFloat(vcAmount);
        const bnbValue = parseFloat(bnbAmount);
        
        if (vcValue <= 0 || bnbValue <= 0) return '0';
        
        // ✅ Используем данные из централизованной системы
        const lpToVgRatio = parseFloat(poolData.lpToVgRatio) || 10;
        const lpAmount = Math.sqrt(vcValue * bnbValue);
        const vgReward = lpAmount * lpToVgRatio;
        
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    } else if (mode === 'lock') {
      if (!lpAmount) return '0';
      try {
        const lpValue = parseFloat(lpAmount);
        if (lpValue <= 0) return '0';
        
        const lpToVgRatio = parseFloat(poolData.lpToVgRatio) || 10;
        const vgReward = lpValue * lpToVgRatio;
        
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    }
    
    // ✅ Гарантированный return для всех путей
    return '0';
  };

  // Check allowance when amount changes
  useEffect(() => {
    if (vcAmount && account && contractsReady.vcContract) {
      checkAllowance();
    }
  }, [vcAmount, account, contractsReady.vcContract]);

  // Load vault VG balance on mount
  useEffect(() => {
    if (isSystemReady) {
      loadVaultVGBalance();
    }
  }, [isSystemReady]);

  const checkAllowance = async () => {
    if (!vcAmount || !account || !vcContract) return;

    try {
      const allowance = await withContractSafety(
        vcContract,
        async (contract) => rpcService.withFallback(async (provider) => {
          const vcContractInstance = contract.connect(provider);
          return await (vcContractInstance as any).allowance(account, CONTRACTS.LP_LOCKER);
        }),
        '0'
      );
      
      setCurrentAllowance(ethers.formatEther(allowance));
    } catch (error) {
      log.error('Failed to check allowance', { error });
      setCurrentAllowance('0');
    }
  };

  const loadVaultVGBalance = async () => {
    if (!vgContract) return;

    try {
      const balance = await withContractSafety(
        vgContract,
        async (contract) => rpcService.withFallback(async (provider) => {
          const vgContractInstance = contract.connect(provider);
          return await (vgContractInstance as any).balanceOf(CONTRACTS.VG_VAULT);
        }),
        '0'
      );
      
      setVaultVGBalance(ethers.formatEther(balance));
    } catch (error) {
      log.error('Failed to load vault VG balance', { error });
      setVaultVGBalance('0');
    }
  };

  // Transaction handlers with improved safety
  const handleEarnVG = async () => {
    // ✅ Comprehensive safety checks
    if (!account || !signer || !isContractsReady) {
      toast.error('Подключите кошелек и убедитесь что все контракты готовы');
      return;
    }

    if (!vcContract || !lpLockerContract) {
      toast.error('Контракты не инициализированы. Попробуйте переподключить кошелек.');
      return;
    }

    setLoading(true);
    
    try {
      let tx;
      
      if (mode === 'create') {
        if (!vcAmount || !bnbAmount) {
          toast.error('Введите корректные суммы');
        return;
      }
      
      const vcAmountWei = ethers.parseEther(vcAmount);
      const bnbAmountWei = ethers.parseEther(bnbAmount);

        // Check and handle VC approval with null safety
        const currentAllowanceWei = ethers.parseEther(currentAllowance);
        if (currentAllowanceWei < vcAmountWei) {
          toast.loading('Подтверждение разрешения VC токенов...', { id: 'vc-approval' });
          
          // ✅ Null-safe contract call
          if (!vcContract) {
            throw new Error('VC контракт не инициализирован');
          }
          
          const approveTx = await (vcContract as any).approve(CONTRACTS.LP_LOCKER, vcAmountWei);
          await approveTx.wait();
            
            toast.success('Разрешение VC токенов подтверждено!', { id: 'vc-approval' });
            setCurrentAllowance(ethers.formatEther(vcAmountWei));
        }

        // Execute burnAndEarnVG with null safety
        toast.loading('Создание LP токенов и получение VG наград...', { id: 'earn-vg' });
        
        try {
          // ✅ Null-safe contract call
          if (!lpLockerContract) {
            throw new Error('LP Locker контракт не инициализирован');
          }
          
          tx = await (lpLockerContract as any).burnAndEarnVG(
            vcAmountWei,
            bnbAmountWei,
            maxSlippageBps,
            mevEnabled,
            { value: bnbAmountWei }
          );
        } catch (contractError: any) {
          throw new Error(`Ошибка контракта: ${contractError.message}`);
        }

      } else if (mode === 'lock') {
        if (!lpAmount) {
          toast.error('Введите количество LP токенов');
          return;
        }

        const lpAmountWei = ethers.parseEther(lpAmount);
        toast.loading('Блокировка LP токенов и получение VG наград...', { id: 'earn-vg' });
        
        try {
          // ✅ Null-safe contract call
          if (!lpLockerContract) {
            throw new Error('LP Locker контракт не инициализирован');
          }
          
          tx = await (lpLockerContract as any).lockLPAndEarnVG(lpAmountWei);
        } catch (contractError: any) {
          throw new Error(`Ошибка контракта: ${contractError.message}`);
        }
      }

      if (tx) {
        log.info('Transaction sent', { txHash: tx.hash });
        const receipt = await tx.wait();

        toast.success('VG награды успешно получены!', { id: 'earn-vg' });
        
        // Refresh all data
        refreshAll();
        
        // Clear inputs
        setVcAmount('');
        setBnbAmount('');
        setLpAmount('');
        
        log.info('Transaction confirmed', { 
          txHash: receipt.transactionHash,
          gasUsed: receipt.gasUsed?.toString()
        });
      }

    } catch (error: any) {
      log.error('Transaction failed', { error: error.message });
      
      if (error.message.includes('insufficient funds')) {
        toast.error('Недостаточно средств для транзакции');
      } else if (error.message.includes('user rejected')) {
        toast.error('Транзакция отменена пользователем');
      } else {
        toast.error(`Ошибка: ${error.message}`);
      }
    } finally {
      setLoading(false);
      toast.dismiss('earn-vg');
      toast.dismiss('vc-approval');
    }
  };

  // UI helpers
  const setMaxVC = () => {
    setVcAmount(balances.VC);
  };

  const setMaxBNB = () => {
    const maxBNB = Math.max(0, parseFloat(balances.BNB) - 0.01); // Reserve for gas
    setBnbAmount(maxBNB.toFixed(4));
  };

  const setMaxLP = () => {
    setLpAmount(balances.LP);
  };

  // ✅ Loading state
  if (tokensLoading || poolLoading) {
    return (
      <div className={cn("card", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded mb-4"></div>
          <div className="h-20 bg-slate-700 rounded mb-4"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  // ✅ Not connected state
  if (!isConnected) {
    return (
      <div className={cn("card text-center", className)}>
        <Wallet className="mx-auto mb-4 text-blue-400" size={48} />
        <h3 className="text-lg font-semibold mb-2">Earn VG Rewards</h3>
        <p className="text-gray-400 mb-4">
          Подключите кошелёк для создания LP токенов и получения VG наград
        </p>
        <button className="btn-primary">
          Подключить кошелёк
        </button>
      </div>
    );
  }

  const vgReward = calculateVGReward();
  const hasInsufficientBalance = mode === 'create' 
    ? (parseFloat(vcAmount || '0') > parseFloat(balances.VC) || parseFloat(bnbAmount || '0') > parseFloat(balances.BNB))
    : parseFloat(lpAmount || '0') > parseFloat(balances.LP);

  return (
    <div className={cn("card", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <Zap className="mr-3 text-yellow-400" />
          Earn VG Rewards
        </h3>
          <button
          onClick={refreshAll}
          className="btn-secondary p-2"
          disabled={tokensLoading}
        >
          <RefreshCw className={tokensLoading ? 'animate-spin' : ''} size={16} />
          </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex space-x-1 p-1 bg-slate-800 rounded-lg mb-6">
        <button
          onClick={() => setMode('create')}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            mode === 'create'
              ? "bg-blue-600 text-white" 
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          Create LP & Earn VG
        </button>
        <button
          onClick={() => setMode('lock')}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            mode === 'lock'
              ? "bg-blue-600 text-white" 
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          Lock LP & Earn VG
        </button>
      </div>

      {/* Input Section */}
        {mode === 'create' ? (
        <div className="space-y-4 mb-6">
          {/* VC Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              VC Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={vcAmount}
                onChange={(e) => setVcAmount(e.target.value)}
                placeholder="0.0"
                className="input w-full pr-16"
              />
              <button
                onClick={setMaxVC}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm font-medium hover:text-blue-300"
              >
                MAX
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Balance: {formatBalance(balances.VC)} VC
            </div>
          </div>

          {/* BNB Input */}
            <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              BNB Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
                placeholder="0.0"
                className="input w-full pr-16"
              />
              <button
                onClick={setMaxBNB}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm font-medium hover:text-blue-300"
              >
                MAX
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Balance: {formatBalance(balances.BNB)} BNB
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {/* LP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LP Tokens Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
                placeholder="0.0"
                className="input w-full pr-16"
              />
              <button
                onClick={setMaxLP}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm font-medium hover:text-blue-300"
              >
                MAX
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Balance: {formatBalance(balances.LP)} LP
            </div>
            </div>
          </div>
        )}

      {/* VG Reward Preview */}
      {vgReward !== '0' && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins className="text-yellow-400" size={16} />
              <span className="text-sm text-gray-300">Expected VG Reward:</span>
            </div>
            <div className="text-lg font-semibold text-yellow-400">
              {vgReward} VG
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
        <div className="bg-slate-800/50 rounded p-3">
          <div className="text-gray-400 mb-1">Vault VG Balance</div>
          <div className="font-semibold">{formatBalance(vaultVGBalance)} VG</div>
        </div>
        <div className="bg-slate-800/50 rounded p-3">
          <div className="text-gray-400 mb-1">LP → VG Ratio</div>
          <div className="font-semibold">{poolData.lpToVgRatio}x</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleEarnVG}
        disabled={
          loading || 
          !isSystemReady || 
          hasInsufficientBalance ||
          (mode === 'create' && (!vcAmount || !bnbAmount)) ||
          (mode === 'lock' && !lpAmount)
        }
        className="btn-primary w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : hasInsufficientBalance ? (
          'Insufficient Balance'
        ) : (
          `${mode === 'create' ? 'Create LP &' : 'Lock LP &'} Earn VG`
        )}
      </button>

      {/* Warnings */}
      {hasInsufficientBalance && (
        <div className="mt-4 flex items-start space-x-2 text-amber-400 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            Недостаточно средств для выполнения операции
          </div>
        </div>
      )}
    </div>
  );
};

export default EarnVGWidget; 