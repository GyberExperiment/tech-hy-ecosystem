import React from 'react';
import { BarChart3, Coins, Activity, TrendingUp, Shield } from 'lucide-react';
import { useTokenData } from '../model/useTokenData';

interface TokenStatsProps {
  showTitle?: boolean;
  className?: string;
}

const TokenStats: React.FC<TokenStatsProps> = ({ 
  showTitle = true, 
  className = "" 
}) => {
  const { 
    tokens, 
    tokensWithBalance, 
    totalTokens, 
    loading 
  } = useTokenData();

  // Calculate total allowances from available token data
  const totalAllowances = React.useMemo(() => {
    return tokensWithBalance.reduce((total, token) => {
      // Count tokens with positive allowances to contracts
      return total + (token.allowance && parseFloat(token.allowance) > 0 ? 1 : 0);
    }, 0);
  }, [tokensWithBalance]);

  // Calculate total USD value of all tokens (placeholder - real prices would come from API)
  const totalValue = React.useMemo(() => {
    // For now, return 0 as we don't have real USD prices
    // In production, this would calculate based on token prices from DEX or price feeds
    return tokensWithBalance.reduce((total, token) => {
      // Placeholder calculation - would use real token prices
      const tokenValue = parseFloat(token.balance) * 0; // * realTokenPrice
      return total + tokenValue;
    }, 0);
  }, [tokensWithBalance]);

  // Calculate active permissions/allowances count
  const activePermissions = React.useMemo(() => {
    return totalAllowances;
  }, [totalAllowances]);

  // Calculate count of tokens with balance
  const tokensWithBalanceCount = React.useMemo(() => {
    return tokensWithBalance.length;
  }, [tokensWithBalance]);

  if (loading && tokens.length === 0) {
    return (
      <div className={className}>
        <div className="liquid-glass mb-8">
          <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
            <BarChart3 className="mr-3 text-blue-400 animate-glass-pulse" />
            Статистика токенов
          </h2>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="liquid-glass animate-pulse">
                <div className="text-center">
                  <div className="h-4 bg-gray-600 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-600 rounded w-12 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-600 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="liquid-glass mb-8">
          <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
            <BarChart3 className="mr-3 text-blue-400 animate-glass-pulse" />
            Быстрые действия
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-ultra animate-glass-float">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Coins className="w-8 h-8 text-blue-400 animate-glass-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Всего токенов</p>
                  <p className="text-2xl font-bold text-white">4</p>
                </div>
              </div>
            </div>
            
            <div className="card-ultra animate-glass-float">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Activity className="w-8 h-8 text-green-400 animate-glass-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Активных</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
              </div>
            </div>
            
            <div className="card-ultra animate-glass-float">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <TrendingUp className="w-8 h-8 text-yellow-400 animate-glass-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">USD стоимость</p>
                  <p className="text-2xl font-bold text-white">$0.00</p>
                </div>
              </div>
            </div>
            
            <div className="card-ultra animate-glass-float">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Shield className="w-8 h-8 text-purple-400 animate-glass-pulse" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Разрешений</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="liquid-glass mb-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
          <BarChart3 className="mr-3 text-blue-400 animate-glass-pulse" />
          Статистика токенов
        </h2>
      
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-ultra animate-glass-float">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Coins className="w-8 h-8 text-blue-400 animate-glass-pulse" />
              </div>
            <div>
              <p className="text-sm text-gray-400">Всего токенов</p>
                <p className="text-2xl font-bold text-white">{totalTokens}</p>
            </div>
          </div>
        </div>
        
        <div className="card-ultra animate-glass-float">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Activity className="w-8 h-8 text-green-400 animate-glass-pulse" />
              </div>
            <div>
              <p className="text-sm text-gray-400">С балансом</p>
                <p className="text-2xl font-bold text-white">{tokensWithBalanceCount}</p>
            </div>
          </div>
        </div>
        
        <div className="card-ultra animate-glass-float">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <TrendingUp className="w-8 h-8 text-yellow-400 animate-glass-pulse" />
              </div>
            <div>
              <p className="text-sm text-gray-400">USD стоимость</p>
                <p className="text-2xl font-bold text-white">${totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="card-ultra animate-glass-float">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Shield className="w-8 h-8 text-purple-400 animate-glass-pulse" />
              </div>
            <div>
                <p className="text-sm text-gray-400">Разрешений</p>
                <p className="text-2xl font-bold text-white">{activePermissions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenStats; 