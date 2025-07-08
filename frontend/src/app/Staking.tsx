import React from 'react'
import { Button } from '../shared/ui/Button'
import { useAccount, useChainId } from 'wagmi'
import { SwapWidget } from '../widgets/SwapWidget'
import LPPoolManager from '../widgets/StakingDashboard/ui/LPPoolManager'
import StakingStats from '../entities/Staking/ui/StakingStats'
import { Zap, TrendingUp, BarChart3, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { BSC_TESTNET } from '../shared/config/contracts'

const Staking: React.FC = () => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const isCorrectNetwork = chainId === BSC_TESTNET.chainId

  if (!isConnected) {
    return (
      <div className="w-full px-4 py-8">
        <div className="liquid-glass text-center py-12 animate-glass-float">
          <ArrowRightLeft className="mx-auto mb-4 text-blue-400 animate-glass-pulse" size={64} />
          <h1 className="text-3xl font-bold mb-4 text-slate-100">Token Swap & LP Burn</h1>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Покупайте VC токены по фиксированной цене или сжигайте LP позиции для получения VG наград. Участвуйте в управлении протоколом через DAO голосования.
          </p>
          <p className="text-gray-400">Подключите кошелёк для доступа к функциям</p>
        </div>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="w-full px-4 py-8">
        <div className="liquid-glass text-center py-12 animate-glass-float">
          <AlertTriangle className="mx-auto mb-4 text-red-400 animate-glass-pulse" size={64} />
          <h1 className="text-3xl font-bold mb-4 text-slate-100">Неправильная сеть</h1>
          <p className="text-gray-400 mb-6">
            Переключитесь на BSC Testnet для доступа к функциям токенов
          </p>
          <Button variant="orange" className="animate-glass-glow">
            Переключить сеть
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-slate-100 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Token Swap & LP Burn
        </h1>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Покупайте VC токены по фиксированной цене или сжигайте LP позиции для получения VG наград. Выбирайте удобный режим для работы с токенами.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
      <StakingStats />
      </div>

      {/* Main Swap Section - ВЕРТИКАЛЬНЫЕ ВИДЖЕТЫ */}
      <div className="space-y-8 mb-8">
        {/* Token Swap Widget */}
        <div className="liquid-glass animate-glass-float">
          <div className="flex items-center mb-6">
            <ArrowRightLeft className="mr-3 text-blue-400 animate-glass-pulse" size={24} />
            <h2 className="text-2xl font-bold text-slate-100">Token Swap</h2>
          </div>
          <SwapWidget />
        </div>

        {/* LP Manager */}
        <div className="liquid-glass animate-glass-float">
          <div className="flex items-center mb-6">
            <TrendingUp className="mr-3 text-blue-400 animate-glass-pulse" size={24} />
            <h2 className="text-2xl font-bold text-slate-100">LP Manager</h2>
          </div>
          <LPPoolManager />
        </div>
      </div>

      {/* How It Works */}
      <div className="liquid-glass animate-glass-float mb-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
          <BarChart3 className="mr-3 text-green-400 animate-glass-pulse" size={24} />
          Как работают режимы
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buy VC Mode */}
          <div className="glass-ultra border border-blue-400/20 p-6 rounded-lg animate-glass-glow">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-3 text-blue-300">Buy VC Mode (Активен)</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Покупайте VC токены за BNB по фиксированной цене</p>
              <p>• Мгновенная доставка в ваш кошелёк</p>
              <p>• Никаких комиссий PancakeSwap</p>
              <p>• Безопасная покупка через смарт-контракт</p>
            </div>
          </div>

          {/* Earn VG Mode (Disabled) */}
          <div className="glass-ultra border border-red-400/20 bg-red-500/5 p-6 rounded-lg opacity-50">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-3 text-red-300">Earn VG Mode (Отключен)</h3>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Создание и сжигание LP позиций</p>
              <p>• Получение 10 VG за каждый LP токен</p>
              <p>• Необратимое сжигание LP</p>
              <p>• Функция временно недоступна</p>
            </div>
          </div>
        </div>
      </div>

      {/* LP Burn Instructions (for when feature is enabled) */}
      <div className="liquid-glass animate-glass-float mb-8 opacity-50">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
          <Zap className="mr-3 text-yellow-400 animate-glass-pulse" size={24} />
          Как сжечь LP и получить VG (временно отключено)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-ultra p-6 rounded-lg text-center">
            <div className="text-3xl mb-4">1️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-300">Создайте LP токены</h3>
            <p className="text-gray-500 text-sm">
              Добавьте ликвидность VC + BNB в PancakeSwap пул и получите LP токены
            </p>
          </div>

          <div className="glass-ultra p-6 rounded-lg text-center">
            <div className="text-3xl mb-4">2️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-300">Сожгите навсегда</h3>
            <p className="text-gray-500 text-sm">
              Сожгите LP токены в смарт-контракте без возможности восстановления
            </p>
          </div>

          <div className="glass-ultra p-6 rounded-lg text-center">
            <div className="text-3xl mb-4">3️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-300">Получите VG награды</h3>
            <p className="text-gray-500 text-sm">
              Мгновенно получите 10 VG токенов за каждый сожженный LP
            </p>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="glass-ultra border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-lg animate-glass-glow">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0 animate-glass-pulse" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-2">Важные замечания</h3>
            <div className="text-gray-300 text-sm space-y-1">
              <p><strong>Buy VC:</strong> Покупайте VC токены только по официальной фиксированной цене через контракт.</p>
              <p><strong>Earn VG (отключено):</strong> LP токены сжигаются навсегда без возможности восстановления. Это необратимая операция.</p>
              <p>Убедитесь, что понимаете риски перед использованием любых функций.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Staking 