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
    loading,
    balances // Добавляем balances для диагностики
  } = useTokenData();

  // Диагностика для TokenStats
  React.useEffect(() => {
    console.log('📊 TokenStats Debug:', {
      tokens: tokens.length,
      tokensWithBalance: tokensWithBalance.length,
      totalTokens,
      loading,
      balances,
      tokensData: tokens.map(t => ({ symbol: t.symbol, balance: t.balance }))
    });
  }, [tokens, tokensWithBalance, totalTokens, loading, balances]);

  // Fallback для статистики если tokens пустой но balances есть данные
  const effectiveTokensWithBalance = React.useMemo(() => {
    if (tokensWithBalance.length > 0) return tokensWithBalance;
    
    // Если tokens пустой, создаем виртуальные токены из balances для подсчета
    const virtualTokens = [];
    if (balances && parseFloat(balances.VC || '0') > 0) {
      virtualTokens.push({ symbol: 'VC', balance: balances.VC });
    }
    if (balances && parseFloat(balances.VG || '0') > 0) {
      virtualTokens.push({ symbol: 'VG', balance: balances.VG });
    }
    if (balances && parseFloat(balances.VGVotes || '0') > 0) {
      virtualTokens.push({ symbol: 'VGVotes', balance: balances.VGVotes });
    }
    if (balances && parseFloat(balances.LP || '0') > 0) {
      virtualTokens.push({ symbol: 'LP', balance: balances.LP });
    }
    if (balances && parseFloat(balances.BNB || '0') > 0) {
      virtualTokens.push({ symbol: 'BNB', balance: balances.BNB });
    }
    return virtualTokens;
  }, [tokensWithBalance, balances]);

  const effectiveTotalTokens = React.useMemo(() => {
    return Math.max(totalTokens, effectiveTokensWithBalance.length);
  }, [totalTokens, effectiveTokensWithBalance]);

  // Calculate total allowances from available token data
  const totalAllowances = React.useMemo(() => {
    return effectiveTokensWithBalance.reduce((total, token) => {
      // Count tokens with positive allowances to contracts
      return total + (token.allowance && parseFloat(token.allowance) > 0 ? 1 : 0);
    }, 0);
  }, [effectiveTokensWithBalance]);

  // Calculate total USD value of all tokens (using realistic estimates)
  const totalValue = React.useMemo(() => {
    return effectiveTokensWithBalance.reduce((total, token) => {
      const balance = parseFloat(token.balance);
      if (balance <= 0) return total;
      
      // Realistic token value estimates for BSC ecosystem tokens
      let estimatedPrice = 0;
      switch (token.symbol) {
        case 'VC':
          estimatedPrice = 0.001; // $0.001 per VC (ecosystem utility token)
          break;
        case 'VG':
          estimatedPrice = 0.01; // $0.01 per VG (governance token, more valuable)
          break;
        case 'VGVotes':
          estimatedPrice = 0.01; // Same as VG since it's voting power
          break;
        case 'LP':
          estimatedPrice = 0.1; // $0.1 per LP token (liquidity provision)
          break;
        case 'BNB':
          estimatedPrice = 315; // Current BNB price estimate
          break;
        default:
          estimatedPrice = 0.001; // Default small value for unknown tokens
      }
      
      const tokenValue = balance * estimatedPrice;
      return total + tokenValue;
    }, 0);
  }, [effectiveTokensWithBalance]);

  // Calculate active permissions/allowances count
  const activePermissions = React.useMemo(() => {
    return totalAllowances;
  }, [totalAllowances]);

  const stats = [
    {
              title: 'Total Tokens',
        value: effectiveTotalTokens,
        unit: 'pcs',
      icon: Coins,
      color: 'text-blue-400',
    },
    {
              title: 'With Balance',
        value: effectiveTokensWithBalance.length,
        unit: 'pcs',
      icon: Activity,
      color: 'text-green-400',
    },
    {
      title: 'USD Value',
      value: totalValue.toFixed(2),
      unit: '$',
      icon: TrendingUp,
      color: 'text-yellow-400',
    },
    {
              title: 'Permissions',
        value: activePermissions,
        unit: 'pcs',
      icon: Shield,
      color: 'text-purple-400',
    },
  ];

  if (loading && tokens.length === 0) {
    return (
      <div className={className}>
        <style>{lineClampStyles}</style>
        <div className="card animate-hyper-subtle-stats-container">
          <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
            <BarChart3 className="mr-3 text-blue-400" />
            Token Statistics
          </h2>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`relative group aspect-square animate-hyper-subtle-stat-${i}`}>
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
      <div className="card animate-hyper-subtle-stats-container">
        <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
          <BarChart3 className="mr-3 text-blue-400" />
          Token Statistics
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
                className={`relative group aspect-square animate-hyper-subtle-stat-${(index % 4) + 1}`}
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
                      {index === 0 && 'Available in ecosystem'}
                                              {index === 1 && 'Active balances'}
                                              {index === 2 && 'Total value'}
                                              {index === 3 && 'Active approvals'}
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