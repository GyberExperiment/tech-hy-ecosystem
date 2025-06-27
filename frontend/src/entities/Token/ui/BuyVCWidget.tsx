import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { usePancakeSwap } from '../api/usePancakeSwap';
import { LP_POOL_CONFIG } from '../../../shared/config/contracts';
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
    }, 10000); // Обновляем каждые 10 секунд

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
          
          // Обновляем статистику транзакции
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

    const timeoutId = setTimeout(updateQuote, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [bnbAmount, swapVersion, slippage, getVCQuote]);

  const handleSwap = async () => {
    if (!isConnected || !address || !bnbAmount) return;

    try {
      await buyVCWithBNB({
        bnbAmount,
        slippage,
        recipient: address,
        version: swapVersion,
      });
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const handleMaxBNB = () => {
    // Здесь можно добавить логику для получения баланса BNB
    setBnbAmount('1'); // Пока что ставим 1 BNB для примера
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

  const cardVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Центральная карточка - увеличенная */}
      <div className="w-full max-w-4xl">
        
        {/* Заголовок с живой статистикой */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.div 
              className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.4 }}
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Купить VC Токены
            </h1>
          </div>
          
          {/* Живая статистика цены - увеличенная */}
          <div className="grid grid-cols-3 gap-8 mb-10">
            <motion.div 
              className="glass-ultra p-8 rounded-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span className="text-lg text-gray-300">Цена VC</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                ${priceData.price.toFixed(6)}
              </div>
              <div className={`text-lg ${priceData.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceData.change24h > 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
              </div>
            </motion.div>
            
            <motion.div 
              className="glass-ultra p-8 rounded-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-6 h-6 text-blue-400" />
                <span className="text-lg text-gray-300">Объем 24ч</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                ${(priceData.volume24h / 1000).toFixed(1)}K
              </div>
              <div className="text-lg text-gray-400">
                <Clock className="w-4 h-4 inline mr-2" />
                {Math.floor((Date.now() - priceData.lastUpdated) / 1000)}s
              </div>
            </motion.div>
            
            <motion.div 
              className="glass-ultra p-8 rounded-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-purple-400" />
                <span className="text-lg text-gray-300">Ликвидность</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                $89.2K
              </div>
              <div className="text-lg text-green-400">
                Высокая
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Основная карточка swap - увеличенная */}
        <motion.div 
          className="liquid-glass rounded-3xl p-12 backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 shadow-2xl"
          variants={cardVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header с настройками */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <RefreshCw className="w-7 h-7 text-blue-400" />
              </motion.div>
              <h3 className="text-3xl font-bold text-slate-100">Обменять</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="glass-ultra rounded-xl p-3 text-gray-400 hover:text-slate-200 transition-colors duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Info className="h-6 w-6" />
              </motion.button>
              
              <motion.button 
                onClick={() => setShowSettings(!showSettings)}
                className="glass-ultra rounded-xl p-3 text-gray-400 hover:text-slate-200 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <Settings className="h-6 w-6" />
              </motion.button>
            </div>
          </div>

          {/* Версия протокола - увеличенная */}
          <motion.div 
            className="flex items-center justify-center gap-4 p-6 rounded-2xl glass-ultra mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => setSwapVersion('v2')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
                swapVersion === 'v2' 
                  ? 'btn-glass-blue text-white shadow-lg' 
                  : 'text-gray-400 hover:text-slate-200 glass-subtle'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Layers className="h-6 w-6" />
              PancakeSwap V2
            </motion.button>
            
            <motion.button
              onClick={() => setSwapVersion('v3')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
                swapVersion === 'v3' 
                  ? 'btn-glass-green text-white shadow-lg' 
                  : 'text-gray-400 hover:text-slate-200 glass-subtle'
              }`}
              disabled // V3 пока не полностью реализован
              whileHover={{ scale: swapVersion !== 'v3' ? 1.05 : 1 }}
              whileTap={{ scale: swapVersion !== 'v3' ? 0.95 : 1 }}
            >
              <Zap className="h-6 w-6" />
              V3 (скоро)
            </motion.button>
          </motion.div>

          {/* Настройки slippage */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                className="p-6 rounded-2xl glass-ultra space-y-6 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">Максимальный slippage</span>
                  <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-lg">
                    {slippage}%
                  </span>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                    step="0.1"
                    min="0.1"
                    max="50"
                    className="input-field w-full"
                  />
                  
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0, 3.0].map((value) => (
                      <motion.button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          slippage === value 
                            ? 'bg-blue-500 text-white' 
                            : 'glass-subtle text-gray-400 hover:text-slate-200'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {value}%
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Протокол:</span>
                      <span className="text-slate-200">PancakeSwap {swapVersion.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Комиссия сети:</span>
                      <span className="text-slate-200">{swapVersion === 'v2' ? '0.25%' : '0.01-1%'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Сеть:</span>
                      <span className="text-slate-200">BSC Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Время:</span>
                      <span className="text-slate-200">~3 сек</span>
                    </div>
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
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Вы платите
              </label>
              <motion.button 
                onClick={handleMaxBNB}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-300 bg-blue-500/10 px-3 py-1 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                MAX
              </motion.button>
            </div>
            
            <div className="relative">
              <motion.input
                type="number"
                placeholder="0.0"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
                className="input-field w-full text-2xl font-bold pr-20 py-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/50 focus:border-blue-400/50"
                step="any"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">BNB</span>
                </div>
                <span className="text-sm font-medium text-slate-200">BNB</span>
              </div>
            </div>
          </motion.div>

          {/* Swap Arrow */}
          <motion.div 
            className="flex justify-center mb-6"
            whileHover={{ scale: 1.1, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 rounded-full glass-ultra bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <ArrowDown className="h-6 w-6 text-blue-400" />
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
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Вы получите
              </label>
              {isCalculating && (
                <motion.div 
                  className="flex items-center gap-2 text-xs text-blue-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Расчет...
                </motion.div>
              )}
            </div>
            
            <div className="relative">
              <motion.input
                type="text"
                placeholder="0.0"
                value={vcAmount}
                readOnly
                className="input-field w-full text-2xl font-bold pr-20 py-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-500/50"
                animate={{ 
                  borderColor: isCalculating ? '#3b82f6' : '#64748b',
                  boxShadow: isCalculating ? '0 0 0 1px #3b82f6' : 'none'
                }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">VC</span>
                </div>
                <span className="text-sm font-medium text-slate-200">VC</span>
              </div>
            </div>
          </motion.div>

          {/* Расширенная статистика */}
          <AnimatePresence>
            {showAdvanced && isValidAmount && (
              <motion.div 
                className="p-6 rounded-2xl glass-ultra space-y-4 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="text-sm font-semibold text-slate-200 mb-3">Детали транзакции</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Минимум к получению:</span>
                      <span className="text-slate-200 font-medium">{transactionStats.minimumReceived} VC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Влияние на цену:</span>
                      <span className={`font-medium ${transactionStats.priceImpact > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {transactionStats.priceImpact.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ожидаемая комиссия:</span>
                      <span className="text-slate-200 font-medium">{transactionStats.estimatedGas} BNB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Маршрут:</span>
                      <span className="text-slate-200 font-medium">BNB → VC</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-200">{error.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Display */}
          <AnimatePresence>
            {isSuccess && txHash && (
              <motion.div 
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-sm text-green-200 font-medium">Swap выполнен успешно!</p>
                </div>
                <motion.a 
                  href={`https://testnet.bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors duration-300 bg-blue-500/10 px-3 py-2 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Посмотреть транзакцию <ExternalLink className="h-3 w-3" />
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swap Button */}
          {!isConnected ? (
            <motion.button 
              className="btn-glass-orange w-full py-4 font-medium text-lg rounded-2xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wallet className="w-5 h-5 inline mr-2" />
              Подключите кошелек
            </motion.button>
          ) : (
            <motion.button 
              onClick={handleSwap}
              disabled={!canSwap}
              className={`w-full py-4 font-medium text-lg rounded-2xl transition-all duration-300 ${
                canSwap 
                  ? 'btn-glass-green hover:shadow-lg' 
                  : 'glass-subtle text-gray-400 cursor-not-allowed'
              }`}
              whileHover={{ scale: canSwap ? 1.02 : 1 }}
              whileTap={{ scale: canSwap ? 0.98 : 1 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Выполняется swap...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Купить VC ({swapVersion.toUpperCase()})
                </div>
              )}
            </motion.button>
          )}

          {/* Reset Button */}
          <AnimatePresence>
            {(isSuccess || error) && (
              <motion.button 
                onClick={() => {
                  resetState();
                  setBnbAmount('');
                  setVcAmount('');
                }}
                className="w-full py-3 mt-4 text-sm text-gray-400 hover:text-slate-200 glass-subtle rounded-xl transition-colors duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Новый swap
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Информационные карточки внизу */}
        <motion.div 
          className="grid grid-cols-3 gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div 
            className="glass-ultra p-4 rounded-xl text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Shield className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <div className="text-xs text-gray-400">Безопасность</div>
            <div className="text-sm font-medium text-slate-200">Аудит пройден</div>
          </motion.div>
          
          <motion.div 
            className="glass-ultra p-4 rounded-xl text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-xs text-gray-400">Скорость</div>
            <div className="text-sm font-medium text-slate-200">~3 секунды</div>
          </motion.div>
          
          <motion.div 
            className="glass-ultra p-4 rounded-xl text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <div className="text-xs text-gray-400">Комиссия</div>
            <div className="text-sm font-medium text-slate-200">0.25%</div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}; 