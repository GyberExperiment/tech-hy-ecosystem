import React from 'react';
// import { BuyVCWidget } from '../../../entities/Token'; // Temporarily disabled for mainnet
import { cn } from '../../../shared/lib/cn';

interface TokenManagementWidgetProps {
  className?: string;
}

const TokenManagementWidget: React.FC<TokenManagementWidgetProps> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Управление токенами
        </h2>
        <p className="text-gray-400">
          Покупайте, продавайте и управляйте вашими токенами
        </p>
      </div>

      {/* BuyVCWidget */}
      {/* Temporarily disabled for mainnet deployment
      <BuyVCWidget />
      */}
      
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6 text-center">
        <div className="text-purple-400 text-lg font-semibold mb-2">
          VC Purchase Widget
        </div>
        <div className="text-gray-400 text-sm">
          Временно отключен для mainnet деплоя
        </div>
      </div>
    </div>
  );
};

export default TokenManagementWidget; 