import React from 'react';
import { BarChart3, Coins, Activity, TrendingUp, Shield } from 'lucide-react';
import { useTokenData } from '../model/useTokenData';

interface TokenStatsProps {
  showTitle?: boolean;
  className?: string;
}

// CSS стили для обрезки текста
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

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

  const stats = [
    {
      title: 'Всего токенов',
      value: totalTokens,
      unit: 'шт',
      icon: Coins,
      color: 'text-blue-400',
    },
    {
      title: 'С балансом',
      value: tokensWithBalanceCount,
      unit: 'шт',
      icon: Activity,
      color: 'text-green-400',
    },
    {
      title: 'USD стоимость',
      value: totalValue.toFixed(2),
      unit: '$',
      icon: TrendingUp,
      color: 'text-yellow-400',
    },
    {
      title: 'Разрешений',
      value: activePermissions,
      unit: 'шт',
      icon: Shield,
      color: 'text-purple-400',
    },
  ];

  if (loading && tokens.length === 0) {
    return (
      <div className={className}>
        <style>{lineClampStyles}</style>
        <div className="card animate-gentle-float">
          <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
            <BarChart3 className="mr-3 text-blue-400" />
            Статистика токенов
          </h2>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative group aspect-square animate-gentle-float">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/20 via-gray-500/10 to-slate-500/20 rounded-2xl blur-lg"></div>
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-slate-500/10 via-gray-500/5 to-slate-500/8 border border-slate-400/20 rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <style>{lineClampStyles}</style>
      <div className="card animate-gentle-float">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
          <BarChart3 className="mr-3 text-blue-400" />
          Статистика токенов
        </h2>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            // Определяем цветовую схему для каждой карточки
            const colorSchemes = {
              0: { // Всего токенов
                gradient: 'from-blue-500/20 via-cyan-500/10 to-blue-500/20',
                bg: 'from-blue-500/10 via-cyan-500/5 to-blue-500/8',
                border: 'border-blue-400/20 hover:border-blue-400/40',
                iconBg: 'from-blue-500/20 to-cyan-600/20',
                iconColor: 'text-blue-400',
                badge: 'text-blue-300/80 bg-blue-500/10'
              },
              1: { // С балансом
                gradient: 'from-green-500/20 via-emerald-500/10 to-green-500/20',
                bg: 'from-green-500/10 via-emerald-500/5 to-green-500/8',
                border: 'border-green-400/20 hover:border-green-400/40',
                iconBg: 'from-green-500/20 to-emerald-600/20',
                iconColor: 'text-green-400',
                badge: 'text-green-300/80 bg-green-500/10'
              },
              2: { // USD стоимость
                gradient: 'from-yellow-500/20 via-orange-500/10 to-yellow-500/20',
                bg: 'from-yellow-500/10 via-orange-500/5 to-yellow-500/8',
                border: 'border-yellow-400/20 hover:border-yellow-400/40',
                iconBg: 'from-yellow-500/20 to-orange-600/20',
                iconColor: 'text-yellow-400',
                badge: 'text-yellow-300/80 bg-yellow-500/10'
              },
              3: { // Разрешений
                gradient: 'from-purple-500/20 via-pink-500/10 to-purple-500/20',
                bg: 'from-purple-500/10 via-pink-500/5 to-purple-500/8',
                border: 'border-purple-400/20 hover:border-purple-400/40',
                iconBg: 'from-purple-500/20 to-pink-600/20',
                iconColor: 'text-purple-400',
                badge: 'text-purple-300/80 bg-purple-500/10'
              }
            };

            const scheme = colorSchemes[index as keyof typeof colorSchemes];

            return (
              <div 
                key={index} 
                className="relative group aspect-square animate-gentle-float"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${scheme.gradient} rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300`}></div>
                <div className={`relative h-full backdrop-blur-xl bg-gradient-to-br ${scheme.bg} border ${scheme.border} rounded-2xl p-4 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1 flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${scheme.iconBg} shadow-lg`}>
                      <stat.icon className={`w-4 h-4 ${scheme.iconColor}`} />
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${scheme.badge}`}>
                      {stat.unit}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-gray-200/80 leading-tight line-clamp-2">
                      {stat.title}
                    </h3>
                    <div className={`text-xs ${scheme.iconColor}/70 leading-tight line-clamp-1`}>
                      {index === 0 && 'Доступно в экосистеме'}
                      {index === 1 && 'Активные балансы'}
                      {index === 2 && 'Общая стоимость'}
                      {index === 3 && 'Активные approve'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TokenStats; 