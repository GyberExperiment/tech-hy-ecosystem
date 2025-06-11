import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import EarnVGWidget from '../components/EarnVGWidget';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const { isConnected, account } = useWeb3();

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            🚀 LP Staking Ecosystem
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Создавайте LP позиции и получайте VG токены для участия в governance
          </p>
          
          {!isConnected && (
            <div className="glass-panel p-6 max-w-md mx-auto mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Начните сейчас</h3>
              <p className="text-gray-300 mb-4">
                Подключите MetaMask для доступа к экосистеме
              </p>
              <button 
                onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-200"
              >
                🦊 Connect MetaMask
              </button>
            </div>
          )}
        </div>

        {/* Main Widget */}
        <div className="max-w-2xl mx-auto mb-12">
          <EarnVGWidget />
        </div>

        {/* Quick Stats */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            <Link to="/tokens" className="glass-panel p-6 hover:scale-105 transition-transform duration-200">
              <div className="text-center">
                <div className="text-3xl mb-3">💎</div>
                <h3 className="text-lg font-bold text-white mb-2">Token Management</h3>
                <p className="text-gray-300 text-sm">
                  Управляйте VC, VG и VGVotes токенами
                </p>
              </div>
            </Link>

            <Link to="/governance" className="glass-panel p-6 hover:scale-105 transition-transform duration-200">
              <div className="text-center">
                <div className="text-3xl mb-3">🗳️</div>
                <h3 className="text-lg font-bold text-white mb-2">Governance</h3>
                <p className="text-gray-300 text-sm">
                  Голосуйте за изменения в экосистеме
                </p>
              </div>
            </Link>

            <Link to="/pool-manager" className="glass-panel p-6 hover:scale-105 transition-transform duration-200">
              <div className="text-center">
                <div className="text-3xl mb-3">🏊‍♂️</div>
                <h3 className="text-lg font-bold text-white mb-2">Pool Manager</h3>
                <p className="text-gray-300 text-sm">
                  Управление ликвидностью PancakeSwap
                </p>
              </div>
            </Link>

          </div>
        )}

        {/* How it Works */}
        <div className="glass-panel p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">🎯 Как это работает</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Создайте LP</h3>
              <p className="text-gray-300 text-sm">
                Добавьте VC и BNB токены в пул ликвидности PancakeSwap
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Получите VG</h3>
              <p className="text-gray-300 text-sm">
                LP токены автоматически обмениваются на VG токены
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Участвуйте в DAO</h3>
              <p className="text-gray-300 text-sm">
                Конвертируйте VG в VGVotes и голосуйте в governance
              </p>
            </div>

          </div>
        </div>

        {/* Network Info */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>🌐 BSC Testnet • 🥞 PancakeSwap Integration • 🔒 Timelock Protected</p>
          {isConnected && account && (
            <p className="mt-2">
              📱 Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home; 