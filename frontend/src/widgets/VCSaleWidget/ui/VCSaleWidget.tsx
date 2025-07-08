import React from 'react';
import { ShoppingCart, RefreshCw, TrendingUp, Users, BarChart3, AlertTriangle, Shield, CheckCircle, Clock } from 'lucide-react';
import { ErrorBoundary } from '../../../shared/ui/ErrorBoundary';
import { NetworkWarning } from '../../../shared/ui/NetworkWarning';
import { VCSaleWidgetSkeleton, BalanceCardSkeleton, SaleInfoSkeleton, UserStatsSkeleton } from '../../../shared/ui/LoadingSkeleton';
import { useVCSale } from '../hooks/useVCSale';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { useBreakpoint } from '../../../shared/hooks/useResponsive';
import type { VCSaleWidgetProps } from '../model/types';
import { cn } from '../../../shared/lib/cn';

// Helper function for currency formatting
const formatCurrency = (value: number, decimals: number = 6): string => {
  if (value === 0) return '0';
  if (value < 0.000001) return '< 0.000001';
  if (value < 0.001) return value.toFixed(6);
  return value.toFixed(decimals);
};

// Helper function for number formatting with decimals
const formatNumberWithDecimals = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (num === 0) return '0';
  if (num < 1000) return num.toFixed(decimals);
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
};

