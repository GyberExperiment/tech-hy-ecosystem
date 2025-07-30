import React from 'react';

import { useSwitchChain } from 'wagmi';
import { Lock, AlertTriangle, LucideIcon, RefreshCw } from 'lucide-react';
import { bscTestnet } from 'wagmi/chains';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface PageConnectionPromptProps {
  // Page specific customization
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  iconColor?: string;
  titleGradient?: string;
  
  // Connection states
  isConnected?: boolean;
  isCorrectNetwork?: boolean;
  
  // Optional custom content
  children?: React.ReactNode;
}

export const PageConnectionPrompt: React.FC<PageConnectionPromptProps> = ({
  title,
  subtitle,
  icon: CustomIcon = Lock,
  iconColor = 'text-gray-400',
  titleGradient = 'from-blue-400 to-purple-500',
  isConnected = false,
  isCorrectNetwork = false,
  children
}) => {
  const { t } = useTranslation();
  const { switchChain } = useSwitchChain();

  const handleSwitchToTestnet = async () => {
    try {
      await switchChain({ chainId: bscTestnet.id });
      toast.success('Сеть успешно переключена на BSC Testnet');
    } catch (error: any) {
      toast.error('Ошибка переключения сети: ' + (error?.message || 'Неизвестная ошибка'));
    }
  };

  // Wrong network state
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-3xl font-bold mb-4 text-red-400">
            Неправильная сеть
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Переключитесь на BSC Testnet для использования DApp
          </p>
          
          {/* Network Switch Button */}
          <div className="space-y-4">
            <button
              onClick={handleSwitchToTestnet}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Переключить на BSC Testnet</span>
            </button>
            
            <div className="text-sm text-gray-500">
              <p>Или добавьте BSC Testnet вручную:</p>
              <div className="mt-2 bg-gray-800/50 rounded-lg p-3 text-left text-xs font-mono">
                <div>Network Name: BSC Testnet</div>
                <div>RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545</div>
                <div>Chain ID: 97</div>
                <div>Symbol: BNB</div>
                <div>Explorer: https://testnet.bscscan.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <CustomIcon className={`w-16 h-16 mx-auto mb-4 ${iconColor}`} />
          <h2 className={`text-3xl font-bold mb-4 bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
            {title}
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="text-lg text-gray-300">
            {t('common:messages.connectWallet')}
          </div>
          {children && (
            <div className="mt-8">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If connected and correct network, don't render anything
  return null;
};

export default PageConnectionPrompt; 