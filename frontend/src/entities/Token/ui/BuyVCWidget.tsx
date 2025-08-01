import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { usePancakeSwap, type SwapVersion } from '../api/usePancakeSwap';
import { LP_POOL_CONFIG } from '../../../shared/config/contracts';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { cn } from '../../../shared/lib/cn';
import { 
  ArrowDown, 
  Settings, 
  ExternalLink, 
  Zap, 
  Layers, 
  TrendingUp,
  Clock,
  Shield,
  Info,
  Wallet,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { usePoolInfo } from '../../Staking/model/usePoolInfo';

interface BuyVCWidgetProps {
  className?: string;
  horizontal?: boolean;
}

interface TransactionStats {
  estimatedGas: string;
  priceImpact: number;
  minimumReceived: string;
}

export const BuyVCWidget: React.FC<BuyVCWidgetProps> = ({ className, horizontal = false }) => {
  const { address, isConnected } = useAccount();
  const { getVCQuote, buyVCWithBNB, isLoading, isSuccess, error, txHash, resetState } = usePancakeSwap();
  
  const { poolInfo, loading: poolLoading } = usePoolInfo();
  
  const [bnbAmount, setBnbAmount] = useState('');
  const [vcAmount, setVcAmount] = useState('');
  const [slippage, setSlippage] = useState(LP_POOL_CONFIG.DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [swapVersion, setSwapVersion] = useState<SwapVersion>('v2');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    estimatedGas: '0.003',
    priceImpact: 0.1,
    minimumReceived: '0'
  });

  useEffect(() => {
    const updateQuote = async () => {
      if (bnbAmount && parseFloat(bnbAmount) > 0) {
        setIsCalculating(true);
        const quote = await getVCQuote(bnbAmount, swapVersion);
        if (quote) {
          const amountOut = parseFloat(quote.amountOut);
          setVcAmount(amountOut.toFixed(4));
          
          setTransactionStats({
            estimatedGas: (parseFloat(bnbAmount) * 0.003).toFixed(6),
            priceImpact: Math.min(parseFloat(bnbAmount) * 0.1, 5),
            minimumReceived: (amountOut * (1 - slippage / 100)).toFixed(4)
          });
        }
        setIsCalculating(false);
      } else {
        setVcAmount('');
        setTransactionStats({
          estimatedGas: '0.003',
          priceImpact: 0.1,
          minimumReceived: '0'
        });
      }
    };

    const timeoutId = setTimeout(updateQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [bnbAmount, swapVersion, slippage, getVCQuote]);

  const handleSwap = async () => {
    if (!isConnected || !address || !bnbAmount) return;

    try {
      await buyVCWithBNB({
        inputAmount: bnbAmount,
        recipient: address,
        slippage,
        version: swapVersion,
        enableMEVGuard: true,
        useFlashAccounting: true,
        poolType: 'CLAMM',
      });
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const handleMaxBNB = () => {
    setBnbAmount('1');
  };

  const handleReset = () => {
    resetState();
    setBnbAmount('');
    setVcAmount('');
  };

  const isValidAmount = bnbAmount && parseFloat(bnbAmount) > 0;
  const canSwap = isConnected && isValidAmount && !isLoading && !isCalculating;

  const realPrice = poolInfo.isLoaded ? parseFloat(poolInfo.price) : 0;
  const vcReserve = poolInfo.isLoaded ? parseFloat(poolInfo.vcReserve) : 0;
  const bnbReserve = poolInfo.isLoaded ? parseFloat(poolInfo.bnbReserve) : 0;
  const totalLiquidity = vcReserve + bnbReserve;

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      className={cn(
        horizontal 
          ? "w-full max-w-none" 
          : "w-full max-w-md mx-auto", 
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.div 
            className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.4 }}
          >
            <img 
              src="/icons/VC Token-Tech Hy- SVG.svg" 
              alt="VC Token" 
              className="w-6 h-6 object-contain"
            />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Купить VC Токены
          </h1>
        </div>
        
        <div className={cn(
          "grid gap-6 mb-8",
          horizontal 
            ? "grid-cols-1 sm:grid-cols-3" 
            : "grid-cols-1 sm:grid-cols-3"
        )}>
          {/* Цена VC токена */}
          <motion.div 
            className="relative group"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/8 border border-green-400/20 rounded-2xl p-6 hover:border-green-400/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 shadow-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-xs font-medium text-green-300/80 bg-green-500/10 px-2 py-1 rounded-full">
                  Live
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-green-200/80">Цена VC</h3>
                <div className="text-2xl font-bold text-white">
                  {poolLoading ? (
                    <div className="animate-pulse bg-green-400/20 h-8 w-24 rounded"></div>
                  ) : (
                    `${realPrice.toFixed(6)}`
                  )}
                </div>
                <div className="text-sm text-green-300/70">
                  {poolInfo.isLoaded ? 'BNB / Реальная цена' : 'Загрузка...'}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* VC Reserve */}
          <motion.div 
            className="relative group"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-blue-500/8 border border-blue-400/20 rounded-2xl p-6 hover:border-blue-400/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 shadow-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-xs font-medium text-blue-300/80 bg-blue-500/10 px-2 py-1 rounded-full">
                  Pool
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-blue-200/80">VC Reserve</h3>
                <div className="text-2xl font-bold text-white">
                  {poolLoading ? (
                    <div className="animate-pulse bg-blue-400/20 h-8 w-20 rounded"></div>
                  ) : (
                    `${(vcReserve / 1000).toFixed(1)}K`
                  )}
                </div>
                <div className="text-sm text-blue-300/70">
                  VC токенов в пуле
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Ликвидность */}
          <motion.div 
            className="relative group"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/8 border border-purple-400/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 shadow-lg">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  totalLiquidity > 1000 
                    ? "text-green-300/80 bg-green-500/10" 
                    : "text-orange-300/80 bg-orange-500/10"
                )}>
                  {totalLiquidity > 1000 ? 'High' : 'Low'}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-purple-200/80">Ликвидность</h3>
                <div className="text-2xl font-bold text-white">
                  {poolLoading ? (
                    <div className="animate-pulse bg-purple-400/20 h-8 w-16 rounded"></div>
                  ) : (
                    `${(totalLiquidity / 1000).toFixed(1)}K`
                  )}
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  totalLiquidity > 1000 ? "text-green-400" : "text-orange-400"
                )}>
                  {totalLiquidity > 1000 ? 'Высокая доступность' : 'Ограниченная'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="liquid-glass rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 shadow-2xl"
        whileHover={{ scale: horizontal ? 1.01 : 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshCw className="w-5 h-5 text-blue-400" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-100">Обменять</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              data-testid="info-button"
            >
              <Info className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowSettings(!showSettings)}
              data-testid="settings-button"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <motion.div 
          className="flex items-center justify-center gap-3 p-4 rounded-xl glass-ultra mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant={swapVersion === 'v2' ? 'blue' : 'glass'}
            size="sm"
            onClick={() => setSwapVersion('v2')}
            leftIcon={<Layers className="h-4 w-4" />}
            data-testid="v2-button"
          >
            PancakeSwap V2
          </Button>
          
          <Button
            variant="glass"
            size="sm"
            disabled
            leftIcon={<Zap className="h-4 w-4" />}
            data-testid="v3-button"
          >
            V3 (скоро)
          </Button>
        </motion.div>

        <AnimatePresence>
          {showSettings && (
            <motion.div 
              className="p-4 rounded-xl glass-ultra space-y-4 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              data-testid="settings-panel"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">Максимальный slippage</span>
                <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                  {slippage}%
                </span>
              </div>
              
              <div className="space-y-2">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                  step="0.1"
                  min="0.1"
                  max="50"
                  size="sm"
                  data-testid="slippage-input"
                />
                
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0, 3.0].map((value) => (
                    <Button
                      key={value}
                      variant={slippage === value ? 'blue' : 'glass'}
                      size="sm"
                      onClick={() => setSlippage(value)}
                      className="flex-1 text-xs"
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          horizontal 
            ? "grid grid-cols-1 lg:grid-cols-3 gap-8 items-center" 
            : "space-y-4"
        )}>
          
        <motion.div 
            className={cn(
              horizontal ? "space-y-4" : "space-y-4 mb-6"
            )}
            initial={{ opacity: 0, x: horizontal ? -20 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-slate-200 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Вы платите
            </label>
              <Button
                variant="glass"
                size="sm"
              onClick={handleMaxBNB}
                data-testid="max-button"
            >
              MAX
              </Button>
          </div>
          
          <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
              placeholder="0.0"
              value={bnbAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setBnbAmount(value);
                  }
                }}
                className="text-2xl font-bold pr-24 py-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/50 focus:border-blue-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                data-testid="bnb-input"
                aria-label="Сумма BNB для обмена"
                rightIcon={
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">BNB</span>
              </div>
                }
              />
          </div>
        </motion.div>

        <motion.div 
            className={cn(
              "flex justify-center",
              horizontal ? "lg:block" : "mb-6"
            )}
            whileHover={{ scale: 1.2, rotate: horizontal ? 90 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 rounded-full glass-ultra bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <ArrowDown className={cn(
                "h-5 w-5 text-blue-400",
                horizontal ? "lg:rotate-90" : ""
              )} />
          </div>
        </motion.div>

        <motion.div 
            className={cn(
              horizontal ? "space-y-4" : "space-y-4 mb-6"
            )}
            initial={{ opacity: 0, x: horizontal ? 20 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Вы получите
            </label>
            {isCalculating && (
              <motion.div 
                className="flex items-center gap-2 text-sm text-blue-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                Расчет...
              </motion.div>
            )}
          </div>
          
          <div className="relative">
              <Input
              type="text"
              placeholder="0.0"
              value={vcAmount}
              readOnly
                className={cn(
                  "text-2xl font-bold pr-24 py-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 transition-all duration-300",
                  isCalculating 
                    ? 'border-blue-400/70 shadow-[0_0_0_1px_rgb(59_130_246_/_0.7)]' 
                    : 'border-slate-500/50'
                )}
                data-testid="vc-output"
                aria-label="Количество VC токенов к получению"
                rightIcon={
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">VC</span>
              </div>
                }
              />
            </div>
          </motion.div>
          </div>

        <AnimatePresence>
          {showAdvanced && isValidAmount && (
            <motion.div 
              className="p-4 rounded-xl glass-ultra space-y-3 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              data-testid="advanced-panel"
            >
              <h4 className="text-lg font-semibold text-slate-200 mb-3">Детали транзакции</h4>
              
              <div className={cn(
                "text-sm gap-4",
                horizontal 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" 
                  : "grid grid-cols-2"
              )}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Влияние на цену:</span>
                    <span className={`font-medium ${
                      transactionStats.priceImpact > 2 ? 'text-red-400' : 
                      transactionStats.priceImpact > 1 ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {transactionStats.priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Минимум получите:</span>
                    <span className="text-slate-200 font-medium">{transactionStats.minimumReceived} VC</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Газ (оценка):</span>
                    <span className="text-slate-200 font-medium">{transactionStats.estimatedGas} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Маршрут:</span>
                    <span className="text-slate-200 font-medium">BNB → VC</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-600/50">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <ExternalLink className="w-3 h-3" />
                  <span>Powered by PancakeSwap {swapVersion.toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success and Error Messages */}
          {isSuccess && txHash && (
          <div 
              className="p-4 rounded-xl bg-green-500/20 border border-green-400/30 mb-6"
            data-testid="success-message"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                <p className="text-green-300 font-medium">Swap выполнен успешно!</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-400/80 text-sm">TX:</span>
                  <a
                      href={`https://testnet.bscscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm hover:text-blue-300 transition-colors flex items-center gap-1"
                    data-testid="transaction-link"
                    >
                    Посмотреть транзакцию
                      <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          )}

          {error && (
          <div 
              className="p-4 rounded-xl bg-red-500/20 border border-red-400/30 mb-6"
            data-testid="error-message"
            >
              <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                <p className="text-red-300 font-medium">Ошибка выполнения swap</p>
                  <p className="text-red-400/80 text-sm mt-1">{error}</p>
                </div>
              </div>
          </div>
        )}

        {/* Action buttons - размещаются по центру в горизонтальном режиме */}
        <div className={cn(
          "space-y-3",
          horizontal ? "flex justify-center" : ""
        )}>
          <div className={cn(
            horizontal ? "w-full max-w-md space-y-3" : "space-y-3"
          )}>
        {!isConnected ? (
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                data-testid="connect-button"
              >
                Подключить кошелек
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!canSwap}
                  isLoading={isLoading}
                  onClick={handleSwap}
                  data-testid="swap-button"
                >
                  {isLoading ? 'Выполняется...' : 'Купить VC токены'}
                </Button>
                
                {(isSuccess || error) && (
                  <Button
                    variant="glass"
                    size="lg"
                    className="w-full"
                    onClick={handleReset}
                    data-testid="reset-button"
                  >
                    Сделать еще один swap
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}; 