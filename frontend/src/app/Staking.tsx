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
      <div className="w-full py-8">
        <div className="liquid-glass text-center py-12 animate-glass-float">
          <ArrowRightLeft className="mx-auto mb-4 text-blue-400 animate-glass-pulse" size={64} />
          <h1 className="text-3xl font-bold mb-4 text-slate-100">Token Swap & LP Burn</h1>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Buy VC tokens at a fixed price or burn LP positions to earn VG rewards. Participate in protocol governance through DAO voting.
          </p>
          <p className="text-gray-400">Connect wallet to access functions</p>
        </div>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="w-full py-8">
        <div className="liquid-glass text-center py-12 animate-glass-float">
          <AlertTriangle className="mx-auto mb-4 text-red-400 animate-glass-pulse" size={64} />
          <h1 className="text-3xl font-bold mb-4 text-slate-100">Wrong Network</h1>
          <p className="text-gray-400 mb-6">
            Switch to BSC Testnet to access token functions
          </p>
          <Button variant="orange" className="animate-glass-glow">
            Switch Network
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-slate-100 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Token Swap & LP Burn
        </h1>
        <p className="text-gray-400 max-w-3xl mx-auto">
                      Buy VC tokens at a fixed price or burn LP positions to earn VG rewards. Choose a convenient mode for working with tokens.
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
          How modes work
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buy VC Mode */}
          <div className="glass-ultra border border-blue-400/20 p-6 rounded-lg animate-glass-glow">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-3 text-blue-300">Buy VC Mode (Active)</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Buy VC tokens for BNB at a fixed price</p>
              <p>• Instant delivery to your wallet</p>
              <p>• No PancakeSwap fees</p>
              <p>• Safe purchase through smart contract</p>
            </div>
          </div>

          {/* Earn VG Mode (Disabled) */}
          <div className="glass-ultra border border-red-400/20 bg-red-500/5 p-6 rounded-lg opacity-50">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-3 text-red-300">Earn VG Mode (Disabled)</h3>
            <div className="space-y-2 text-sm text-gray-500">
                              <p>• Creation and burning of LP positions</p>
                              <p>• Receive 10 VG for each LP token</p>
                              <p>• Irreversible LP burning</p>
                              <p>• Function temporarily unavailable</p>
            </div>
          </div>
        </div>
      </div>

      {/* LP Burn Instructions (for when feature is enabled) */}
      <div className="liquid-glass animate-glass-float mb-8 opacity-50">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
          <Zap className="mr-3 text-yellow-400 animate-glass-pulse" size={24} />
                        How to burn LP and get VG (temporarily disabled)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-ultra p-6 rounded-lg text-center">
            <div className="text-3xl mb-4">1️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-300">Create LP tokens</h3>
            <p className="text-gray-500 text-sm">
                              Add VC + BNB liquidity to PancakeSwap pool and get LP tokens
            </p>
          </div>

          <div className="glass-ultra p-6 rounded-lg text-center">
            <div className="text-3xl mb-4">2️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-300">Burn Forever</h3>
            <p className="text-gray-500 text-sm">
              Burn LP tokens in smart contract without possibility of recovery
            </p>
          </div>

          <div className="glass-ultra p-6 rounded-lg text-center">
            <div className="text-3xl mb-4">3️⃣</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-300">Get VG rewards</h3>
            <p className="text-gray-500 text-sm">
                              Instantly receive 10 VG tokens for each burned LP
            </p>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="glass-ultra border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-lg animate-glass-glow">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0 animate-glass-pulse" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-2">Important Notes</h3>
            <div className="text-gray-300 text-sm space-y-1">
              <p><strong>Buy VC:</strong> Buy VC tokens only at the official fixed price through the contract.</p>
              <p><strong>Earn VG (disabled):</strong> LP tokens are burned forever without possibility of recovery. This is an irreversible operation.</p>
              <p>Make sure you understand the risks before using any functions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Staking 