import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface WalletInfo {
  name: string;
  detected: boolean;
  isMetaMask: boolean;
  isConflicting: boolean;
}

const WalletTroubleshoot: React.FC = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const detectWallets = () => {
      const detectedWallets: WalletInfo[] = [];

      // Check main window.ethereum
      if (window.ethereum) {
        if (window.ethereum.isMetaMask) {
          detectedWallets.push({
            name: 'MetaMask',
            detected: true,
            isMetaMask: true,
            isConflicting: false
          });
        }

        // Check for other wallets injecting into window.ethereum
        if (window.ethereum.isCoinbaseWallet) {
          detectedWallets.push({
            name: 'Coinbase Wallet',
            detected: true,
            isMetaMask: false,
            isConflicting: true
          });
        }

        if (window.ethereum.isTrust) {
          detectedWallets.push({
            name: 'Trust Wallet',
            detected: true,
            isMetaMask: false,
            isConflicting: true
          });
        }

        if (window.ethereum.isTokenPocket) {
          detectedWallets.push({
            name: 'TokenPocket',
            detected: true,
            isMetaMask: false,
            isConflicting: true
          });
        }

        // Check for evmAsk or other conflicting extensions
        if (window.ethereum.isEvmAsk) {
          detectedWallets.push({
            name: 'evmAsk',
            detected: true,
            isMetaMask: false,
            isConflicting: true
          });
        }

        // Check for multiple providers
        if (window.ethereum.providers && window.ethereum.providers.length > 1) {
          window.ethereum.providers.forEach((provider: any, index: number) => {
            if (provider.isMetaMask) {
              detectedWallets.push({
                name: `MetaMask (Provider ${index + 1})`,
                detected: true,
                isMetaMask: true,
                isConflicting: window.ethereum.providers.length > 1
              });
            } else {
              detectedWallets.push({
                name: `Unknown Wallet (Provider ${index + 1})`,
                detected: true,
                isMetaMask: false,
                isConflicting: true
              });
            }
          });
        }
      }

      // Check for evmproviders (EIP-5749)
      if ((window as any).evmproviders) {
        Object.entries((window as any).evmproviders).forEach(([key, provider]: [string, any]) => {
          detectedWallets.push({
            name: provider.info?.name || key,
            detected: true,
            isMetaMask: provider.info?.name?.toLowerCase().includes('metamask') || false,
            isConflicting: false
          });
        });
      }

      // Check for specific wallet extensions
      if ((window as any).ethereum?.isBraveWallet) {
        detectedWallets.push({
          name: 'Brave Wallet',
          detected: true,
          isMetaMask: false,
          isConflicting: true
        });
      }

      setWallets(detectedWallets);
    };

    detectWallets();
  }, []);

  const conflictingWallets = wallets.filter(w => w.isConflicting);
  const hasConflicts = conflictingWallets.length > 0;

  const getInstructions = () => {
    if (wallets.length === 0) {
      return [
        "MetaMask не обнаружен",
        "Установите MetaMask расширение для Chrome/Brave/Edge",
        "Перезагрузите страницу после установки"
      ];
    }

    if (hasConflicts) {
      return [
        "Обнаружены конфликтующие кошельки",
        "Отключите все кошельки кроме MetaMask в chrome://extensions/",
        "Или установите MetaMask как кошелёк по умолчанию в настройках других кошельков",
        "Перезагрузите страницу после изменений"
      ];
    }

    return [
      "Конфигурация кошелька выглядит корректно",
      "Если проблемы продолжаются, попробуйте перезагрузить страницу",
      "Проверьте что MetaMask подключен к BSC Testnet"
    ];
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <AlertTriangle className={hasConflicts ? "text-red-400" : "text-green-400"} size={20} />
          <span>Диагностика кошелька</span>
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {showDetails ? 'Скрыть детали' : 'Показать детали'}
        </button>
      </div>

      {/* Status Summary */}
      <div className={`p-4 rounded-lg mb-4 ${
        hasConflicts 
          ? 'bg-red-500/10 border border-red-500/20' 
          : 'bg-green-500/10 border border-green-500/20'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {hasConflicts ? (
            <XCircle className="text-red-400" size={16} />
          ) : (
            <CheckCircle className="text-green-400" size={16} />
          )}
          <span className={`font-medium ${hasConflicts ? 'text-red-400' : 'text-green-400'}`}>
            {hasConflicts ? 'Конфликты обнаружены' : 'Конфигурация корректна'}
          </span>
        </div>
        
        <div className="text-sm text-gray-300">
          Обнаружено кошельков: {wallets.length}
          {hasConflicts && ` (${conflictingWallets.length} конфликтующих)`}
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2 mb-4">
        <h4 className="font-medium text-white flex items-center space-x-2">
          <Info size={16} />
          <span>Рекомендации:</span>
        </h4>
        {getInstructions().map((instruction, index) => (
          <div key={index} className="flex items-start space-x-2 text-sm text-gray-300">
            <span className="text-blue-400 font-bold">{index + 1}.</span>
            <span>{instruction}</span>
          </div>
        ))}
      </div>

      {/* Detailed Wallet List */}
      {showDetails && wallets.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <h4 className="font-medium text-white mb-3">Обнаруженные кошельки:</h4>
          <div className="space-y-2">
            {wallets.map((wallet, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  {wallet.isMetaMask ? (
                    <CheckCircle className="text-green-400" size={16} />
                  ) : wallet.isConflicting ? (
                    <XCircle className="text-red-400" size={16} />
                  ) : (
                    <Info className="text-blue-400" size={16} />
                  )}
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {wallet.isMetaMask && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Рекомендуется
                    </span>
                  )}
                  {wallet.isConflicting && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                      Конфликт
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm"
          >
            Перезагрузить страницу
          </button>
          <button
            onClick={() => window.open('chrome://extensions/', '_blank')}
            className="btn-primary text-sm"
          >
            Управление расширениями
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletTroubleshoot; 