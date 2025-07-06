import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { CONTRACTS } from '../../../shared/config/contracts';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Wallet, Shield, RefreshCw, DollarSign, TrendingUp, Info, Zap, AlertCircle, Activity } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { useTokenData } from '../../../entities/Token/model/useTokenData';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';

interface VCSaleWidgetProps {
  className?: string;
}

interface SaleStats {
  totalVCAvailable: string;
  totalVCSold: string;
  currentVCBalance: string;
  pricePerVC: string;
  saleActive: boolean;
  totalRevenue: string;
  dailySalesAmount: string;
  circuitBreakerActive: boolean;
  salesInCurrentWindow: string;
}

interface UserStats {
  purchasedVC: string;
  spentBNB: string;
  lastPurchaseTimestamp: string;
  isBlacklisted: boolean;
  canPurchaseNext: string;
}

interface SecurityStatus {
  mevProtectionEnabled: boolean;
  circuitBreakerActive: boolean;
  contractPaused: boolean;
  userBlacklisted: boolean;
  rateLimited: boolean;
  dailyLimitReached: boolean;
}

// ABI для VCSaleContract
const VCSALE_ABI = [
  "function purchaseVC(uint256 vcAmount) payable",
  "function calculateBNBAmount(uint256 vcAmount) view returns (uint256)",
  "function calculateVCAmount(uint256 bnbAmount) view returns (uint256)",
  "function getSaleStats() view returns (uint256, uint256, uint256, uint256, bool, uint256, uint256, bool, uint256)",
  "function getUserStats(address user) view returns (uint256, uint256, uint256, bool, uint256)",
  "function canPurchase(address user, uint256 vcAmount) view returns (bool, string)",
  "function saleConfig() view returns (address, uint256, uint256, uint256, uint256, uint256, bool, address, uint256, uint256, uint256)",
  "function securityConfig() view returns (bool, uint256, uint256, bool, uint256, uint256)",
  "function circuitBreaker() view returns (uint256, uint256, bool, uint256)",
  "function paused() view returns (bool)",
  "function blacklistedUsers(address) view returns (bool)",
  "event VCPurchased(address indexed buyer, uint256 vcAmount, uint256 bnbAmount, uint256 pricePerVC, uint256 timestamp, bytes32 indexed purchaseId)",
  "event SecurityEvent(address indexed user, string indexed eventType, string description, uint256 timestamp)",
  "event CircuitBreakerTriggered(uint256 salesAmount, uint256 threshold, uint256 timestamp)"
];

