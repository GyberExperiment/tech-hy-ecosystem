import React from 'react';
import { BarChart3, Coins, Activity, TrendingUp, Shield } from 'lucide-react';
import { useTokenData } from '../hooks/useTokenData';

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

  if (loading && tokens.length === 0) {
    return (
      <div className={className}>
        {showTitle && (
          <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
            <BarChart3 className="mr-3 text-blue-400" />
            Статистика токенов
          </h2>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-600 rounded w-12"></div>
                </div>
                <div className="w-8 h-8 bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <BarChart3 className="mr-3 text-blue-400" />
          Статистика токенов
        </h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Всего токенов</p>
              <p className="text-2xl font-bold text-slate-100">{totalTokens}</p>
            </div>
            <Coins className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">С балансом</p>
              <p className="text-2xl font-bold text-slate-100">
                {tokensWithBalance.length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">USD стоимость</p>
              <p className="text-2xl font-bold text-slate-100">$0.00</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Активных разрешений</p>
              <p className="text-2xl font-bold text-slate-100">{totalAllowances}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenStats; 