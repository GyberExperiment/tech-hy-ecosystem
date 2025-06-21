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
  AlertTriangle,
  Coins,
  TrendingUp
} from 'lucide-react';

const Home: React.FC = () => {
  const { isConnected, isCorrectNetwork, account } = useWeb3();

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-responsive">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-glass-pulse" />
          <h2 className="hero-title text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Добро пожаловать в LP Locking Ecosystem
          </h2>
          <p className="hero-subtitle text-xl text-gray-400 mb-8">
            Подключите кошелек для доступа к экосистеме
          </p>
          
          <div className="liquid-glass max-w-md mx-auto p-6 animate-glass-float">
            <h3 className="card-title text-xl font-bold text-white mb-4">Начните сейчас</h3>
            <p className="text-gray-300 mb-4">
              Подключите MetaMask для доступа к экосистеме
            </p>
            <button 
              onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
              className="btn-glass-morphic w-full flex items-center justify-center space-x-2"
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
      <div className="animate-fade-in px-responsive">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400 animate-glass-pulse" />
          <h2 className="hero-title text-3xl font-bold mb-4 text-red-400">
            Неправильная сеть
          </h2>
          <p className="hero-subtitle text-xl text-gray-400 mb-8">
            Переключитесь на BSC Testnet для продолжения
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-responsive px-responsive">
      {/* Hero Section - Enhanced with Ultra Modern Glassmorphism */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <Rocket className="w-12 h-12 text-blue-400 animate-glass-pulse" />
          <h1 className="hero-title text-responsive-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent animate-gradient-shift">
            LP Locking Ecosystem
          </h1>
        </div>
        <p className="hero-subtitle text-responsive-lg text-gray-300 mb-8 max-w-3xl mx-auto">
          Блокируйте LP позиции навсегда и получайте VG токены мгновенно для участия в governance
        </p>
      </div>

      {/* Main Widget - Ultra Modern Container */}
      <div className="max-w-2xl mx-auto">
        <div className="liquid-glass p-6 animate-glass-float">
          <EarnVGWidget />
        </div>
      </div>

      {/* Quick Navigation - Enhanced Glass Cards */}
      <div>
        <h2 className="section-title text-responsive-xl font-bold mb-6 text-center">
          Навигация по экосистеме
        </h2>
        
        <div className="grid-responsive-1-2-3">
          <div className="text-center liquid-glass p-6 animate-glass-float">
            <div className="w-16 h-16 glass-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-glass-pulse">
              <Coins className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="card-title text-lg font-bold text-slate-100 mb-2">Token Management</h3>
            <p className="text-gray-300">
              Управляйте своими токенами, делайте переводы и настраивайте разрешения
            </p>
          </div>
          
          <div className="text-center liquid-glass p-6 animate-glass-float">
            <div className="w-16 h-16 glass-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-glass-pulse">
              <Vote className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="card-title text-lg font-bold text-slate-100 mb-2">Governance</h3>
            <p className="text-gray-300">
              Участвуйте в управлении протоколом через децентрализованное голосование
            </p>
          </div>
          
          <div className="text-center liquid-glass p-6 animate-glass-float">
            <div className="w-16 h-16 glass-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-glass-pulse">
              <Rocket className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="card-title text-lg font-bold text-slate-100 mb-2">LP Locking</h3>
            <p className="text-gray-300">
              Заблокируйте LP токены навсегда и получайте VG награды мгновенно
            </p>
          </div>
        </div>
      </div>

      {/* How it Works - Modern Step Cards */}
      <div className="text-center space-y-8">
        <h2 className="section-title text-responsive-xl font-bold mb-6 flex items-center justify-center text-slate-100">
          <Target className="mr-3 text-blue-400 animate-glass-pulse" />
          Как это работает
        </h2>
        
        <div className="grid-responsive-1-2-3">
          <div className="text-center liquid-glass p-6 animate-glass-float">
            <div className="w-12 h-12 glass-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-glass-pulse">
              <span className="text-white font-bold text-lg">1</span>
            </div>
            <h3 className="card-title text-lg font-bold text-slate-100 mb-2">Создайте LP</h3>
            <p className="text-gray-300 text-sm">
              Добавьте VC + BNB в пул ликвидности PancakeSwap и получите LP токены
            </p>
          </div>
          
          <div className="text-center liquid-glass p-6 animate-glass-float">
            <div className="w-12 h-12 glass-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-glass-pulse">
              <span className="text-white font-bold text-lg">2</span>
            </div>
            <h3 className="card-title text-lg font-bold text-slate-100 mb-2">Заблокируйте навсегда</h3>
            <p className="text-gray-300 text-sm">
              LP токены блокируются навсегда в смарт-контракте для обеспечения постоянной ликвидности
            </p>
          </div>
          
          <div className="text-center liquid-glass p-6 animate-glass-float">
            <div className="w-12 h-12 glass-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-glass-pulse">
              <span className="text-white font-bold text-lg">3</span>
            </div>
            <h3 className="card-title text-lg font-bold text-slate-100 mb-2">Участвуйте в DAO</h3>
            <p className="text-gray-300 text-sm">
              Получайте VG токены мгновенно и используйте их для голосования в DAO
            </p>
          </div>
        </div>
      </div>

      {/* Features - Enhanced Feature Grid */}
      <div className="text-center space-y-8">
        <h2 className="section-title text-responsive-xl font-bold mb-6 text-center text-slate-100">
          Ключевые особенности
        </h2>
        
        <div className="grid-responsive-1-2-4">
          <div className="liquid-glass text-center p-6 animate-glass-float">
            <Shield className="w-12 h-12 mx-auto mb-4 text-green-400 animate-glass-pulse" />
            <h3 className="card-title font-bold mb-2 text-slate-100">Безопасность</h3>
            <p className="text-gray-300 text-sm">
              Аудированные смарт-контракты с защитой от MEV и временными блокировками
            </p>
          </div>
          
          <div className="liquid-glass text-center p-6 animate-glass-float">
            <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-400 animate-glass-pulse" />
            <h3 className="card-title font-bold mb-2 text-slate-100">Мгновенность</h3>
            <p className="text-gray-300 text-sm">
              Получайте VG токены мгновенно после блокировки LP токенов
            </p>
          </div>
          
          <div className="liquid-glass text-center p-6 animate-glass-float">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-glass-pulse" />
            <h3 className="card-title font-bold mb-2 text-slate-100">Governance</h3>
            <p className="text-gray-300 text-sm">
              Участвуйте в управлении протоколом через децентрализованное голосование
            </p>
          </div>
          
          <div className="liquid-glass text-center p-6 animate-glass-float">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-glass-pulse" />
            <h3 className="card-title font-bold mb-2 text-slate-100">Ликвидность</h3>
            <p className="text-gray-300 text-sm">
              Обеспечивайте постоянную ликвидность для экосистемы и получайте награды
            </p>
          </div>
        </div>
      </div>

      {/* Network Info - Ultra Modern Info Panel */}
      <div className="liquid-glass p-6 animate-glass-float">
        <h2 className="section-title text-responsive-lg font-bold mb-4 text-center text-slate-100">Информация о сети</h2>
        <div className="grid-responsive-1-2-3 text-sm">
          <div className="flex justify-between items-center p-3 rounded-xl glass-ultra">
            <span className="text-gray-400">Сеть:</span>
            <span className="font-medium text-slate-200">BSC Testnet</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-xl glass-ultra">
            <span className="text-gray-400">DEX:</span>
            <span className="font-medium text-slate-200">PancakeSwap</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-xl glass-ultra">
            <span className="text-gray-400">Защита:</span>
            <span className="font-medium text-slate-200">Timelock</span>
          </div>
        </div>
      </div>

      {/* CTA - Call to Action with Ultra Modern Design */}
      <div className="text-center space-y-6">
        <div className="liquid-glass max-w-2xl mx-auto p-8 animate-glass-float">
          <h2 className="section-title text-responsive-xl font-bold mb-4 text-slate-100">Готовы начать?</h2>
          <p className="text-gray-300 mb-6 text-responsive-base">
            Подключите кошелёк и начните зарабатывать VG токены уже сегодня
          </p>
          <Link
            to="/staking"
            className="btn-glass-morphic inline-block animate-glass-pulse"
          >
            Начать LP Locking
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home; 