const VCSaleWidget: React.FC<VCSaleWidgetProps> = ({ className = '' }) => {
  const { account, signer, isConnected } = useWeb3();
  
  // Use centralized hooks
  const { balances, loading: balancesLoading, triggerGlobalRefresh } = useTokenData();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [saleStats, setSaleStats] = useState<SaleStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    mevProtectionEnabled: false,
    circuitBreakerActive: false,
    contractPaused: false,
    userBlacklisted: false,
    rateLimited: false,
    dailyLimitReached: false
  });
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentAllowance, setCurrentAllowance] = useState<string>('0');
  const [checkingAllowance, setCheckingAllowance] = useState(false);

  // Contract instance
  const vcsaleContract = useMemo(() => {
    if (!signer || !CONTRACTS.VCSALE) return null;
    return new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, signer);
  }, [signer]);

  // Auto-calculate BNB amount when VC changes with debounce
  const calculatedBnbAmount = useMemo(() => {
    if (!vcAmount || !saleStats || parseFloat(vcAmount) <= 0) return '';
    
    try {
      const vcValue = parseFloat(vcAmount);
      const pricePerVC = parseFloat(saleStats.pricePerVC);
      
      if (isNaN(vcValue) || isNaN(pricePerVC) || pricePerVC <= 0) return '';
      
      const calculatedBnb = (vcValue * pricePerVC / 1e18).toFixed(6);
      return calculatedBnb;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Failed to calculate BNB amount', {
          component: 'VCSaleWidget',
          function: 'calculatedBnbAmount',
          vcAmount,
          pricePerVC: saleStats?.pricePerVC
        }, error as Error);
      }
      return '';
    }
  }, [vcAmount, saleStats?.pricePerVC]);

  // Auto-update BNB amount with debounce
  useEffect(() => {
    if (calculatedBnbAmount && calculatedBnbAmount !== bnbAmount) {
      const timeoutId = setTimeout(() => {
        setBnbAmount(calculatedBnbAmount);
        if (process.env.NODE_ENV === 'development') {
          log.debug('Auto-calculated BNB amount from VC', {
            component: 'VCSaleWidget',
            vcAmount,
            bnbAmount: calculatedBnbAmount
          });
        }
      }, 100); // 100ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [calculatedBnbAmount, bnbAmount, vcAmount]);

  // Check current VC allowance function
  const checkCurrentAllowance = async () => {
    if (!account || !CONTRACTS.VCSALE) {
      toast.error('Подключите кошелёк');
      return;
    }

    setCheckingAllowance(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        log.info('Checking current VC allowance', {
          component: 'VCSaleWidget',
          function: 'checkCurrentAllowance',
          address: account
        });
      }
      
      const allowance = await rpcService.withFallback(async (provider) => {
        const readOnlyVCContract = new ethers.Contract(CONTRACTS.VC_TOKEN, [
          "function allowance(address owner, address spender) view returns (uint256)"
        ], provider);
        
        return await (readOnlyVCContract as any).allowance(account, CONTRACTS.VCSALE);
      });
      
      const allowanceFormatted = ethers.formatEther(allowance);
      
      setCurrentAllowance(allowanceFormatted);
      if (process.env.NODE_ENV === 'development') {
        log.info('Current VC allowance retrieved', {
          component: 'VCSaleWidget',
          function: 'checkCurrentAllowance',
          address: account,
          allowance: allowanceFormatted
        });
      }
      
      if (parseFloat(allowanceFormatted) > 0) {
        toast.success(`Approve уже выполнен! Allowance: ${parseFloat(allowanceFormatted).toFixed(2)} VC`);
      } else {
        toast.success('Approve не выполнен. Allowance: 0 VC');
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Failed to check VC allowance', {
          component: 'VCSaleWidget',
          function: 'checkCurrentAllowance',
          address: account
        }, error);
      }
      toast.error('Ошибка проверки allowance');
    } finally {
      setCheckingAllowance(false);
    }
  };

  // Load contract data
  const loadContractData = async () => {
    if (!account || !CONTRACTS.VCSALE) return;

    try {
      if (process.env.NODE_ENV === 'development') {
        log.info('Loading VCSale contract data', {
          component: 'VCSaleWidget',
          function: 'loadContractData',
          address: account
        });
      }

      // Use rpcService for reliable data fetching
      const [statsData, userStatsData, securityConfigData, isPaused, isBlacklisted] = await Promise.all([
        rpcService.withFallback(async (provider) => {
          const readOnlyContract = new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, provider);
          return await (readOnlyContract as any).getSaleStats();
        }),
        rpcService.withFallback(async (provider) => {
          const readOnlyContract = new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, provider);
          return await (readOnlyContract as any).getUserStats(account);
        }),
        rpcService.withFallback(async (provider) => {
          const readOnlyContract = new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, provider);
          return await (readOnlyContract as any).securityConfig();
        }),
        rpcService.withFallback(async (provider) => {
          const readOnlyContract = new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, provider);
          return await (readOnlyContract as any).paused();
        }),
        rpcService.withFallback(async (provider) => {
          const readOnlyContract = new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, provider);
          return await (readOnlyContract as any).blacklistedUsers(account);
        })
      ]);

      // Parse sale stats
      setSaleStats({
        totalVCAvailable: ethers.formatEther(statsData[0]),
        totalVCSold: ethers.formatEther(statsData[1]),
        currentVCBalance: ethers.formatEther(statsData[2]),
        pricePerVC: statsData[3].toString(),
        saleActive: statsData[4],
        totalRevenue: ethers.formatEther(statsData[5]),
        dailySalesAmount: ethers.formatEther(statsData[6]),
        circuitBreakerActive: statsData[7],
        salesInCurrentWindow: ethers.formatEther(statsData[8])
      });

      // Parse user stats
      setUserStats({
        purchasedVC: ethers.formatEther(userStatsData[0]),
        spentBNB: ethers.formatEther(userStatsData[1]),
        lastPurchaseTimestamp: userStatsData[2].toString(),
        isBlacklisted: userStatsData[3],
        canPurchaseNext: userStatsData[4].toString()
      });

      // Parse security status
      const now = Math.floor(Date.now() / 1000);
      const canPurchaseNext = parseInt(userStatsData[4].toString());
      const rateLimited = now < canPurchaseNext;

      setSecurityStatus({
        mevProtectionEnabled: securityConfigData[0],
        circuitBreakerActive: securityConfigData[3],
        contractPaused: isPaused,
        userBlacklisted: isBlacklisted,
        rateLimited,
        dailyLimitReached: false // Will be determined by canPurchase call
      });

      if (process.env.NODE_ENV === 'development') {
        log.info('VCSale contract data loaded successfully', {
          component: 'VCSaleWidget',
          function: 'loadContractData',
          saleActive: statsData[4],
          currentBalance: ethers.formatEther(statsData[2]),
          rateLimited
        });
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Failed to load VCSale contract data', {
          component: 'VCSaleWidget',
          function: 'loadContractData'
        }, error as Error);
      }
      toast.error('Ошибка загрузки данных контракта');
    } finally {
      setDataLoading(false);
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
    if (process.env.NODE_ENV === 'development') {
      log.info('Manual refresh triggered', {
        component: 'VCSaleWidget',
        function: 'refreshAllData'
      });
    }
    
    setRefreshing(true);
    try {
      await Promise.all([
        loadContractData(),
        triggerGlobalRefresh()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Load data on mount and account change
  useEffect(() => {
    if (account && CONTRACTS.VCSALE) {
      loadContractData();
    }
  }, [account]);

  // Purchase function
  const handlePurchase = async () => {
    if (!vcsaleContract || !account || !vcAmount) {
      toast.error('Подключите кошелёк и введите количество VC');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      log.info('Starting VC purchase', {
        component: 'VCSaleWidget',
        function: 'handlePurchase',
        address: account,
        vcAmount,
        bnbAmount
      });
    }

    setLoading(true);
    
    try {
      const vcAmountWei = ethers.parseEther(vcAmount);
      
      // Check if purchase is possible
      const [canPurchase, reason] = await rpcService.withFallback(async (provider) => {
        const readOnlyContract = new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, provider);
        return await (readOnlyContract as any).canPurchase(account, vcAmountWei);
      });
      
      if (!canPurchase) {
        toast.error(`Покупка невозможна: ${reason}`);
        if (process.env.NODE_ENV === 'development') {
          log.error('Purchase validation failed', {
            component: 'VCSaleWidget',
            function: 'handlePurchase',
            reason
          });
        }
        return;
      }

      // Calculate required BNB
      const requiredBNB = await rpcService.withFallback(async (provider) => {
        const readOnlyContract = new ethers.Contract(CONTRACTS.VCSALE, VCSALE_ABI, provider);
        return await (readOnlyContract as any).calculateBNBAmount(vcAmountWei);
      });
      
      const requiredBNBWithBuffer = requiredBNB + (requiredBNB / 100n); // 1% buffer

      if (process.env.NODE_ENV === 'development') {
        log.info('Purchase validation passed, executing transaction', {
          component: 'VCSaleWidget',
          function: 'handlePurchase',
          vcAmount,
          requiredBNB: ethers.formatEther(requiredBNB),
          account
        });
      }

      // Create contract with signer
      const contractWithSigner = vcsaleContract.connect(signer!);

      // Estimate gas
      let gasLimit: bigint;
      try {
        const estimatedGas = await (contractWithSigner as any).estimateGas.purchaseVC(vcAmountWei, {
          value: requiredBNBWithBuffer
        });
        gasLimit = estimatedGas + (estimatedGas / 5n); // 20% buffer
      } catch (gasError) {
        if (process.env.NODE_ENV === 'development') {
          log.warn('Gas estimation failed, using fallback', {
            component: 'VCSaleWidget',
            function: 'handlePurchase'
          }, gasError as Error);
        }
        gasLimit = 500000n; // Fallback gas limit
      }

      // Execute purchase
      toast.loading('Выполнение покупки...', { id: 'purchase' });
      
      const tx = await (contractWithSigner as any).purchaseVC(vcAmountWei, {
        value: requiredBNBWithBuffer,
        gasLimit
      });

      toast.loading('Ожидание подтверждения...', { id: 'purchase' });
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success(`✅ Успешно куплено ${vcAmount} VC!`, { id: 'purchase' });

        if (process.env.NODE_ENV === 'development') {
          log.info('VC purchase completed successfully', {
            component: 'VCSaleWidget',
            function: 'handlePurchase',
            txHash: receipt.hash,
            vcAmount,
            account
          });
        }

        // Reset form and refresh data
        setVcAmount('');
        setBnbAmount('');
        await refreshAllData();
      } else {
        throw new Error('Транзакция не удалась');
      }

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        log.error('VC purchase failed', {
          component: 'VCSaleWidget',
          function: 'handlePurchase',
          error: error.message,
          account,
          vcAmount
        }, error);
      }

      let errorMessage = 'Ошибка покупки';
      
      if (error.message?.includes('Too frequent purchases')) {
        errorMessage = 'MEV Protection: Подождите между покупками (60 сек)';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Недостаточно BNB для транзакции';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Транзакция отклонена пользователем';
      } else if (error.message?.includes('Below minimum purchase')) {
        errorMessage = 'Сумма ниже минимальной покупки (1 VC)';
      } else if (error.message?.includes('Above maximum purchase')) {
        errorMessage = 'Сумма выше максимальной покупки (1000 VC)';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { id: 'purchase' });
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

  const getSecurityStatusIcon = (status: boolean, isGood: boolean = true): string => {
    return isGood === status ? '✅' : '❌';
  };

  const getNextPurchaseTime = (): string => {
    if (!userStats || !securityStatus.rateLimited) return '';
    const nextTime = new Date(parseInt(userStats.canPurchaseNext) * 1000);
    return nextTime.toLocaleTimeString();
  };

  if (!isConnected) {
    return (
      <div className={`card-ultra animate-enhanced-widget-chaos-1 ${className}`}>
        <div className="text-center">
          <Wallet className="h-16 w-16 text-blue-400 mb-6 mx-auto" />
          <h3 className="text-xl font-bold text-white mb-3">Подключите кошелёк</h3>
          <p className="text-gray-300">
            Для покупки VC токенов необходимо подключить MetaMask
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/80 to-orange-600/80 shadow-lg shadow-yellow-500/20">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">VC Sale</h3>
            <p className="text-slate-300 text-sm">
              Купить VC токены по фиксированной цене (0.001 BNB)
            </p>
          </div>
        </div>
        <button
          onClick={refreshAllData}
          disabled={refreshing}
          className="p-3 backdrop-blur-xl bg-white/8 border border-orange-400/25 rounded-xl hover:bg-orange-500/15 transition-all duration-300 group"
        >
          <RefreshCw className={cn("h-5 w-5 text-orange-300/80 group-hover:text-white transition-colors duration-300", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/8 via-yellow-400/5 to-orange-400/4 border border-yellow-400/20 rounded-xl p-4 hover:from-yellow-500/12 hover:via-yellow-400/8 hover:to-orange-400/6 transition-all duration-300 shadow-lg shadow-yellow-500/5 hover:shadow-yellow-500/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/25 border border-yellow-400/30 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-yellow-300/90" />
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
        
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/8 via-blue-400/5 to-cyan-400/4 border border-blue-400/20 rounded-xl p-4 hover:from-blue-500/12 hover:via-blue-400/8 hover:to-cyan-400/6 transition-all duration-300 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/25 border border-blue-400/30 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-300/90" />
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

      {/* Sale Information */}
      {saleStats && !dataLoading && (
        <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/6 via-blue-500/4 to-indigo-500/3 border border-cyan-400/15 rounded-xl p-4 mb-6 hover:from-cyan-500/8 hover:via-blue-500/6 hover:to-indigo-500/4 transition-all duration-300 shadow-lg shadow-cyan-500/4 hover:shadow-cyan-500/8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-cyan-200/80 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-300/80" />
              Sale Information
            </span>
            {securityStatus.contractPaused && (
              <div className="flex items-center gap-1 text-xs text-red-300/80">
                <AlertCircle className="w-3 h-3" />
                Paused
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-cyan-300/80 mb-1">Price per VC</div>
              <div className="font-medium text-white">
                {(parseFloat(saleStats.pricePerVC) / 1e18).toFixed(6)} BNB
              </div>
            </div>
            <div>
              <div className="text-cyan-300/80 mb-1">Available VC</div>
              <div className="font-medium text-white">
                {formatBalance(saleStats.currentVCBalance)} VC
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-cyan-400/15">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-cyan-300/80 mb-1">Sold Today</div>
                <div className="font-medium text-emerald-300/90">
                  {formatBalance(saleStats.dailySalesAmount)} VC
                </div>
              </div>
              <div>
                <div className="text-cyan-300/80 mb-1">Total Revenue</div>
                <div className="font-medium text-emerald-300/90">
                  {formatBalance(saleStats.totalRevenue)} BNB
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Количество VC</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <ShoppingCart className="h-4 w-4 text-blue-400/80" />
            </div>
            <input
              type="number"
              placeholder="Введите количество VC"
              value={vcAmount}
              onChange={(e) => setVcAmount(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl text-white placeholder-slate-400 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all duration-300"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Стоимость (BNB)</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <DollarSign className="h-4 w-4 text-yellow-400/80" />
            </div>
            <input
              type="number"
              placeholder="Автоматический расчет"
              value={bnbAmount}
              readOnly
              className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl text-white placeholder-slate-400 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/15 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Purchase Preview - как VG Reward Preview в EarnVG */}
      {vcAmount && bnbAmount && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/6 to-blue-500/6 border border-green-500/15 rounded-xl p-4 mb-6 hover:from-green-500/8 hover:to-blue-500/8 transition-all duration-300 shadow-lg shadow-green-500/5 hover:shadow-green-500/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400/80" />
              You will purchase:
            </span>
            <span className="text-lg font-bold text-green-400/90">
              {formatBalance(vcAmount)} VC for {formatBalance(bnbAmount)} BNB
            </span>
          </div>
        </div>
      )}

      {/* VC Allowance Check Button - как в EarnVG */}
      <div className="mb-4">
        <button
          onClick={checkCurrentAllowance}
          disabled={checkingAllowance}
          className="w-full py-3 backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl text-white hover:bg-white/6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Compact Security Status */}
      {(securityStatus.rateLimited || securityStatus.circuitBreakerActive || securityStatus.userBlacklisted) && (
        <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/8 via-orange-400/5 to-red-400/4 border border-yellow-400/20 rounded-xl p-4 mb-6 shadow-lg shadow-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-300/80" />
            <span className="text-sm font-medium text-yellow-200/80">Security Alerts</span>
          </div>
          <div className="text-sm text-white space-y-1">
            {securityStatus.rateLimited && (
              <div>⏱️ Next purchase available: {getNextPurchaseTime()}</div>
            )}
            {securityStatus.circuitBreakerActive && (
              <div>🔒 Circuit Breaker active - sales temporarily halted</div>
            )}
            {securityStatus.userBlacklisted && (
              <div>🚫 Account restricted from purchases</div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={
          loading || 
          !vcAmount || 
          parseFloat(vcAmount) <= 0 ||
          !saleStats?.saleActive ||
          securityStatus.contractPaused ||
          securityStatus.userBlacklisted ||
          securityStatus.circuitBreakerActive ||
          dataLoading
        }
        className="w-full py-4 bg-gradient-to-r from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 group"
      >
        {loading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            Покупка...
          </>
        ) : dataLoading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            Загрузка...
          </>
        ) : !saleStats?.saleActive ? (
          <>
            <AlertCircle className="h-5 w-5" />
            Продажа неактивна
          </>
        ) : securityStatus.contractPaused ? (
          <>
            <AlertCircle className="h-5 w-5" />
            Контракт приостановлен
          </>
        ) : securityStatus.circuitBreakerActive ? (
          <>
            <Zap className="h-5 w-5" />
            Circuit Breaker активен
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            Купить VC
          </>
        )}
      </button>

      {/* User Stats */}
      {userStats && (
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/6 via-indigo-500/4 to-pink-500/3 border border-purple-400/15 rounded-xl p-4 mb-6 hover:from-purple-500/8 hover:via-indigo-500/6 hover:to-pink-500/4 transition-all duration-300 shadow-lg shadow-purple-500/4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-purple-200/80 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-300/80" />
              Ваши статистические данные
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-purple-300/80 mb-1">Куплено VC</div>
              <div className="font-medium text-white">
                {formatBalance(userStats.purchasedVC)} VC
              </div>
            </div>
            <div>
              <div className="text-purple-300/80 mb-1">Потрачено BNB</div>
              <div className="font-medium text-white">
                {formatBalance(userStats.spentBNB)} BNB
              </div>
            </div>
            <div>
              <div className="text-purple-300/80 mb-1">Последняя покупка</div>
              <div className="font-medium text-white">
                {userStats.lastPurchaseTimestamp ? new Date(parseInt(userStats.lastPurchaseTimestamp) * 1000).toLocaleDateString() : 'Нет данных'}
              </div>
            </div>
            <div>
              <div className="text-purple-300/80 mb-1">Черный список</div>
              <div className="font-medium text-white">
                {getSecurityStatusIcon(userStats.isBlacklisted, false)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="mt-6 backdrop-blur-xl bg-gradient-to-br from-slate-600/8 via-slate-500/5 to-slate-400/4 border border-slate-400/20 rounded-xl p-4 shadow-lg shadow-slate-500/5">
        <div className="font-medium text-slate-200/90 mb-3 text-sm">Important Information:</div>
        <div className="text-xs text-slate-300/80 space-y-1">
          <div>• Fixed price: 0.001 BNB per 1 VC token</div>
          <div>• Purchase limits: 1-1000 VC per transaction</div>
          <div>• MEV Protection: 60 seconds between purchases</div>
          <div>• Maximum security and reliability</div>
          <div>• Instant VC token delivery</div>
        </div>
      </div>
    </div>
  );
};

export default VCSaleWidget; 