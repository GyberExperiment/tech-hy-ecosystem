import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import EarnVGWidget from '../components/EarnVGWidget';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Gem, 
  Vote, 
  Waves, 
  Target, 
  Globe, 
  Smartphone,
  Shield,
  Zap
} from 'lucide-react';

const Home: React.FC = () => {
  const { isConnected, account } = useWeb3();

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Rocket className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              LP Locking Ecosystem
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Блокируйте LP позиции навсегда и получайте VG токены мгновенно для участия в governance
          </p>
          
          {!isConnected && (
            <div className="glass-panel p-6 max-w-md mx-auto mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Начните сейчас</h3>
              <p className="text-gray-300 mb-4">
                Подключите MetaMask для доступа к экосистеме
              </p>
              <button 
                onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Connect MetaMask</span>
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
                <Gem className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                <h3 className="text-lg font-bold text-white mb-2">Token Management</h3>
                <p className="text-gray-300 text-sm">
                  Управляйте VC, VG и VGVotes токенами
                </p>
              </div>
            </Link>

            <Link to="/governance" className="glass-panel p-6 hover:scale-105 transition-transform duration-200">
              <div className="text-center">
                <Vote className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <h3 className="text-lg font-bold text-white mb-2">Governance</h3>
                <p className="text-gray-300 text-sm">
                  Голосуйте за изменения в экосистеме
                </p>
              </div>
            </Link>

            <Link to="/pool-manager" className="glass-panel p-6 hover:scale-105 transition-transform duration-200">
              <div className="text-center">
                <Waves className="w-12 h-12 mx-auto mb-3 text-green-400" />
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
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Target className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white text-center">Как это работает</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Создайте LP</h3>
              <p className="text-gray-300 text-sm">
                Добавьте VC и BNB токены в пул ликвидности PancakeSwap
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Заблокируйте навсегда</h3>
              <p className="text-gray-300 text-sm">
                LP токены блокируются навсегда в обмен на VG токены (15:1)
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">3</span>
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
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span>BSC Testnet</span>
            </div>
            <div className="flex items-center space-x-1">
              <Waves className="w-4 h-4" />
              <span>PancakeSwap Integration</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Timelock Protected</span>
            </div>
          </div>
          {isConnected && account && (
            <div className="flex items-center justify-center space-x-1 mt-2">
              <Smartphone className="w-4 h-4" />
              <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home; 