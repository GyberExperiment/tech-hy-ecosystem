import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ExternalLink,
  X,
  Info
} from 'lucide-react';
import { networkDiagnostics, type NetworkDiagnostics } from '../lib/networkDiagnostics';
import { rpcService } from '../api/rpcService';

interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
  autoHide?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className = '', 
  showDetails = false,
  autoHide = true 
}) => {
  const [diagnostics, setDiagnostics] = useState<NetworkDiagnostics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const runDiagnostics = async () => {
    setIsRefreshing(true);
    try {
      const results = await networkDiagnostics.runDiagnostics();
      setDiagnostics(results);
      
      // Show component if there are issues or if showDetails is true
      if (!autoHide || showDetails || results.rpcStatus !== 'good') {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to run network diagnostics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetRpcProviders = () => {
    try {
      rpcService.resetProviderHealth();
      console.log('RPC providers reset successfully');
      // Перезапускаем диагностику
      setTimeout(runDiagnostics, 500);
    } catch (error) {
      console.error('Failed to reset RPC providers:', error);
    }
  };

  useEffect(() => {
    runDiagnostics();
    
    // Run diagnostics periodically
    const interval = setInterval(runDiagnostics, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded': return <Wifi className="w-5 h-5 text-yellow-400" />;
      case 'poor': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'offline': return <WifiOff className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-green-400/30 bg-green-500/10';
      case 'degraded': return 'border-yellow-400/30 bg-yellow-500/10';
      case 'poor': return 'border-orange-400/30 bg-orange-500/10';
      case 'offline': return 'border-red-400/30 bg-red-500/10';
      default: return 'border-gray-400/30 bg-gray-500/10';
    }
  };

  if (!diagnostics || (!isVisible && !showDetails)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed top-4 right-4 z-50 max-w-md ${className}`}
        initial={{ opacity: 0, x: 100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.8 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className={`
          backdrop-blur-xl rounded-xl border p-4 shadow-2xl
          ${getStatusColor(diagnostics.rpcStatus)}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(diagnostics.rpcStatus)}
              <span className="font-semibold text-slate-100">
                Статус сети
              </span>
      </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runDiagnostics}
                disabled={isRefreshing}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <RefreshCw 
                  className={`w-4 h-4 text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
              </button>
              
              {autoHide && (
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              )}
        </div>
      </div>

          {/* Status Message */}
          <div className="mb-3">
            <p className="text-slate-200 font-medium">
              {networkDiagnostics.getStatusMessage(diagnostics.rpcStatus)}
            </p>
            
            {diagnostics.workingEndpoints.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                Работает {diagnostics.workingEndpoints.length} из{' '}
                {diagnostics.workingEndpoints.length + diagnostics.failingEndpoints.length} RPC
              </p>
            )}
          </div>

          {/* RPC Provider Stats */}
          {diagnostics.rpcStats && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-200 mb-2">RPC Провайдеры</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {diagnostics.rpcStats.fallbackProviders?.map((provider: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        provider.isHealthy ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-gray-300 truncate max-w-40">
                        {provider.url.replace('https://', '').split('/')[0]}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      {provider.consecutiveErrors > 0 && (
                        <span className="text-red-400">E:{provider.consecutiveErrors}</span>
                      )}
                      {provider.requestCount > 0 && (
                        <span className="ml-1">R:{provider.requestCount}</span>
                      )}
          </div>
        </div>
                ))}
      </div>

              {/* Active Requests Info */}
              {diagnostics.rpcStats.activeRequests > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Активных запросов: {diagnostics.rpcStats.activeRequests}
                  {diagnostics.rpcStats.queuedRequests > 0 && (
                    <span className="ml-2">В очереди: {diagnostics.rpcStats.queuedRequests}</span>
                  )}
                </div>
              )}
              </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-gray-400">Кошелек</div>
              <div className="text-slate-200 font-medium">
                {diagnostics.hasMetaMask ? (
                  diagnostics.isConnected ? '🟢 Подключен' : '🟡 Не подключен'
                ) : '🔴 Не установлен'}
        </div>
      </div>

            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-gray-400">Сеть</div>
              <div className="text-slate-200 font-medium">
                {diagnostics.chainId === 97 ? '🟢 BSC Testnet' : 
                 diagnostics.chainId ? `🔴 Chain ${diagnostics.chainId}` : '🔴 Не подключена'}
              </div>
            </div>
          </div>

          {/* Recommendations Toggle */}
          {diagnostics.recommendations.length > 0 && (
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 mb-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">
                  Рекомендации ({diagnostics.recommendations.length})
                </span>
                <motion.div
                  animate={{ rotate: showRecommendations ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
        </div>
            </button>
      )}

          {/* Recommendations */}
          <AnimatePresence>
            {showRecommendations && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white/5 rounded-lg p-3 max-h-60 overflow-y-auto">
                  <div className="space-y-2 text-sm">
                    {diagnostics.recommendations.map((rec, index) => (
                      <div key={index} className="text-gray-300">
                        {rec.includes('•') ? (
                          <div className="ml-4 text-gray-400">{rec}</div>
                        ) : rec.trim() ? (
                          <div>{rec}</div>
                        ) : (
                          <div className="h-2" />
          )}
        </div>
                    ))}
      </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    
                    {/* RPC Reset Button */}
                    {diagnostics.rpcStatus !== 'good' && (
                      <button
                        onClick={resetRpcProviders}
                        className="flex items-center gap-2 w-full p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors duration-200 text-blue-400 hover:text-blue-300"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Сбросить RPC провайдеры</span>
                      </button>
                    )}
                    
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Скачать MetaMask</span>
                    </a>
                    
      <a
                      href="https://academy.binance.com/en/articles/how-to-add-bsc-to-metamask"
        target="_blank"
        rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
      >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Добавить BSC в MetaMask</span>
      </a>
    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NetworkStatus; 