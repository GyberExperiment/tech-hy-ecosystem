import React from 'react';
import { useAccount, useChainId } from 'wagmi';
import StakingStats from '../entities/Staking/ui/StakingStats';
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
  TrendingUp,
  ArrowRight,
  DollarSign,
  Wallet
} from 'lucide-react';

const Home: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === 97; // BSC Testnet

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="container mx-auto px-4 py-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="animate-glass-float">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              TECH HY Ecosystem
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Революционная Enterprise Venture Governance Platform на Binance Smart Chain
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
              Постоянное блокирование ликвидности с расширенным DAO управлением, защитой от MEV и устойчивыми механизмами вознаграждения
            </p>
          </div>

          {/* Quick Action Buttons */}
          {isConnected && isCorrectNetwork && (
            <div className="flex flex-wrap justify-center gap-4 animate-glass-pulse">
              <Link to="/staking" className="btn-glass-morphic">
                <Zap className="mr-2" size={18} />
                Начать Burn & Earn
              </Link>
              <Link to="/governance" className="btn-glass-morphic">
                <Vote className="mr-2" size={18} />
                DAO Голосования
              </Link>
              <Link to="/tokens" className="btn-glass-morphic">
                <Coins className="mr-2" size={18} />
                Мои Токены
              </Link>
            </div>
          )}
        </div>

        {/* Stats Overview - Only if connected */}
        {isConnected && isCorrectNetwork && (
          <div className="animate-glass-float">
            <StakingStats />
          </div>
        )}

        {/* Core Features */}
        <div className="liquid-glass animate-glass-float">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">
            Основные возможности платформы
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Permanent LP Locking */}
            <div className="glass-ultra p-6 text-center hover:scale-105 transition-transform duration-300">
              <Lock className="mx-auto mb-4 text-red-400 animate-glass-pulse" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-slate-100">🔒 Постоянное LP Locking</h3>
              <p className="text-gray-400 mb-4">
                Необратимое закрепление ликвидности с принуждением через смарт-контракт и прозрачной верификацией в блокчейне
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-400 text-sm">
                Максимальная безопасность
              </div>
            </div>

            {/* VG Token Rewards */}
            <div className="glass-ultra p-6 text-center hover:scale-105 transition-transform duration-300">
              <Gem className="mx-auto mb-4 text-yellow-400 animate-glass-pulse" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-slate-100">💎 VG Token Награды</h3>
              <p className="text-gray-400 mb-4">
                Получайте 10 VG токенов за каждый заблокированный LP токен с устойчивой токеномикой и утилитами управления
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-blue-400 text-sm">
                10 VG за LP токен
              </div>
            </div>

            {/* MEV Protection */}
            <div className="glass-ultra p-6 text-center hover:scale-105 transition-transform duration-300">
              <Shield className="mx-auto mb-4 text-green-400 animate-glass-pulse" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-slate-100">🛡️ MEV Защита</h3>
              <p className="text-gray-400 mb-4">
                Продвинутая защита от sandwich атак с временными ограничениями и контролем проскальзывания
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-green-400 text-sm">
                Анти-MEV защита
              </div>
            </div>

            {/* DAO Governance */}
            <div className="glass-ultra p-6 text-center hover:scale-105 transition-transform duration-300">
              <Vote className="mx-auto mb-4 text-purple-400 animate-glass-pulse" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-slate-100">🏛️ DAO Управление</h3>
              <p className="text-gray-400 mb-4">
                Прогрессивная структура управления с 8 уровнями участия от Starter до Partner
              </p>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 text-purple-400 text-sm">
                Прогрессивное управление
              </div>
            </div>

            {/* NFT Staking Boosters */}
            <div className="glass-ultra p-6 text-center hover:scale-105 transition-transform duration-300">
              <TrendingUp className="mx-auto mb-4 text-cyan-400 animate-glass-pulse" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-slate-100">💎 NFT Стейкинг Бустеры</h3>
              <p className="text-gray-400 mb-4">
                Стейкайте 1M VC токенов чтобы получить "Investor's Hand" NFT с мультипликаторами до 2x
              </p>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-cyan-400 text-sm">
                Diamond Hand 2x
              </div>
            </div>

            {/* Burn & Earn Formula */}
            <div className="glass-ultra p-6 text-center hover:scale-105 transition-transform duration-300">
              <Zap className="mx-auto mb-4 text-orange-400 animate-glass-pulse" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-slate-100">🔥 Burn & Earn</h3>
              <p className="text-gray-400 mb-4">
                Заблокируйте LP токены навсегда и получайте VG токены управления с логарифмическими бонусами
              </p>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-orange-400 text-sm">
                Формула с бонусами
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="liquid-glass animate-glass-float">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-100">
            Как начать
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="glass-ultra w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-100">Подключите кошелёк</h3>
              <p className="text-gray-400">
                Подключите MetaMask и переключитесь на BSC Testnet для тестирования функций
              </p>
            </div>

            <div className="text-center">
              <div className="glass-ultra w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-yellow-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-100">Создайте LP токены</h3>
              <p className="text-gray-400">
                Добавьте ликвидность VC + BNB в PancakeSwap и получите LP токены для блокировки
              </p>
            </div>

            <div className="text-center">
              <div className="glass-ultra w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-100">Burn & Earn VG</h3>
              <p className="text-gray-400">
                Заблокируйте LP токены навсегда и получите мгновенные VG награды для управления
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            {!isConnected ? (
              <div className="glass-ultra border border-blue-500/20 bg-blue-500/5 p-8 rounded-lg max-w-md mx-auto">
                <Wallet className="mx-auto mb-4 text-blue-400" size={48} />
                <h3 className="text-xl font-semibold mb-3 text-slate-100">Начните сейчас</h3>
                <p className="text-gray-400 mb-6">
                  Подключите кошелёк для доступа ко всем функциям платформы
                </p>
              </div>
            ) : !isCorrectNetwork ? (
              <div className="glass-ultra border border-red-500/20 bg-red-500/5 p-8 rounded-lg max-w-md mx-auto">
                <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
                <h3 className="text-xl font-semibold mb-3 text-slate-100">Переключите сеть</h3>
                <p className="text-gray-400 mb-6">
                  Для использования платформы необходимо переключиться на BSC Testnet
                </p>
              </div>
            ) : (
              <div className="glass-ultra border border-green-500/20 bg-green-500/5 p-8 rounded-lg max-w-md mx-auto">
                <Zap className="mx-auto mb-4 text-green-400" size={48} />
                <h3 className="text-xl font-semibold mb-3 text-slate-100">Готово к использованию!</h3>
                <p className="text-gray-400 mb-6">
                  Кошелёк подключён. Начните earning VG токены прямо сейчас
                </p>
                <Link to="/staking" className="btn-glass-morphic">
                  Перейти к Burn & Earn
                  <ArrowRight className="ml-2" size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Platform Stats Banner */}
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-8 text-center animate-glass-float">
          <h2 className="text-2xl font-bold mb-6 text-slate-100">Экосистема в цифрах</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">2K+</div>
              <div className="text-gray-400 text-sm">VC токенов заблокировано</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">80M</div>
              <div className="text-gray-400 text-sm">VG доступно для наград</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">0.2</div>
              <div className="text-gray-400 text-sm">WBNB в ликвидности</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">97</div>
              <div className="text-gray-400 text-sm">BSC Testnet Chain ID</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 