/**
 * 🚧 Coming Soon Governance Page
 * 
 * Ультра-модерная страница "в разработке" для Governance
 * Современный дизайн 2025 с анимациями и интерактивностью
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Vote, 
  Rocket, 
  Zap, 
  Sparkles, 
  Clock, 
  GitBranch,
  Code2,
  Shield,
  Users,
  Target,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Bell,
  Star,
  Layers,
  Cpu,
  Database,
  Network
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { getSystemStatus, WidgetReadiness } from '../../../shared/lib/contractStatus';
import { getCurrentNetwork } from '../../../shared/config/contracts';
import { cn } from '../../../shared/lib/cn';
import { toast } from 'react-hot-toast';

export const ComingSoonGovernance: React.FC = () => {
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const systemStatus = getSystemStatus();
  const governanceReadiness = WidgetReadiness.GovernanceWidget();
  const currentNetwork = getCurrentNetwork();

  // Анимация ротации фич каждые 4 секунды
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex(prev => (prev + 1) % upcomingFeatures.length);
      setAnimationTrigger(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Данные о фичах
  const upcomingFeatures = [
    {
      icon: Vote,
      title: 'Proposal System',
      description: 'Создавайте и голосуйте за предложения развития протокола',
      color: 'from-purple-500 to-violet-600',
      glowColor: 'purple-500/20'
    },
    {
      icon: Shield,
      title: 'Timelock Security',
      description: 'Задержка исполнения для безопасности критических изменений',
      color: 'from-emerald-500 to-teal-600',
      glowColor: 'emerald-500/20'
    },
    {
      icon: Users,
      title: 'Community Voting',
      description: 'Делегирование голосов и участие в коллективных решениях',
      color: 'from-blue-500 to-cyan-600',
      glowColor: 'blue-500/20'
    },
    {
      icon: Target,
      title: 'Quorum & Thresholds',
      description: 'Настраиваемые параметры кворума и порогов принятия',
      color: 'from-orange-500 to-red-600',
      glowColor: 'orange-500/20'
    }
  ];

  // Roadmap deployment
  const deploymentSteps = useMemo(() => [
    {
      name: 'Basic Tokens',
      description: 'VC & VG tokens deployed',
      status: systemStatus.contracts.VC_TOKEN?.isDeployed && systemStatus.contracts.VG_TOKEN?.isDeployed ? 'completed' : 'pending',
      icon: Cpu,
      contracts: ['VC_TOKEN', 'VG_TOKEN']
    },
    {
      name: 'VG Votes Extension',
      description: 'ERC20Votes for governance power',
      status: systemStatus.contracts.VG_TOKEN_VOTES?.isDeployed ? 'completed' : 'pending',
      icon: Database,
      contracts: ['VG_TOKEN_VOTES']
    },
    {
      name: 'Liquidity Infrastructure',
      description: 'LP tokens and staking contracts',
      status: systemStatus.contracts.LP_TOKEN?.isDeployed && systemStatus.contracts.LP_LOCKER?.isDeployed ? 'completed' : 'pending',
      icon: Network,
      contracts: ['LP_TOKEN', 'LP_LOCKER']
    },
    {
      name: 'Governance Core',
      description: 'Governor and Timelock contracts',
      status: systemStatus.contracts.GOVERNOR?.isDeployed && systemStatus.contracts.TIMELOCK?.isDeployed ? 'completed' : 'in-progress',
      icon: Shield,
      contracts: ['GOVERNOR', 'TIMELOCK']
    },
    {
      name: 'DAO Integration',
      description: 'Full governance ecosystem',
      status: systemStatus.contracts.STAKING_DAO?.isDeployed ? 'completed' : 'planned',
      icon: Sparkles,
      contracts: ['STAKING_DAO']
    }
  ], [systemStatus]);

  const completedSteps = deploymentSteps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / deploymentSteps.length) * 100;

  const handleEmailSubscribe = () => {
    if (!subscribedEmail.includes('@')) {
      toast.error('Введите корректный email адрес');
      return;
    }
    
    setIsSubscribed(true);
    toast.success('Подписка оформлена! Мы уведомим о запуске Governance.');
    setSubscribedEmail('');
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'in-progress': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'planned': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      default: return Target;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-full blur-3xl scale-150 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 rounded-full border border-purple-500/30 backdrop-blur-xl">
              <Vote className="w-16 h-16 text-purple-400 animate-float" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Rocket className="w-6 h-6 text-yellow-400 animate-bounce" />
              <span className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-medium backdrop-blur-xl">
                Coming Soon in {currentNetwork === 'mainnet' ? 'Mainnet' : 'Development'}
              </span>
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>

            <h1 className="hero-title text-6xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                DAO Governance
              </span>
            </h1>
            
            <p className="hero-subtitle text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Революционная система управления протоколом с прозрачным голосованием и 
              <span className="text-purple-400 font-semibold"> безопасными timelock механизмами</span>
            </p>
          </div>

          {/* Feature Animation */}
          <div className="relative">
            <Card className="max-w-md mx-auto p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-xl">
              <div key={animationTrigger} className="animate-fade-in">
                {(() => {
                  const feature = upcomingFeatures[currentFeatureIndex];
                  const Icon = feature.icon;
                  return (
                    <div className="text-center space-y-4">
                      <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-300 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Feature indicators */}
              <div className="flex justify-center space-x-2 mt-6">
                {upcomingFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeatureIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === currentFeatureIndex 
                        ? "bg-purple-400 w-8" 
                        : "bg-gray-600 hover:bg-gray-500"
                    )}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Deployment Progress */}
        <Card className="p-8 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <GitBranch className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Deployment Roadmap</h2>
                <Code2 className="w-6 h-6 text-blue-400" />
              </div>
              
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deployment Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {deploymentSteps.map((step, index) => {
                const Icon = step.icon;
                const StatusIcon = getStepIcon(step.status);
                
                return (
                  <div 
                    key={step.name}
                    className={cn(
                      "relative p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-105",
                      getStepStatusColor(step.status)
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Icon className="w-6 h-6" />
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-sm mb-1">{step.name}</h3>
                        <p className="text-xs opacity-80">{step.description}</p>
                      </div>

                      {/* Progress indicator */}
                      {index < deploymentSteps.length - 1 && (
                        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 hidden lg:block">
                          <ArrowRight className={cn(
                            "w-4 h-4",
                            step.status === 'completed' ? 'text-green-400' : 'text-gray-600'
                          )} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Network Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ready Features</h3>
                  <p className="text-emerald-400 text-sm">{systemStatus.readyFeatures.length} active</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {systemStatus.readyFeatures.slice(0, 4).map((feature, index) => (
                  <div key={feature} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
                {systemStatus.readyFeatures.length > 4 && (
                  <p className="text-xs text-gray-400">+{systemStatus.readyFeatures.length - 4} more...</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">In Development</h3>
                  <p className="text-orange-400 text-sm">{systemStatus.pendingFeatures.length} pending</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {systemStatus.pendingFeatures.slice(0, 4).map((feature, index) => (
                  <div key={feature} className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
                {systemStatus.pendingFeatures.length > 4 && (
                  <p className="text-xs text-gray-400">+{systemStatus.pendingFeatures.length - 4} more...</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Notification Signup */}
        <Card className="p-8 text-center bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <div className="max-w-md mx-auto space-y-6">
            <div className="space-y-3">
              <div className="inline-flex p-3 bg-purple-500/20 rounded-2xl">
                <Bell className="w-8 h-8 text-purple-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-white">Получайте обновления</h3>
              <p className="text-gray-300">
                Будьте первыми кто узнает о запуске Governance системы
              </p>
            </div>

            {!isSubscribed ? (
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <input
                    type="email"
                    value={subscribedEmail}
                    onChange={(e) => setSubscribedEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all"
                  />
                  <Button
                    onClick={handleEmailSubscribe}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Подписаться
                  </Button>
                </div>
                
                <p className="text-xs text-gray-400">
                  Никакого спама. Только важные обновления о запуске.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Подписка активна!</span>
                </div>
                <p className="text-sm text-gray-300">
                  Мы уведомим вас как только Governance будет запущен
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">
              Хотите помочь в развитии?
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Присоединяйтесь к нашему сообществу разработчиков и участвуйте в создании будущего DeFi governance
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2">
              <GitBranch className="w-5 h-5" />
              <span>View on GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              className="px-8 py-3 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all duration-300 flex items-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Join Community</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ComingSoonGovernance; 