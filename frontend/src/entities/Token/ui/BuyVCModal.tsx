import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  ArrowDown, 
  Settings, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  TrendingUp, 
  Activity, 
  Shield, 
  RefreshCw, 
  Layers, 
  Info,
  Wallet,
  X
} from 'lucide-react';
import { LP_POOL_CONFIG } from '../../../shared/config/contracts';
import { usePancakeSwap, type SwapVersion } from '../api/usePancakeSwap';
import { usePoolInfo } from '../../Staking/model/usePoolInfo';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { cn } from '../../../shared/lib/cn';

interface BuyVCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TransactionStats {
  estimatedGas: string;
  priceImpact: number;
  minimumReceived: string;
}

export const BuyVCModal: React.FC<BuyVCModalProps> = ({ isOpen, onClose }) => {
  const { address, isConnected } = useAccount();
  const { getVCQuote, buyVCWithBNB, isLoading, isSuccess, error, txHash, resetState } = usePancakeSwap();
  
  // ✅ Используем реальные данные пула вместо fake
  const { poolInfo, loading: poolLoading } = usePoolInfo();
  
  const [bnbAmount, setBnbAmount] = useState('');
  const [vcAmount, setVcAmount] = useState('');
  const [slippage, setSlippage] = useState(LP_POOL_CONFIG.DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [swapVersion, setSwapVersion] = useState<SwapVersion>('v2');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  
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

  // ✅ Автоматический расчет цены при изменении BNB или версии
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

  // ✅ Рассчитываем реальную статистику из poolInfo
  const realPrice = poolInfo.isLoaded ? parseFloat(poolInfo.price) : 0;
  const vcReserve = poolInfo.isLoaded ? parseFloat(poolInfo.vcReserve) : 0;
  const bnbReserve = poolInfo.isLoaded ? parseFloat(poolInfo.bnbReserve) : 0;
  const totalLiquidity = vcReserve + bnbReserve;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="w-full max-w-md liquid-glass rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.4 }}
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Купить VC
              </h1>
            </div>
            
            {showCloseButton && (
              <motion.button
                onClick={onClose}
                className="p-2 rounded-lg glass-ultra hover:glass-accent transition-all duration-300"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            )}
          </div>

          {/* ✅ Реальная статистика цены из пула */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass-ultra p-3 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-300">Цена VC</span>
              </div>
              <div className="text-sm font-bold text-white">
                {poolLoading ? '...' : `${realPrice.toFixed(6)}`}
              </div>
              <div className="text-xs text-gray-400">BNB</div>
            </div>
            
            <div className="glass-ultra p-3 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-300">VC</span>
              </div>
              <div className="text-sm font-bold text-white">
                {poolLoading ? '...' : `${vcReserve.toFixed(1)}`}
              </div>
              <div className="text-xs text-gray-400">Reserve</div>
            </div>
            
            <div className="glass-ultra p-3 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-gray-300">TVL</span>
              </div>
              <div className="text-sm font-bold text-white">
                {poolLoading ? '...' : `${(totalLiquidity * realPrice).toFixed(0)}K`}
              </div>
              <div className="text-xs text-green-400">
                {totalLiquidity > 0 ? 'OK' : 'Low'}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant={swapVersion === 'v2' ? 'blue' : 'glass'}
                size="sm"
                onClick={() => setSwapVersion('v2')}
                leftIcon={<Layers className="h-3 w-3" />}
              >
                V2
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Info className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slippage Settings */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                className="p-4 rounded-xl glass-ultra space-y-3 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">Slippage</span>
                  <span className="text-sm text-gray-400">{slippage}%</span>
                </div>
                
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* BNB Input */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Вы платите
              </label>
              <Button
                variant="glass"
                size="sm"
                onClick={handleMaxBNB}
              >
                MAX
              </Button>
            </div>
            
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
              className="text-xl font-bold pr-16 py-3"
              rightIcon={
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">BNB</span>
                </div>
              }
            />
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full glass-ultra">
              <ArrowDown className="h-4 w-4 text-blue-400" />
            </div>
          </div>

          {/* VC Output */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Вы получите
              </label>
              {isCalculating && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Расчет...
                </div>
              )}
            </div>
            
            <Input
              type="text"
              placeholder="0.0"
              value={vcAmount}
              readOnly
              className="text-xl font-bold pr-16 py-3"
              rightIcon={
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">VC</span>
                </div>
              }
            />
          </div>
              
          {/* Advanced Stats */}
          <AnimatePresence>
            {showAdvanced && isValidAmount && (
              <motion.div 
                className="p-4 rounded-xl glass-ultra space-y-2 mb-6 text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
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
                  <span className="text-slate-200">{transactionStats.minimumReceived} VC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Газ (оценка):</span>
                  <span className="text-slate-200">{transactionStats.estimatedGas} BNB</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {isSuccess && txHash && (
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-400/30 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-300 font-medium text-sm">Swap выполнен!</p>
                  <a
                    href={`https://testnet.bscscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1"
                  >
                    Посмотреть транзакцию
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
              
          {error && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-400/30 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-300 font-medium text-sm">Ошибка swap</p>
                  <p className="text-red-400/80 text-xs">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!isConnected ? (
              <Button variant="primary" size="lg" className="w-full">
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
                >
                  {isLoading ? 'Выполняется...' : 'Купить VC'}
                </Button>
                
                {(isSuccess || error) && (
                  <Button
                    variant="glass"
                    size="lg"
                    className="w-full"
                    onClick={handleReset}
                  >
                    Еще один swap
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 