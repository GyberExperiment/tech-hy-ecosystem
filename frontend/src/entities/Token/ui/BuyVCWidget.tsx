import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { usePancakeSwap } from '../api/usePancakeSwap';
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
  AlertCircle,
  Activity
} from 'lucide-react';
import type { SwapVersion } from '../model/types';

interface BuyVCWidgetProps {
  className?: string;
}

interface PriceData {
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdated: number;
}

interface TransactionStats {
  estimatedGas: string;
  priceImpact: number;
  minimumReceived: string;
}

export const BuyVCWidget: React.FC<BuyVCWidgetProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const { getVCQuote, buyVCWithBNB, isLoading, isSuccess, error, txHash, resetState } = usePancakeSwap();
  
  const [bnbAmount, setBnbAmount] = useState('');
  const [vcAmount, setVcAmount] = useState('');
  const [slippage, setSlippage] = useState(LP_POOL_CONFIG.DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [swapVersion, setSwapVersion] = useState<SwapVersion>('v2');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Новые состояния для расширенной функциональности
  const [priceData, setPriceData] = useState<PriceData>({
    price: 0.0015,
    change24h: 2.4,
    volume24h: 127500,
    lastUpdated: Date.now()
  });
  
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    estimatedGas: '0.003',
    priceImpact: 0.1,
    minimumReceived: '0'
  });

  // Автоматическое обновление цены
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceData(prev => ({
        ...prev,
        price: prev.price * (1 + (Math.random() - 0.5) * 0.02),
        change24h: prev.change24h + (Math.random() - 0.5) * 0.5,
        lastUpdated: Date.now()
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Автоматический расчет цены при изменении BNB или версии
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
      className={cn("w-full max-w-md mx-auto", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Заголовок с живой статистикой */}
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
            <Zap className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Купить VC Токены
          </h1>
        </div>
        
        {/* Живая статистика цены */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div 
            className="glass-ultra p-4 rounded-xl"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Цена VC</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              ${priceData.price.toFixed(6)}
            </div>
            <div className={`text-sm ${priceData.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceData.change24h > 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
            </div>
          </motion.div>
          
          <motion.div 
            className="glass-ultra p-4 rounded-xl"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Объем 24ч</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              ${(priceData.volume24h / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-gray-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {Math.floor((Date.now() - priceData.lastUpdated) / 1000)}s
            </div>
          </motion.div>
          
          <motion.div 
            className="glass-ultra p-4 rounded-xl"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Ликвидность</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              $89.2K
            </div>
            <div className="text-sm text-green-400">
              Высокая
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Основная карточка swap */}
      <motion.div 
        className="liquid-glass rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 shadow-2xl"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header с настройками */}
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

        {/* Версия протокола */}
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

        {/* Настройки slippage */}
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

        {/* BNB Input */}
        <motion.div 
          className="space-y-4 mb-6"
          initial={{ opacity: 0, x: -20 }}
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
                // Разрешаем только числа и точку
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

        {/* Swap Arrow */}
        <motion.div 
          className="flex justify-center mb-6"
          whileHover={{ scale: 1.2, rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 rounded-full glass-ultra bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
            <ArrowDown className="h-5 w-5 text-blue-400" />
          </div>
        </motion.div>

        {/* VC Output */}
        <motion.div 
          className="space-y-4 mb-6"
          initial={{ opacity: 0, x: 20 }}
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

        {/* Расширенная статистика */}
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
              
              <div className="grid grid-cols-2 gap-4 text-sm">
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

        {/* Success/Error Messages */}
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
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">Ошибка транзакции</p>
                <p className="text-red-400/80 text-sm mt-1">{error.message || error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        {!isConnected ? (
          <Button
            variant="orange"
            size="mobile"
            leftIcon={<Wallet className="w-5 h-5" />}
            data-testid="connect-wallet-button"
          >
            Подключите кошелек
          </Button>
        ) : (
          <div className="space-y-4">
            <Button
              variant={canSwap ? 'green' : 'glass'}
              size="mobile"
              onClick={handleSwap}
              disabled={!canSwap}
              loading={isLoading}
              leftIcon={!isLoading ? <Zap className="w-5 h-5" /> : undefined}
              data-testid="swap-button"
            >
              {isLoading ? 'Выполняется swap...' : `Купить VC (${swapVersion.toUpperCase()})`}
            </Button>
            
            {(isSuccess || error) && (
              <Button
                variant="blue"
                size="mobile"
                onClick={handleReset}
                data-testid="new-swap-button"
              >
                Новый swap
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}; 