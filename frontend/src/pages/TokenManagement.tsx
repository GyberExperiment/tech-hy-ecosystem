import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import VGConverter from '../components/VGConverter';
import EarnVGWidget from '../components/EarnVGWidget';

const TokenManagement: React.FC = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            💎 Token Management
          </h1>
          <p className="text-xl text-gray-300">
            Управляйте вашими токенами и участвуйте в экосистеме
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-panel p-8 max-w-md mx-auto text-center">
            <h3 className="text-xl font-bold text-white mb-4">Подключите кошелёк</h3>
            <p className="text-gray-300 mb-4">
              Для управления токенами необходимо подключить MetaMask
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
            
            {/* Main Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Earn VG Widget */}
              <div>
                <EarnVGWidget />
              </div>

              {/* VG Converter Widget */}
              <div>
                <VGConverter />
              </div>

            </div>

            {/* Token Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              
              <div className="glass-panel p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-white mb-2">VC Token</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Основной токен для создания LP позиций
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Supply:</span>
                      <span className="text-white">1B VC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Decimals:</span>
                      <span className="text-white">18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">Utility</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">💎</div>
                  <h3 className="text-xl font-bold text-white mb-2">VG Token</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Награды за стейкинг LP токенов
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Supply:</span>
                      <span className="text-white">100M VG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Decimals:</span>
                      <span className="text-white">18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">Reward</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗳️</div>
                  <h3 className="text-xl font-bold text-white mb-2">VGVotes Token</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Voting power для DAO governance
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exchange Rate:</span>
                      <span className="text-white">1:1 с VG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Decimals:</span>
                      <span className="text-white">18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">Governance</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Process Flow */}
            <div className="glass-panel p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">🔄 Token Flow</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">1. Get VC + BNB</h3>
                  <p className="text-gray-300 text-sm">
                    Приобретите VC токены и BNB для создания LP
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏊‍♂️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">2. Create LP</h3>
                  <p className="text-gray-300 text-sm">
                    Создайте LP позицию в PancakeSwap
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💎</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">3. Earn VG</h3>
                  <p className="text-gray-300 text-sm">
                    Обменяйте LP токены на VG через LPLocker
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🗳️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">4. Vote in DAO</h3>
                  <p className="text-gray-300 text-sm">
                    Конвертируйте VG в VGVotes и участвуйте в голосовании
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

export default TokenManagement; 