import React from 'react';
import { BuyVCWidget } from '../../../entities/Token';
import { CreditCard, Info, Zap, ExternalLink } from 'lucide-react';

export const TokenManagementWidget: React.FC = () => {
  return (
    <div className="space-y-8 px-responsive">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <CreditCard className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Управление токенами
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Покупайте VC токены напрямую через PancakeSwap
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BuyVCWidget */}
        <div className="flex justify-center">
          <BuyVCWidget />
        </div>

        {/* Information Panel */}
        <div className="space-y-6">
          {/* About VC Token */}
          <div className="liquid-glass space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-slate-100">О VC токене</h3>
            </div>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p>Venture Card (VC) - основной utility токен экосистемы</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                <p>Используется для LP стейкинга и получения VG наград</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                <p>Торгуется на PancakeSwap V2 BSC Testnet</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></div>
                <p>Участвует в governance экосистемы</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700/30">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Контракт VC:</span>
                <a 
                  href="https://testnet.bscscan.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors duration-300"
                >
                  BSCScan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* How to Buy Guide */}
          <div className="liquid-glass space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-green-400" />
              <h3 className="text-xl font-semibold text-slate-100">Как купить VC</h3>
            </div>
            
            <div className="space-y-4">
              {[
                'Подключите кошелек с BSC Testnet',
                'Убедитесь что у вас есть тестовые BNB',
                'Введите количество BNB для обмена',
                'Настройте slippage при необходимости',
                'Нажмите "Купить VC" и подтвердите транзакцию'
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-green-400">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Network Info */}
          <div className="liquid-glass space-y-4">
            <h4 className="text-lg font-semibold text-slate-100">Информация о сети</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Сеть:</span>
                  <span className="text-slate-200">BSC Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chain ID:</span>
                  <span className="text-slate-200">97</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">DEX:</span>
                  <span className="text-slate-200">PancakeSwap</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Комиссия:</span>
                  <span className="text-slate-200">0.25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a 
          href="/staking" 
          className="liquid-glass text-center group hover:scale-[1.02] transition-all duration-300"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-400/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">LP Staking</h3>
              <p className="text-sm text-gray-400 mb-4">Заблокируйте LP токены и получите VG награды</p>
              <span className="btn-glass-green text-sm px-4 py-2 rounded-lg inline-block">
                Перейти к стейкингу
              </span>
            </div>
          </div>
        </a>
        
        <a 
          href="/governance" 
          className="liquid-glass text-center group hover:scale-[1.02] transition-all duration-300"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-purple-400/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Governance</h3>
              <p className="text-sm text-gray-400 mb-4">Участвуйте в голосовании и управлении протоколом</p>
              <span className="btn-glass-purple text-sm px-4 py-2 rounded-lg inline-block">
                Перейти к governance
              </span>
            </div>
          </div>
        </a>
        
        <a 
          href="/" 
          className="liquid-glass text-center group hover:scale-[1.02] transition-all duration-300"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-400/20 flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-400 mb-4">Статистика и аналитика экосистемы</p>
              <span className="btn-glass-blue text-sm px-4 py-2 rounded-lg inline-block">
                Перейти к dashboard
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}; 