const VCSaleWidget: React.FC<VCSaleWidgetProps> = ({ 
  className = '',
  onPurchaseSuccess,
  onError,
}) => {
  const { chainId } = useWeb3();
  const { isMobile, isSmallMobile } = useBreakpoint();
  const {
    saleStats,
    userStats,
    securityStatus,
    vcAmount,
    bnbAmount,
    balances,
    balancesLoading,
    isLoading,
    isDataLoading,
    isRefreshing,
    error,
    isNetworkSupported,
    canPurchase,
    setVcAmount,
    refreshAllData,
    executePurchase,
  } = useVCSale();

  // Local BNB calculation for immediate display
  const displayBnbAmount = React.useMemo(() => {
    // Always prioritize calculated amount from hook
    if (bnbAmount && parseFloat(bnbAmount) > 0) {
      return bnbAmount;
    }
    
    // Immediate local calculation if VC amount entered
    if (vcAmount && parseFloat(vcAmount) > 0) {
      const vcValue = parseFloat(vcAmount);
      
      // Use price from saleStats if available
      if (saleStats?.pricePerVC) {
        const pricePerVC = parseFloat(saleStats.pricePerVC) / 1e18;
        if (pricePerVC > 0) {
          const calculated = (vcValue * pricePerVC).toFixed(6);
          return calculated;
        }
      }
      
      // Fallback calculation with 0.001 BNB per VC
      const fallbackCalculated = (vcValue * 0.001).toFixed(6);
      return fallbackCalculated;
    }
    
    return '';
  }, [bnbAmount, vcAmount, saleStats?.pricePerVC]);

  // Handle purchase with callback
  const handlePurchase = async () => {
    try {
      await executePurchase();
      if (onPurchaseSuccess && vcAmount) {
        // The transaction hash would be available in the hook
        onPurchaseSuccess('transaction-hash-placeholder', vcAmount);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  // Network validation banner
  if (!isNetworkSupported) {
    return (
      <div className={cn('card-ultra animate-enhanced-widget-chaos-1', className)}>
        <NetworkWarning 
          currentChainId={chainId || 0}
          variant="card"
          className="mb-0"
        />
      </div>
    );
  }

  // Main loading state
  if (isDataLoading && !saleStats) {
    return <VCSaleWidgetSkeleton className={className} />;
  }

  return (
    <div className={cn(
      'card-ultra animate-enhanced-widget-chaos-1',
      isMobile ? 'p-3' : 'p-4', // Уменьшил отступы
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between mb-4", // Уменьшил margin
        isSmallMobile ? "flex-col gap-3" : "" // Уменьшил gap
      )}>
        <div className="flex items-center gap-2"> {/* Уменьшил gap */}
          <div className={cn(
            "rounded-lg bg-gradient-to-br from-yellow-500/80 to-orange-600/80 flex items-center justify-center shadow-lg", // Уменьшил border-radius
            isMobile ? "w-8 h-8" : "w-10 h-10" // Уменьшил размеры
          )}>
            <ShoppingCart className={cn("text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          <div>
            <h3 className={cn(
              "font-bold text-white",
              isMobile ? "text-sm" : "text-base" // Уменьшил размер текста
            )}>
              VC Token Sale
            </h3>
            <p className="text-xs text-slate-400">Buy VC tokens at fixed price</p> {/* Уменьшил размер */}
          </div>
        </div>
        
        <button
          onClick={refreshAllData}
          disabled={isRefreshing}
          className={cn(
            "rounded-lg backdrop-blur-xl bg-white/8 border border-white/20 hover:bg-white/12 flex items-center justify-center transition-all duration-300 disabled:opacity-50",
            isMobile ? "w-8 h-8" : "w-10 h-10" // Уменьшил размеры
          )}
          title="Refresh Data"
        >
          <RefreshCw className={cn("text-white transition-transform duration-300", {
            "animate-spin": isRefreshing
          }, isMobile ? "w-3 h-3" : "w-4 h-4")} /> {/* Уменьшил размеры */}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Balances */}
      <div className={cn(
        "grid gap-3 mb-4", // Уменьшил gap и margin
        isSmallMobile ? "grid-cols-1" : "grid-cols-2"
      )}>
        {/* BNB Balance */}
        {balancesLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <div className="backdrop-blur-xl bg-white/3 border border-white/8 rounded-lg p-3 hover:bg-white/5 transition-all duration-300"> {/* Уменьшил padding и border-radius */}
            <div className="flex items-center gap-2 mb-1"> {/* Уменьшил gap и margin */}
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 flex items-center justify-center"> {/* Уменьшил размеры */}
                <span className="text-xs font-bold text-yellow-400">BNB</span> {/* Уменьшил размер */}
              </div>
              <span className="text-xs text-slate-400">BNB Balance</span> {/* Уменьшил размер */}
            </div>
            <div className={cn(
              "font-bold text-white",
              isMobile ? "text-base" : "text-lg" // Уменьшил размеры
            )}>
              {formatNumberWithDecimals(balances.BNB || '0', 6)} BNB
            </div>
          </div>
        )}

        {/* VC Balance */}
        {balancesLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <div className="backdrop-blur-xl bg-white/3 border border-white/8 rounded-lg p-3 hover:bg-white/5 transition-all duration-300"> {/* Уменьшил padding и border-radius */}
            <div className="flex items-center gap-2 mb-1"> {/* Уменьшил gap и margin */}
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-400/20 to-purple-600/20 border border-purple-400/30 flex items-center justify-center"> {/* Уменьшил размеры */}
                <span className="text-xs font-bold text-purple-400">VC</span> {/* Уменьшил размер */}
              </div>
              <span className="text-xs text-slate-400">VC Balance</span> {/* Уменьшил размер */}
            </div>
            <div className={cn(
              "font-bold text-white",
              isMobile ? "text-base" : "text-lg" // Уменьшил размеры
            )}>
              {formatNumberWithDecimals(balances.VC || '0', 2)} VC
            </div>
          </div>
        )}
      </div>

      {/* Sale Information */}
      {!saleStats ? (
        <SaleInfoSkeleton className="mb-4" /> {/* Уменьшил margin */}
      ) : (
        <div className="backdrop-blur-xl bg-white/3 border border-white/8 rounded-lg p-3 mb-4"> {/* Уменьшил padding и margin */}
          <div className="flex items-center justify-between mb-2"> {/* Уменьшил margin */}
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-blue-400" /> {/* Уменьшил размер */}
              <span className="text-xs font-medium text-white">Sale Information</span> {/* Уменьшил размер */}
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

          <div className={cn(
            "text-xs mb-2", // Уменьшил размер текста и margin
            isMobile ? "grid grid-cols-1 gap-1" : "grid grid-cols-2 gap-3" // Уменьшил gap
          )}>
            <div>
              <span className="text-slate-400">Available VC:</span>
              <div className="text-white font-medium">{formatNumberWithDecimals(saleStats?.currentVCBalance || '0', 0)} VC</div>
            </div>
            <div>
              <span className="text-slate-400">Total Sold:</span>
              <div className="text-white font-medium">{formatNumberWithDecimals(saleStats?.totalVCSold || '0', 0)} VC</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10"> {/* Уменьшил padding */}
            <div className={cn(
              "text-xs", // Уменьшил размер текста
              isMobile ? "grid grid-cols-1 gap-1" : "grid grid-cols-2 gap-3" // Уменьшил gap
            )}>
              <div>
                <span className="text-slate-400">Price per VC:</span>
                <div className="text-white font-medium">{formatCurrency(parseFloat(saleStats?.pricePerVC || '0') / 1e18, 6)} BNB</div>
              </div>
              <div>
                <span className="text-slate-400">Total Revenue:</span>
                <div className="text-white font-medium">{formatNumberWithDecimals(saleStats?.totalRevenue || '0', 4)} BNB</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Form */}
      <div className="space-y-3 mb-4"> {/* Уменьшил отступы */}
        {/* VC Amount Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1"> {/* Уменьшил размер и margin */}
            VC Amount
          </label>
          <div className="relative">
            <input
              type="text"
              value={vcAmount}
              onChange={(e) => setVcAmount(e.target.value)}
              placeholder={isMobile ? "1-1000 VC" : "Enter VC amount (1-1000)"}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300" // Уменьшил padding и border-radius
              disabled={isLoading || !saleStats?.saleActive}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2"> {/* Уменьшил отступ */}
              <span className="text-xs text-slate-400 font-medium">VC</span> {/* Уменьшил размер */}
            </div>
          </div>
        </div>

        {/* BNB Amount Display */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1"> {/* Уменьшил размер и margin */}
            BNB Required
          </label>
          <div className="relative">
            <input
              type="text"
              value={displayBnbAmount || 'Enter VC amount first'} {/* Показываем сообщение если пусто */}
              readOnly
              placeholder={isMobile ? "Auto calculated" : "Calculated automatically"}
              className="w-full px-3 py-2 bg-white/3 border border-white/8 rounded-lg text-white placeholder-slate-500 cursor-not-allowed" // Уменьшил padding и border-radius
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2"> {/* Уменьшил отступ */}
              <span className="text-xs text-slate-400 font-medium">BNB</span> {/* Уменьшил размер */}
            </div>
          </div>
        </div>

        {/* Purchase Preview */}
        {vcAmount && displayBnbAmount && (
          <div className="bg-gradient-to-br from-blue-500/8 via-blue-400/5 to-cyan-400/4 border border-blue-400/20 rounded-lg p-3"> {/* Уменьшил padding и border-radius */}
            <div className="flex items-center gap-2 mb-2"> {/* Уменьшил margin */}
              <TrendingUp className="w-3 h-3 text-blue-400" /> {/* Уменьшил размер */}
              <span className="text-xs font-medium text-blue-300">Purchase Preview</span> {/* Уменьшил размер */}
            </div>
            <div className="space-y-1 text-xs"> {/* Уменьшил размер текста и отступы */}
              <div className="flex justify-between">
                <span className="text-slate-400">You pay:</span>
                <span className="text-white font-medium">{displayBnbAmount} BNB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">You receive:</span>
                <span className="text-white font-medium">{vcAmount} VC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate:</span>
                <span className="text-white font-medium">
                  1 VC = {saleStats ? formatCurrency(parseFloat(saleStats.pricePerVC || '0') / 1e18, 6) : '0.001'} BNB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Status - Compact */}
      {securityStatus && Object.values(securityStatus).some(Boolean) && (
        <div className="bg-gradient-to-br from-orange-500/8 via-orange-400/5 to-yellow-400/4 border border-orange-400/20 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">Security Status</span>
          </div>
          <div className={cn(
            "text-xs",
            isMobile ? "grid grid-cols-1 gap-1" : "grid grid-cols-2 gap-2"
          )}>
            {securityStatus.mevProtectionEnabled && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-300">MEV Protected</span>
              </div>
            )}
            {securityStatus.circuitBreakerActive && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-400" />
                <span className="text-orange-300">Circuit Breaker</span>
              </div>
            )}
            {securityStatus.rateLimited && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-300">Rate Limited</span>
              </div>
            )}
            {securityStatus.contractPaused && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-red-300">Paused</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={!canPurchase || isLoading}
        className={cn(
          "w-full rounded-lg font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed", // Уменьшил border-radius
          isMobile ? "py-2 px-3" : "py-3 px-4", // Уменьшил padding
          canPurchase && !isLoading
            ? "bg-gradient-to-r from-yellow-500/90 to-orange-600/90 hover:from-yellow-600/90 hover:to-orange-700/90 hover:shadow-xl transform hover:scale-[1.02]"
            : "bg-gradient-to-r from-slate-600/50 to-slate-700/50"
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" /> {/* Уменьшил размер */}
            <span className="text-sm">Processing...</span> {/* Уменьшил размер */}
          </div>
        ) : !saleStats?.saleActive ? (
          'Enter Amount'
        ) : !vcAmount || parseFloat(vcAmount) <= 0 ? (
          'Enter Amount'
        ) : !canPurchase ? (
          'Cannot Purchase'
        ) : (
          `Purchase ${vcAmount} VC`
        )}
      </button>

      {/* User Statistics */}
      {!userStats ? (
        <UserStatsSkeleton className="mt-4" /> {/* Уменьшил margin */}
      ) : (
        <div className="backdrop-blur-xl bg-white/3 border border-white/8 rounded-lg p-3 mt-4"> {/* Уменьшил padding, border-radius и margin */}
          <div className="flex items-center gap-2 mb-2"> {/* Уменьшил margin */}
            <Users className="w-3 h-3 text-purple-400" /> {/* Уменьшил размер */}
            <span className="text-xs font-medium text-white">Your Statistics</span> {/* Уменьшил размер */}
          </div>
          <div className={cn(
            "text-xs", // Уменьшил размер текста
            isMobile ? "grid grid-cols-1 gap-1" : "grid grid-cols-2 gap-3" // Уменьшил gap
          )}>
            <div>
              <span className="text-slate-400">Purchased VC:</span>
              <div className="text-white font-medium">{formatNumberWithDecimals(userStats.purchasedVC, 2)} VC</div>
            </div>
            <div>
              <span className="text-slate-400">Spent BNB:</span>
              <div className="text-white font-medium">{formatNumberWithDecimals(userStats.spentBNB, 4)} BNB</div>
            </div>
            <div>
              <span className="text-slate-400">Total Transactions:</span>
              <div className="text-white font-medium">{userStats.totalTransactions}</div>
            </div>
            <div>
              <span className="text-slate-400">Last Purchase:</span>
              <div className="text-white font-medium">
                {userStats.lastPurchaseTimestamp === '0' 
                  ? 'Never' 
                  : new Date(parseInt(userStats.lastPurchaseTimestamp) * 1000).toLocaleDateString()
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export with Error Boundary
export default React.memo((props: VCSaleWidgetProps) => (
  <ErrorBoundary 
    componentName="VCSaleWidget"
    enableReporting={true}
    onError={(error, _errorInfo) => {
      if (props.onError) {
        props.onError(error);
      }
    }}
  >
    <VCSaleWidget {...props} />
  </ErrorBoundary>
)); 