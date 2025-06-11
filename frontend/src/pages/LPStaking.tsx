import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import EarnVGWidget from '../components/EarnVGWidget';
import LPPoolManager from '../components/LPPoolManager';

const LPStaking: React.FC = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🚀 LP Staking
          </h1>
          <p className="text-xl text-gray-300">
            Создавайте LP позиции и получайте VG токены
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-panel p-8 max-w-md mx-auto text-center">
            <h3 className="text-xl font-bold text-white mb-4">Подключите кошелёк</h3>
            <p className="text-gray-300 mb-4">
              Для участия в LP Staking необходимо подключить MetaMask
            </p>
            <button 
              onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-200"
            >
              🦊 Connect MetaMask
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* LP Pool Manager */}
              <div>
                <LPPoolManager />
              </div>

              {/* Earn VG Widget */}
              <div>
                <EarnVGWidget />
              </div>

            </div>

            {/* Info Section */}
            <div className="glass-panel p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">📚 Как работает LP Staking</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">1. Подготовьте токены</h3>
                  <p className="text-gray-300 text-sm">
                    Получите VC токены и BNB для создания LP позиции
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏊‍♂️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">2. Создайте LP</h3>
                  <p className="text-gray-300 text-sm">
                    Автоматически создайте LP позицию в PancakeSwap пуле
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💎</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">3. Получите VG</h3>
                  <p className="text-gray-300 text-sm">
                    LP токены автоматически обмениваются на VG награды
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🗳️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">4. Участвуйте в DAO</h3>
                  <p className="text-gray-300 text-sm">
                    Используйте VG токены для голосования в governance
                  </p>
                </div>

              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-4 px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <span className="text-blue-400">💡</span>
                  <p className="text-blue-400 font-medium">
                    LP токены автоматически заперты навсегда для обеспечения ликвидности
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default LPStaking; 