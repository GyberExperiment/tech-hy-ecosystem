import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  Settings, 
  TrendingUp, 
  Zap, 
  RefreshCw,
  Shield
} from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  icon: string;
}

interface SwapSettings {
  slippage: number;
  deadline: number;
}

const TokenSwapper: React.FC = () => {
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SwapSettings>({
    slippage: 0.5,
    deadline: 20
  });

  // TODO: Подключить реальные токены из контрактной системы
  // const tokens: Token[] = [...]; // Будет использоваться для token selector

  // Simulate price calculation
  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      const timeout = setTimeout(() => {
        // Вычисляем конвертацию без сохранения промежуточного fromValue
        const calculatedAmount = (parseFloat(fromAmount) * fromToken.price) / toToken.price;
        setToAmount(calculatedAmount.toFixed(6));
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount) return;
    
    setIsLoading(true);
    
    // Simulate swap transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsLoading(false);
    setFromAmount('');
    setToAmount('');
  };

  const calculateSwapDetails = (): {
    rate: number;
    minimumReceived: number;
    priceImpact: number;
    networkFee: number;
  } | null => {
    if (!fromToken || !toToken || !fromAmount) return null;

    const fromValue = parseFloat(fromAmount) * fromToken.price;
    const rate = fromToken.price / toToken.price;
    const minimumReceived = parseFloat(toAmount) * (1 - settings.slippage / 100);
    const priceImpact = 0.05; // Simulated

    return {
      rate,
      minimumReceived,
      priceImpact,
      networkFee: 0.002
    };
  };

  const swapDetails = calculateSwapDetails();

  return (
    <motion.div
      className="space-y-6 animate-section-breathing-subtle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="glass-enhanced-breathing p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Token Swap</h1>
            <p className="text-gray-300">Exchange tokens instantly with best rates</p>
          </div>
          <motion.button
            className="glass-btn-ghost !p-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 glass-ultra rounded-lg"
          >
            <h3 className="text-white font-semibold mb-4">Swap Settings</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Slippage Tolerance</label>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <motion.button
                      key={value}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        settings.slippage === value
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSettings(prev => ({ ...prev, slippage: value }))}
                    >
                      {value}%
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Transaction Deadline</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.deadline}
                    onChange={(e) => setSettings(prev => ({ ...prev, deadline: Number(e.target.value) }))}
                    className="glass-input !py-2 !px-3 text-sm w-20"
                  />
                  <span className="text-gray-400 text-sm">minutes</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Swap Interface */}
      <div className="glass-enhanced-breathing p-6">
        {/* From Token */}
        <div className="space-y-4">
          <div className="glass-ultra p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">From</span>
              <span className="text-gray-400 text-sm">
                Balance: {fromToken?.balance || '0.00'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="glass-input !border-none !bg-transparent text-2xl font-bold flex-1"
              />
              
              <motion.button
                className="flex items-center gap-2 glass-btn-ghost !px-4 !py-2"
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  // Token selection logic would go here
                }}
              >
                {fromToken ? (
                  <>
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {fromToken.icon}
                    </div>
                    <span className="font-semibold">{fromToken.symbol}</span>
                  </>
                ) : (
                  <span>Select token</span>
                )}
              </motion.button>
            </div>
            
            {fromToken && fromAmount && (
              <div className="mt-2 text-right">
                <span className="text-gray-400 text-sm">
                  ≈ ${(parseFloat(fromAmount) * fromToken.price).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <motion.button
              className="glass-btn-ghost !p-3 group"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSwapTokens}
            >
              <ArrowUpDown className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
            </motion.button>
          </div>

          {/* To Token */}
          <div className="glass-ultra p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">To</span>
              <span className="text-gray-400 text-sm">
                Balance: {toToken?.balance || '0.00'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="glass-input !border-none !bg-transparent text-2xl font-bold flex-1 cursor-not-allowed"
              />
              
              <motion.button
                className="flex items-center gap-2 glass-btn-ghost !px-4 !py-2"
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  // Token selection logic would go here
                }}
              >
                {toToken ? (
                  <>
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {toToken.icon}
                    </div>
                    <span className="font-semibold">{toToken.symbol}</span>
                  </>
                ) : (
                  <span>Select token</span>
                )}
              </motion.button>
            </div>
            
            {toToken && toAmount && (
              <div className="mt-2 text-right">
                <span className="text-gray-400 text-sm">
                  ≈ ${(parseFloat(toAmount) * toToken.price).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Swap Details */}
        {swapDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-ultra p-4 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Exchange Rate</span>
              <span className="text-white">
                1 {fromToken?.symbol} = {swapDetails.rate.toFixed(6)} {toToken?.symbol}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Minimum Received</span>
              <span className="text-white">
                {swapDetails.minimumReceived.toFixed(6)} {toToken?.symbol}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Price Impact</span>
              <span className={`${swapDetails.priceImpact > 5 ? 'text-red-400' : 'text-green-400'}`}>
                {swapDetails.priceImpact.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">~{swapDetails.networkFee} BNB</span>
            </div>
          </motion.div>
        )}

        {/* Swap Button */}
        <motion.button
          className={`w-full glass-btn-primary mt-6 group relative overflow-hidden ${
            !fromToken || !toToken || !fromAmount || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          whileHover={fromToken && toToken && fromAmount && !isLoading ? { scale: 1.02 } : {}}
          whileTap={fromToken && toToken && fromAmount && !isLoading ? { scale: 0.98 } : {}}
          onClick={handleSwap}
          disabled={!fromToken || !toToken || !fromAmount || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Swapping...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>
                {!fromToken || !toToken ? 'Select tokens' : 
                 !fromAmount ? 'Enter amount' : 'Swap Tokens'}
              </span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="glass-enhanced-breathing p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { 
              title: 'Popular Pairs', 
              subtitle: 'VC ↔ VG',
              icon: TrendingUp,
              color: 'blue'
            },
            { 
              title: 'Low Fees', 
              subtitle: '0.1% trading fee',
              icon: Shield,
              color: 'green'
            },
            { 
              title: 'Instant Swap', 
              subtitle: 'No waiting time',
              icon: Zap,
              color: 'purple'
            }
          ].map((action, index) => (
            <motion.div
              key={index}
              className="glass-ultra p-4 rounded-lg group hover:bg-white/5 transition-colors animate-card-breathing"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  action.color === 'blue' ? 'bg-blue-500/20' :
                  action.color === 'green' ? 'bg-green-500/20' :
                  'bg-purple-500/20'
                }`}>
                  <action.icon className={`w-5 h-5 ${
                    action.color === 'blue' ? 'text-blue-400' :
                    action.color === 'green' ? 'text-green-400' :
                    'text-purple-400'
                  }`} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{action.title}</p>
                  <p className="text-gray-400 text-xs">{action.subtitle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TokenSwapper; 