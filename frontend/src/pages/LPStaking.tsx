import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import EarnVGWidget from '../components/EarnVGWidget';
import VGConverter from '../components/VGConverter';
import LPPoolManager from '../components/LPPoolManager';
import { Rocket, Gift, Vote } from 'lucide-react';

const LPLocking: React.FC = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Rocket className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LP Locking
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Блокируйте LP позиции навсегда и получайте VG токены мгновенно для governance
        </p>
      </div>

      {isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Locking Widget */}
          <div className="space-y-6">
            <EarnVGWidget />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 text-center">
                <Gift className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm text-gray-400">VG Earned</p>
                <p className="text-xl font-bold text-white">0.00</p>
              </div>
              
              <div className="glass-panel p-4 text-center">
                <Vote className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-sm text-gray-400">Voting Power</p>
                <p className="text-xl font-bold text-white">0.00</p>
              </div>
            </div>
          </div>

          {/* VG Converter */}
          <div>
            <VGConverter />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">
            Подключите кошелёк для доступа к LP Locking
          </p>
        </div>
      )}

      {/* LP Pool Manager */}
      {isConnected && (
        <div className="mt-12">
          <LPPoolManager />
        </div>
      )}
    </div>
  );
};

export default LPLocking; 