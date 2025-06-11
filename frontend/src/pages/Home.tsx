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
  Zap,
  Lock,
  AlertTriangle
} from 'lucide-react';

const Home: React.FC = () => {
  const { isConnected, isCorrectNetwork, account } = useWeb3();

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Добро пожаловать в LP Locking Ecosystem
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Подключите кошелек для доступа к экосистеме
          </p>
          
          <div className="card max-w-md mx-auto">
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
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in px-4 md:px-8 lg:px-12">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-3xl font-bold mb-4 text-red-400">
            Неправильная сеть
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Переключитесь на BSC Testnet для продолжения
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 px-4 md:px-8 lg:px-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <Rocket className="w-12 h-12 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LP Locking Ecosystem
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Блокируйте LP позиции навсегда и получайте VG токены мгновенно для участия в governance
        </p>
      </div>

      {/* Main Widget */}
      <div className="max-w-2xl mx-auto">
        <EarnVGWidget />
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Навигация по экосистеме
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/tokens" className="card text-center group hover:scale-105 transition-transform duration-200">
            <Gem className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <h3 className="text-lg font-bold text-white mb-2">Token Management</h3>
            <p className="text-gray-300 text-sm">
              Управляйте VC, VG и VGVotes токенами
            </p>
          </Link>

          <Link to="/governance" className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-3 text-purple-400" />
            <h3 className="text-lg font-bold text-white mb-2">Governance</h3>
            <p className="text-gray-300 text-sm">
              Голосуйте за изменения в экосистеме
            </p>
          </Link>

          <Link to="/staking" className="card text-center group hover:scale-105 transition-transform duration-200">
            <Waves className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h3 className="text-lg font-bold text-white mb-2">LP Locking</h3>
            <p className="text-gray-300 text-sm">
              Заблокируйте LP токены и получите VG
            </p>
          </Link>
        </div>
      </div>

      {/* How it Works */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-center">
          <Target className="mr-3 text-blue-400" />
          Как это работает
        </h2>
        
        <div className="card">
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
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Особенности экосистемы
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-blue-400" />
            <h3 className="font-bold mb-2">Безопасность</h3>
            <p className="text-gray-400 text-sm">
              Timelock защита и проверенные контракты
            </p>
          </div>
          
          <div className="card text-center">
            <Zap className="w-10 h-10 mx-auto mb-3 text-yellow-400" />
            <h3 className="font-bold mb-2">Мгновенность</h3>
            <p className="text-gray-400 text-sm">
              Получайте VG токены сразу после блокировки
            </p>
          </div>
          
          <div className="card text-center">
            <Vote className="w-10 h-10 mx-auto mb-3 text-purple-400" />
            <h3 className="font-bold mb-2">Governance</h3>
            <p className="text-gray-400 text-sm">
              Участвуйте в принятии решений
            </p>
          </div>
          
          <div className="card text-center">
            <Waves className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <h3 className="font-bold mb-2">Ликвидность</h3>
            <p className="text-gray-400 text-sm">
              Поддержка PancakeSwap интеграции
            </p>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-center">Информация о сети</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Globe className="w-8 h-8 text-blue-400" />
            <span className="font-medium">BSC Testnet</span>
            <span className="text-sm text-gray-400">Binance Smart Chain</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <Waves className="w-8 h-8 text-green-400" />
            <span className="font-medium">PancakeSwap</span>
            <span className="text-sm text-gray-400">DEX Integration</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <Shield className="w-8 h-8 text-purple-400" />
            <span className="font-medium">Timelock</span>
            <span className="text-sm text-gray-400">Protected Governance</span>
          </div>
        </div>
        
        {account && (
          <div className="mt-6 pt-6 border-t border-gray-700 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Smartphone className="w-4 h-4" />
              <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="card text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <h2 className="text-2xl font-bold mb-4">Готовы начать?</h2>
        <p className="text-gray-300 mb-6">
          Присоединяйтесь к экосистеме LP Locking и начните зарабатывать VG токены уже сегодня
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/staking" className="btn-primary inline-flex items-center justify-center space-x-2">
            <Rocket className="w-5 h-5" />
            <span>Начать LP Locking</span>
          </Link>
          
          <Link to="/tokens" className="btn-secondary inline-flex items-center justify-center space-x-2">
            <Gem className="w-5 h-5" />
            <span>Управление токенами</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home; 