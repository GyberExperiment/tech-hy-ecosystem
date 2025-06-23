import React from 'react'
import { Button } from '../shared/ui/Button'
import { useAccount, useChainId } from 'wagmi'
import EarnVGWidget from '../widgets/StakingDashboard/ui/EarnVGWidget'
import LPPoolManager from '../widgets/StakingDashboard/ui/LPPoolManager'
import StakingStats from '../entities/Staking/ui/StakingStats'
import { Zap, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react'

const Staking: React.FC = () => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const isCorrectNetwork = chainId === 97 // BSC Testnet

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="liquid-glass text-center py-12 animate-glass-float">
          <Zap className="mx-auto mb-4 text-yellow-400 animate-glass-pulse" size={64} />
          <h1 className="text-3xl font-bold mb-4 text-slate-100">Стейкинг и LP Locking</h1>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Заблокируйте LP токены навсегда и получайте VG награды. Участвуйте в управлении протоколом через DAO голосования.
          </p>
          <p className="text-gray-400">Подключите кошелёк для доступа к стейкингу</p>
        </div>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="liquid-glass text-center py-12 animate-glass-float">
          <AlertTriangle className="mx-auto mb-4 text-red-400 animate-glass-pulse" size={64} />
          <h1 className="text-3xl font-bold mb-4 text-slate-100">Неправильная сеть</h1>
          <p className="text-gray-400 mb-6">
            Переключитесь на BSC Testnet для использования стейкинга
          </p>
          <Button variant="orange" className="animate-glass-pulse">
            Переключить сеть
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-slate-100 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Стейкинг и LP Locking
        </h1>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Постоянная блокировка LP токенов с мгновенными VG наградами. Получайте 10 VG за каждый заблокированный LP токен.
        </p>
      </div>

      {/* Stats Overview */}
      <StakingStats />

      {/* Main Staking Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Burn & Earn Widget */}
        <div className="liquid-glass animate-glass-float">
          <div className="flex items-center mb-6">
            <Zap className="mr-3 text-yellow-400 animate-glass-pulse" size={24} />
            <h2 className="text-2xl font-bold text-slate-100">Burn & Earn VG</h2>
          </div>
          <EarnVGWidget />
        </div>

        {/* LP Pool Manager */}
        <div className="liquid-glass animate-glass-float">
          <div className="flex items-center mb-6">
            <TrendingUp className="mr-3 text-blue-400 animate-glass-pulse" size={24} />
            <h2 className="text-2xl font-bold text-slate-100">LP Pool Manager</h2>
          </div>
          <LPPoolManager />
        </div>
      </div>

      {/* How It Works */}
      <div className="liquid-glass animate-glass-float">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
          <BarChart3 className="mr-3 text-green-400" size={24} />
          Как это работает
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-ultra p-6 rounded-lg text-center animate-glass-pulse">
            <div className="text-3xl mb-4">1️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-100">Создайте LP токены</h3>
            <p className="text-gray-400 text-sm">
              Добавьте ликвидность VC + BNB в PancakeSwap пул и получите LP токены
            </p>
          </div>

          <div className="glass-ultra p-6 rounded-lg text-center animate-glass-pulse">
            <div className="text-3xl mb-4">2️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-100">Заблокируйте навсегда</h3>
            <p className="text-gray-400 text-sm">
              Заблокируйте LP токены в смарт-контракте без возможности вывода
            </p>
          </div>

          <div className="glass-ultra p-6 rounded-lg text-center animate-glass-pulse">
            <div className="text-3xl mb-4">3️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-100">Получите VG награды</h3>
            <p className="text-gray-400 text-sm">
              Мгновенно получите 10 VG токенов за каждый заблокированный LP
            </p>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="glass-ultra border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-lg animate-glass-pulse">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-2">Важное предупреждение</h3>
            <p className="text-gray-300 text-sm">
              LP токены блокируются <strong>навсегда</strong> без возможности вывода. Это необратимая операция. 
              Убедитесь, что понимаете риски перед использованием функции Burn & Earn.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Staking 