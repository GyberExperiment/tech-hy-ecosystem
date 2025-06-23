import React from 'react'
import { Button } from '../components/ui/button'

const Staking: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="hero-title text-4xl md:text-5xl font-bold">
          💎 Staking Platform
        </h1>
        <p className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto">
          Заработайте вознаграждения, участвуя в стейкинге токенов
        </p>
      </div>

      {/* Staking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-ultra">
          <h3 className="card-title text-xl font-semibold mb-4">VG Token Staking</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">APR:</span>
              <span className="text-green-400 font-medium">12.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total Staked:</span>
              <span className="text-white">1,250,000 VG</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Lock Period:</span>
              <span className="text-white">30 days</span>
            </div>
            <Button variant="orange" size="lg" className="w-full">
              Stake VG
            </Button>
          </div>
        </div>

        <div className="card-ultra">
          <h3 className="card-title text-xl font-semibold mb-4">LP Token Staking</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">APR:</span>
              <span className="text-green-400 font-medium">18.3%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total Staked:</span>
              <span className="text-white">500,000 LP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Lock Period:</span>
              <span className="text-white">90 days</span>
            </div>
            <Button variant="blue" size="lg" className="w-full">
              Stake LP
            </Button>
          </div>
        </div>

        <div className="card-ultra">
          <h3 className="card-title text-xl font-semibold mb-4">Flexible Staking</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">APR:</span>
              <span className="text-green-400 font-medium">8.7%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total Staked:</span>
              <span className="text-white">750,000 VG</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Lock Period:</span>
              <span className="text-green-400">Flexible</span>
            </div>
            <Button variant="green" size="lg" className="w-full">
              Stake Now
            </Button>
          </div>
        </div>
      </div>

      {/* My Staking */}
      <div className="glass-panel-ultra space-y-6">
        <h2 className="section-title text-2xl font-semibold">My Staking Positions</h2>
        
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="card-title text-lg mb-2">No Active Positions</h3>
          <p className="text-white/70 mb-6">
            Start staking to earn rewards and participate in governance
          </p>
          <Button variant="fire" size="lg">
            Start Staking
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Staking 