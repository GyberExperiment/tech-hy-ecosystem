import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, ExternalLink, Zap, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WalletInfo {
  name: string;
  detected: boolean;
  isMetaMask: boolean;
  isConflicting: boolean;
}

const WalletTroubleshoot: React.FC = () => {
  const { t } = useTranslation(['common']);
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

  const troubleshootSteps = [
    {
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      title: 'Установите MetaMask',
      description: 'Убедитесь, что MetaMask установлен и активен',
      action: 'Скачать MetaMask',
      link: 'https://metamask.io/download/',
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      title: 'Отключите конфликтующие кошельки',
      description: 'Phantom, Brave Wallet и другие кошельки могут конфликтовать с MetaMask',
      action: 'Отключить в настройках браузера',
      link: null,
    },
    {
      icon: <Zap className="w-5 h-5 text-green-400" />,
      title: 'Обновите страницу',
      description: 'После отключения других кошельков обновите страницу',
      action: 'Обновить страницу',
      link: null,
    },
  ];

  return (
    <div className="card border-yellow-500/20 bg-yellow-500/5">
      <div className="flex items-center space-x-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-yellow-400" />
        <h3 className="text-lg font-semibold text-yellow-400">
          Проблемы с подключением кошелька?
        </h3>
      </div>
      
      <div className="space-y-4">
        {troubleshootSteps.map((step, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50">
            <div className="flex-shrink-0 mt-0.5">
              {step.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white mb-1">{step.title}</h4>
              <p className="text-sm text-gray-300 mb-2">{step.description}</p>
              {step.link ? (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {step.action}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              ) : (
                <span className="text-sm text-gray-400">{step.action}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-blue-300">
          <strong>Совет:</strong> Если у вас установлен Phantom кошелек, отключите его в настройках браузера, 
          чтобы избежать конфликтов с MetaMask при работе с BSC сетью.
        </p>
      </div>
    </div>
  );
};

export default WalletTroubleshoot; 