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
    <div className="min-h-screen clean-bg">
      <div className="clean-container py-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="animate-gentle-float">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-teal bg-clip-text text-transparent">
              TECH HY Ecosystem
            </h1>
            <p className="text-xl md:text-2xl text-text-gray mb-8 max-w-4xl mx-auto">
              Революционная Enterprise Venture Governance Platform на Binance Smart Chain
            </p>
            <p className="text-lg text-medium-gray max-w-3xl mx-auto mb-8">
              Постоянное блокирование ликвидности с расширенным DAO управлением, защетой от MEV и устойчивыми механизмами вознаграждения
            </p>
          </div>

          {/* Quick Action Buttons */}
          {isConnected && isCorrectNetwork && (
            <div className="flex flex-wrap justify-center gap-4 animate-subtle-glow">
              <Link to="/staking" className="clean-btn-primary">
                <Zap className="mr-2" size={18} />
                Начать Burn & Earn
              </Link>
              <Link to="/governance" className="clean-btn">
                <Vote className="mr-2" size={18} />
                DAO Голосования
              </Link>
              <Link to="/tokens" className="clean-btn">
                <Coins className="mr-2" size={18} />
                Мои Токены
              </Link>
            </div>
          )}
        </div>

        {/* Stats Overview - Only if connected */}
        {isConnected && isCorrectNetwork && (
          <div className="animate-gentle-float">
            <StakingStats />
          </div>
        )}

        {/* Core Features */}
        <div className="frosted-glass animate-gentle-float">
          <h2 className="text-3xl font-bold text-center mb-12 text-dark-gray">
            Основные возможности платформы
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Permanent LP Locking */}
            <div className="clean-card p-6 text-center">
              <Lock className="mx-auto mb-4 text-accent-red animate-subtle-glow" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">🔒 Постоянное LP Locking</h3>
              <p className="text-text-gray mb-4">
                Необратимое закрепление ликвидности с принуждением через смарт-контракт и прозрачной верификацией в блокчейне
              </p>
              <div className="status-error">
                Максимальная безопасность
              </div>
            </div>

            {/* VG Token Rewards */}
            <div className="clean-card p-6 text-center">
              <Gem className="mx-auto mb-4 text-accent-orange animate-subtle-glow" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">💎 VG Token Награды</h3>
              <p className="text-text-gray mb-4">
                Получайте 10 VG токенов за каждый заблокированный LP токен с устойчивой токеномикой и утилитами управления
              </p>
              <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-2 text-accent-blue text-sm">
                10 VG за LP токен
              </div>
            </div>

            {/* MEV Protection */}
            <div className="clean-card p-6 text-center">
              <Shield className="mx-auto mb-4 text-accent-green animate-subtle-glow" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">🛡️ MEV Защита</h3>
              <p className="text-text-gray mb-4">
                Продвинутая защита от sandwich атак с временными ограничениями и контролем проскальзывания
              </p>
              <div className="status-success">
                Анти-MEV защита
              </div>
            </div>

            {/* DAO Governance */}
            <div className="clean-card p-6 text-center">
              <Vote className="mx-auto mb-4 text-accent-purple animate-subtle-glow" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">🏛️ DAO Управление</h3>
              <p className="text-text-gray mb-4">
                Прогрессивная структура управления с 8 уровнями участия от Starter до Partner
              </p>
              <div className="bg-accent-purple/10 border border-accent-purple/30 rounded-lg p-2 text-accent-purple text-sm">
                Прогрессивное управление
              </div>
            </div>

            {/* NFT Staking Boosters */}
            <div className="clean-card p-6 text-center">
              <TrendingUp className="mx-auto mb-4 text-accent-teal animate-subtle-glow" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">💎 NFT Стейкинг Бустеры</h3>
              <p className="text-text-gray mb-4">
                Стейкайте 1M VC токенов чтобы получить "Investor's Hand" NFT с мультипликаторами до 2x
              </p>
              <div className="bg-accent-teal/10 border border-accent-teal/30 rounded-lg p-2 text-accent-teal text-sm">
                Diamond Hand 2x
              </div>
            </div>

            {/* Burn & Earn Formula */}
            <div className="clean-card p-6 text-center">
              <Zap className="mx-auto mb-4 text-accent-orange animate-subtle-glow" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">🔥 Burn & Earn</h3>
              <p className="text-text-gray mb-4">
                Заблокируйте LP токены навсегда и получайте VG токены управления с логарифмическими бонусами
              </p>
              <div className="status-warning">
                Формула с бонусами
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="frosted-glass animate-gentle-float">
          <h2 className="text-3xl font-bold text-center mb-8 text-dark-gray">
            Как начать
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="clean-glass w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent-blue">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">Подключите кошелёк</h3>
              <p className="text-text-gray">
                Подключите MetaMask и переключитесь на BSC Testnet для тестирования функций
              </p>
            </div>

            <div className="text-center">
              <div className="clean-glass w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent-orange">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">Создайте LP токены</h3>
              <p className="text-text-gray">
                Добавьте ликвидность VC + BNB в PancakeSwap и получите LP токены для блокировки
              </p>
            </div>

            <div className="text-center">
              <div className="clean-glass w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent-green">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-dark-gray">Burn & Earn VG</h3>
              <p className="text-text-gray">
                Заблокируйте LP токены навсегда и получите мгновенные VG награды для управления
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            {!isConnected ? (
              <div className="clean-glass border border-accent-blue/30 bg-accent-blue/5 p-8 rounded-lg max-w-md mx-auto">
                <Wallet className="mx-auto mb-4 text-accent-blue" size={48} />
                <h3 className="text-xl font-semibold mb-3 text-dark-gray">Начните сейчас</h3>
                <p className="text-text-gray mb-6">
                  Подключите кошелёк для доступа ко всем функциям платформы
                </p>
              </div>
            ) : !isCorrectNetwork ? (
              <div className="clean-glass border border-accent-red/30 bg-accent-red/5 p-8 rounded-lg max-w-md mx-auto">
                <AlertTriangle className="mx-auto mb-4 text-accent-red" size={48} />
                <h3 className="text-xl font-semibold mb-3 text-dark-gray">Переключите сеть</h3>
                <p className="text-text-gray mb-6">
                  Для использования платформы необходимо переключиться на BSC Testnet
                </p>
              </div>
            ) : (
              <div className="clean-glass border border-accent-green/30 bg-accent-green/5 p-8 rounded-lg max-w-md mx-auto">
                <Zap className="mx-auto mb-4 text-accent-green" size={48} />
                <h3 className="text-xl font-semibold mb-3 text-dark-gray">Готово к использованию!</h3>
                <p className="text-text-gray mb-6">
                  Кошелёк подключён. Начните earning VG токены прямо сейчас
                </p>
                <Link to="/staking" className="clean-btn-primary">
                  Перейти к Burn & Earn
                  <ArrowRight className="ml-2" size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Platform Stats Banner */}
        <div className="bg-gradient-accent/10 border border-accent-blue/20 rounded-lg p-8 text-center animate-gentle-float">
          <h2 className="text-2xl font-bold mb-6 text-dark-gray">Экосистема в цифрах</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-accent-blue mb-2">2K+</div>
              <div className="text-text-gray text-sm">VC токенов заблокировано</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-accent-green mb-2">80M</div>
              <div className="text-text-gray text-sm">VG доступно для наград</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-accent-orange mb-2">0.2</div>
              <div className="text-text-gray text-sm">WBNB в ликвидности</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-accent-purple mb-2">97</div>
              <div className="text-text-gray text-sm">BSC Testnet Chain ID</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 