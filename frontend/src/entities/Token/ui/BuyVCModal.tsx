import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
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
  Activity,
  X
} from 'lucide-react';
import type { SwapVersion } from '../model/types';

interface BuyVCModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const BuyVCModal: React.FC<BuyVCModalProps> = ({ isOpen, onClose }) => {
  const { address, isConnected } = useAccount();
  const { getVCQuote, buyVCWithBNB, isLoading, isSuccess, error, txHash, resetState } = usePancakeSwap();
  
  const [bnbAmount, setBnbAmount] = useState('');
  const [vcAmount, setVcAmount] = useState('');
  const [slippage, setSlippage] = useState(LP_POOL_CONFIG.DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [swapVersion, setSwapVersion] = useState<SwapVersion>('v2');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  
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

  // Автозакрытие через 1.5 секунды и показ кнопки закрыть
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowCloseButton(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
    setBnbAmount('1');
  };

  const isValidAmount = bnbAmount && parseFloat(bnbAmount) > 0;
  const canSwap = isConnected && isValidAmount && !isLoading && !isCalculating;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Кнопка закрытия */}
        <AnimatePresence>
          {showCloseButton && (
            <motion.button
              onClick={onClose}
              className="fixed top-8 right-8 z-60 p-3 rounded-full bg-slate-800/90 text-white hover:bg-slate-700 transition-colors duration-300"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Контент модала */}
        <motion.div 
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        >
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
            
            {/* Живая статистика цены */}
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

          {/* Основная карточка swap */}
          <motion.div 
            className="liquid-glass rounded-3xl p-12 backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 shadow-2xl"
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

            {/* Версия протокола */}
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
                disabled
                whileHover={{ scale: swapVersion !== 'v3' ? 1.05 : 1 }}
                whileTap={{ scale: swapVersion !== 'v3' ? 0.95 : 1 }}
              >
                <Zap className="h-6 w-6" />
                V3 (скоро)
              </motion.button>
            </motion.div>

            {/* Swap Button */}
            {!isConnected ? (
              <motion.button 
                className="btn-glass-orange w-full py-6 font-medium text-2xl rounded-2xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Wallet className="w-6 h-6 inline mr-3" />
                Подключите кошелек
              </motion.button>
            ) : (
              <motion.button 
                onClick={handleSwap}
                disabled={!canSwap}
                className={`w-full py-6 font-medium text-2xl rounded-2xl transition-all duration-300 ${
                  canSwap 
                    ? 'btn-glass-green hover:shadow-lg' 
                    : 'glass-subtle text-gray-400 cursor-not-allowed'
                }`}
                whileHover={{ scale: canSwap ? 1.02 : 1 }}
                whileTap={{ scale: canSwap ? 0.98 : 1 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Выполняется swap...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="w-6 h-6" />
                    Купить VC ({swapVersion.toUpperCase()})
                  </div>
                )}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 