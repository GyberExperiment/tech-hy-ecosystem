/**
 * 🌐 Network Switcher Component
 * 
 * Позволяет переключаться между mainnet и testnet
 * Показывает статус контрактов и анализ совместимости
 */

import React, { useState, useEffect } from 'react';
import { getCurrentNetwork, getNetworkInfo, CONTRACTS, NETWORK_STATUS } from '../../../shared/config/contracts';
import { ContractAnalyzer, type MainnetTokenData } from '../../../shared/lib/contractAnalyzer';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { toast } from 'react-hot-toast';

export const NetworkSwitcher: React.FC = () => {
  const { isConnected, account, isCorrectNetwork } = useWeb3();
  const [currentNetwork, setCurrentNetwork] = useState(getCurrentNetwork());
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [mainnetAnalysis, setMainnetAnalysis] = useState<MainnetTokenData | null>(null);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);

  // Обновляем текущую сеть при изменениях
  useEffect(() => {
    const interval = setInterval(() => {
      const newNetwork = getCurrentNetwork();
      if (newNetwork !== currentNetwork) {
        setCurrentNetwork(newNetwork);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentNetwork]);

  const networkInfo = getNetworkInfo();
  const networkStatus = NETWORK_STATUS[currentNetwork];

  // Анализ mainnet контрактов
  const analyzeMainnetContracts = async () => {
    if (currentNetwork !== 'mainnet') {
      toast.error('Переключитесь на mainnet для анализа контрактов');
      return;
    }

    setAnalysisLoading(true);
    try {
      toast.loading('Анализируем mainnet контракты...', { id: 'contract-analysis' });
      
      const analysis = await ContractAnalyzer.analyzeMainnetTokens();
      setMainnetAnalysis(analysis);
      
      const validContracts = analysis.summary.validContracts;
      const totalContracts = analysis.summary.totalAnalyzed;
      
      if (validContracts === totalContracts) {
        toast.success(`Все контракты валидны! (${validContracts}/${totalContracts})`, { id: 'contract-analysis' });
      } else {
        toast.error(`Найдены проблемы в контрактах (${validContracts}/${totalContracts} валидны)`, { id: 'contract-analysis' });
      }
      
      setShowAnalysisReport(true);
    } catch (error) {
      console.error('Contract analysis failed:', error);
      toast.error('Ошибка анализа контрактов', { id: 'contract-analysis' });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getNetworkStatusColor = () => {
    return networkStatus?.isReady ? 'text-green-400' : 'text-yellow-400';
  };

  const getNetworkBadgeColor = () => {
    return currentNetwork === 'mainnet' 
      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
      : 'bg-gradient-to-r from-blue-500 to-cyan-500';
  };

  return (
    <div className="space-y-6">
      {/* Текущая сеть */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Network Status</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getNetworkBadgeColor()}`}>
            {networkInfo.networkName}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="font-medium">Chain ID:</span> {networkInfo.chainId}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Current Network:</span> {currentNetwork}
            </p>
            <p className={`font-medium ${getNetworkStatusColor()}`}>
              <span className="text-gray-300">Status:</span> {networkStatus?.isReady ? 'Ready' : 'In Development'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="font-medium">Wallet Connected:</span> {isConnected ? '✅' : '❌'}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Correct Network:</span> {isCorrectNetwork ? '✅' : '❌'}
            </p>
            {account && (
              <p className="text-gray-300">
                <span className="font-medium">Account:</span> {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">
            <span className="font-medium">Description:</span> {networkStatus?.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {networkStatus?.features.map((feature, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Контракты */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Contract Addresses</h3>
          {currentNetwork === 'mainnet' && (
            <Button
              onClick={analyzeMainnetContracts}
              disabled={analysisLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {analysisLoading ? 'Analyzing...' : 'Analyze Contracts'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <h4 className="font-medium text-blue-400 mb-2">VC Token</h4>
              <p className="text-xs text-gray-300 font-mono break-all">
                {CONTRACTS.VC_TOKEN}
              </p>
              {mainnetAnalysis?.VC_TOKEN && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`text-xs ${mainnetAnalysis.VC_TOKEN.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {mainnetAnalysis.VC_TOKEN.isValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                  {mainnetAnalysis.VC_TOKEN.symbol && (
                    <span className="text-xs text-gray-400">
                      ({mainnetAnalysis.VC_TOKEN.symbol})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <h4 className="font-medium text-yellow-400 mb-2">VG Token</h4>
              <p className="text-xs text-gray-300 font-mono break-all">
                {CONTRACTS.VG_TOKEN}
              </p>
              {mainnetAnalysis?.VG_TOKEN && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`text-xs ${mainnetAnalysis.VG_TOKEN.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {mainnetAnalysis.VG_TOKEN.isValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                  {mainnetAnalysis.VG_TOKEN.symbol && (
                    <span className="text-xs text-gray-400">
                      ({mainnetAnalysis.VG_TOKEN.symbol})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <h4 className="font-medium text-purple-400 mb-2">LP Locker</h4>
              <p className="text-xs text-gray-300 font-mono break-all">
                {CONTRACTS.LP_LOCKER}
              </p>
              <span className="text-xs text-gray-400">
                {currentNetwork === 'mainnet' ? '⚠️ TBD' : '✅ Deployed'}
              </span>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <h4 className="font-medium text-green-400 mb-2">VC Sale</h4>
              <p className="text-xs text-gray-300 font-mono break-all">
                {CONTRACTS.VCSALE}
              </p>
              <span className="text-xs text-gray-400">
                {currentNetwork === 'mainnet' ? '⚠️ TBD' : '✅ Deployed'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Анализ контрактов */}
      {mainnetAnalysis && showAnalysisReport && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Contract Analysis Report</h3>
            <Button
              onClick={() => setShowAnalysisReport(false)}
              variant="outline"
              size="sm"
            >
              Hide Report
            </Button>
          </div>

          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-medium text-white mb-3">📊 Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Analyzed:</span>
                  <div className="text-white font-mono">{mainnetAnalysis.summary.totalAnalyzed}</div>
                </div>
                <div>
                  <span className="text-gray-400">Valid Contracts:</span>
                  <div className="text-green-400 font-mono">{mainnetAnalysis.summary.validContracts}</div>
                </div>
                <div>
                  <span className="text-gray-400">ERC20 Compatible:</span>
                  <div className="text-blue-400 font-mono">{mainnetAnalysis.summary.compatibleContracts}</div>
                </div>
                <div>
                  <span className="text-gray-400">Errors:</span>
                  <div className="text-red-400 font-mono">{mainnetAnalysis.summary.errors.length}</div>
                </div>
              </div>
            </div>

            {/* Рекомендации */}
            {mainnetAnalysis.summary.recommendations.length > 0 && (
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <h4 className="font-medium text-yellow-400 mb-3">💡 Recommendations</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  {mainnetAnalysis.summary.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ошибки */}
            {mainnetAnalysis.summary.errors.length > 0 && (
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <h4 className="font-medium text-red-400 mb-3">❌ Errors</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  {mainnetAnalysis.summary.errors.map((error, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Полный отчет */}
            <details className="p-4 bg-white/5 rounded-lg">
              <summary className="font-medium text-white cursor-pointer hover:text-gray-300">
                📄 Full Technical Report
              </summary>
              <pre className="mt-3 p-3 bg-black/30 rounded text-xs text-gray-300 overflow-x-auto">
                {ContractAnalyzer.generateAnalysisReport(mainnetAnalysis)}
              </pre>
            </details>
          </div>
        </Card>
      )}

      {/* Инструкции для mainnet */}
      {currentNetwork === 'mainnet' && !networkStatus?.isReady && (
        <Card className="p-6 border border-yellow-500/20 bg-yellow-500/5">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Mainnet Development Status</h3>
          <p className="text-gray-300 mb-4">
            The mainnet ecosystem is partially deployed. Some contracts are still in development.
          </p>
          
          {networkStatus?.nextSteps && (
            <div>
              <h4 className="font-medium text-white mb-2">Next Steps:</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                {networkStatus.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default NetworkSwitcher; 