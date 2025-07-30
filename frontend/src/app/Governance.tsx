import React, { useState } from 'react';

import { useAccount, useChainId } from 'wagmi';
import { 
  Vote, 
  Activity, 
  BarChart3, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Target, 
  Coins,
  FileText, 
  Plus,
  Eye,
  Calendar,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BSC_TESTNET } from '../shared/config/contracts';
import { PageConnectionPrompt } from '../shared/ui/PageConnectionPrompt';
import { log } from '../shared/lib/logger';
import { cn } from '../shared/lib/cn';
import { useGovernanceData, type GovernanceProposal } from '../entities/Governance/api/useGovernanceData';
import { WidgetReadiness, getSystemStatus } from '../shared/lib/contractStatus';
import ComingSoonGovernance from '../widgets/ComingSoon/ui/ComingSoonGovernance';

const Governance: React.FC = () => {

  const { address } = useAccount();
  const chainId = useChainId();
  
  // ✅ Проверяем готовность Governance системы
  const governanceReadiness = WidgetReadiness.GovernanceWidget();
  const systemStatus = getSystemStatus();
  
  // ✅ Используем реальные данные governance только если система готова
  const {
    proposals,
    stats,
    userData,
    loading,
    refreshing,
    error,
    refreshData,
    isSystemReady
  } = useGovernanceData();
  
  const isConnected = !!address;
  const isCorrectNetwork = chainId === BSC_TESTNET.chainId;
  
  const [selectedProposal, setSelectedProposal] = useState<GovernanceProposal | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [voteSupport, setVoteSupport] = useState<boolean | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ✅ ГЛАВНАЯ ПРОВЕРКА: если Governance контракты не готовы - показываем Coming Soon
  if (!governanceReadiness.isReady) {
    return <ComingSoonGovernance />;
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-400 bg-green-400/20';
      case 'Succeeded': return 'text-blue-400 bg-blue-400/20';
      case 'Defeated': return 'text-red-400 bg-red-400/20';
      case 'Pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'Executed': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Protocol': return 'text-blue-400 bg-blue-400/20';
      case 'Treasury': return 'text-green-400 bg-green-400/20';
      case 'Parameter': return 'text-yellow-400 bg-yellow-400/20';
      case 'Emergency': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleVote = async (proposalId: number, support: boolean) => {
    if (!voteAmount || !address) {
      toast.error('Введите количество голосов или подключите кошелек');
      return;
    }

    try {
      // TODO: Реализовать голосование через rpcService и Governor контракт
      toast.error('Контракты управления еще не развернуты в основной сети');
      
      log.info('Vote attempted', {
        component: 'Governance',
        function: 'handleVote',
        proposalId,
        support,
        voteAmount,
        address
      });
    } catch (error: any) {
      log.error('Governance vote failed', {
        component: 'Governance',
        function: 'handleVote',
        proposalId,
        support,
        address: address,
        errorMessage: error.message
      }, error);
      
      toast.error('Ошибка голосования', { id: 'vote' });
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (filterStatus === 'all') return true;
    return proposal.status.toLowerCase() === filterStatus.toLowerCase();
  });

  // ✅ Реальная статистика пользователя
  const userStats = [
    {
      title: 'Ваши VG токены',
      value: formatBalance(userData.votingPower || '0'),
      unit: 'VG',
      icon: Coins,
      color: 'text-yellow-400',
    },
    {
      title: 'Voting Power',
      value: formatBalance(userData.votingPower || '0'),
      unit: 'VGV',
      icon: Vote,
      color: 'text-purple-400',
    },
    {
      title: 'Всего предложений',
      value: stats.totalProposals.toString(),
      unit: 'proposals',
      icon: FileText,
      color: 'text-blue-400',
    },
    {
      title: 'Активных',
      value: stats.activeProposals.toString(),
      unit: 'активных',
      icon: Activity,
      color: 'text-green-400',
    },
  ];

  // ✅ Реальная статистика протокола
  const protocolStats = [
    {
      title: 'Общая voting power',
      value: formatBalance(stats.totalVotingPower || '0'),
      unit: 'VG',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      title: 'Участие в голосовании',
      value: stats.participationRate || '0',
      unit: '%',
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      title: 'Успешных предложений',
      value: proposals.filter(p => p.status === 'Succeeded').length.toString(),
      unit: 'принято',
      icon: CheckCircle,
      color: 'text-blue-400',
    },
    {
      title: 'Требуемый кворум',
      value: formatBalance(stats.quorumRequired || '0'),
      unit: 'VG',
      icon: Target,
      color: 'text-yellow-400',
    },
  ];

  if (!isConnected) {
    return (
      <PageConnectionPrompt
        title="Governance"
        subtitle="Подключите кошелек для участия в governance экосистемы"
        icon={Vote}
        iconColor="text-purple-400"
        titleGradient="from-purple-400 to-blue-500"
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
      />
    );
  }

  if (!isCorrectNetwork) {
    return (
      <PageConnectionPrompt
        title="Governance"
        subtitle="Подключите кошелек для участия в governance экосистемы"
        icon={Vote}
        iconColor="text-purple-400"
        titleGradient="from-purple-400 to-blue-500"
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-responsive">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <Vote className="w-8 h-8 text-purple-400 animate-glass-pulse" />
          <h1 className="hero-title text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Governance
          </h1>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 backdrop-blur-xl bg-white/8 border border-purple-400/25 rounded-xl hover:bg-purple-500/15 transition-all duration-300 group"
          >
            <RefreshCw className={cn("h-5 w-5 text-purple-300/80 group-hover:text-white transition-colors duration-300", refreshing && "animate-spin")} />
          </button>
        </div>
        <p className="hero-subtitle text-xl text-gray-300 max-w-2xl mx-auto">
          Участвуйте в управлении протоколом через децентрализованное голосование
        </p>
        
        {error && (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-400/25 rounded-xl p-4 text-red-300 text-sm max-w-md mx-auto">
            {error}
          </div>
        )}
      </div>

      {/* Personal Stats */}
      <div>
        <h2 className="section-title text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Activity className="mr-3 text-purple-400 animate-glass-pulse" />
          Ваша статистика
        </h2>
        
        <div className="grid-responsive-1-2-4 gap-6">
          {userStats.map((stat, index) => (
            <div key={index} className="card-ultra animate-enhanced-widget-chaos-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">
                      {loading ? 'Загрузка...' : stat.value}
                    </p>
                    {stat.unit && (
                      <p className="text-sm text-gray-400">{stat.unit}</p>
                    )}
                  </div>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Statistics */}
      <div>
        <h2 className="section-title text-2xl font-bold mb-6 flex items-center text-slate-100">
          <BarChart3 className="mr-3 text-blue-400 animate-glass-pulse" />
          Статистика governance
        </h2>
        
        <div className="grid-responsive-1-2-4 gap-6">
          {protocolStats.map((stat, index) => (
            <div key={index} className="card-ultra animate-enhanced-widget-chaos-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">
                      {loading ? 'Загрузка...' : stat.value}
                    </p>
                    {stat.unit && (
                      <p className="text-sm text-gray-400">{stat.unit}</p>
                    )}
                  </div>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Proposals List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-2xl font-bold flex items-center text-slate-100">
              <FileText className="mr-3 text-blue-400 animate-glass-pulse" />
              Предложения ({filteredProposals.length})
            </h2>
            
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="pending">Ожидающие</option>
                <option value="succeeded">Принятые</option>
                <option value="defeated">Отклоненные</option>
              </select>
              
              <button className="btn-secondary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Создать</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="liquid-glass animate-pulse">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-600 rounded w-full mb-3"></div>
                          <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredProposals.length === 0 && (
              <div className="liquid-glass text-center py-12 animate-enhanced-widget-chaos-3">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-200 mb-2">
                  Предложений пока нет
                </h3>
                <p className="text-gray-400 mb-6">
                  {stats.totalProposals === 0 
                    ? 'Governance контракт не содержит предложений'
                    : 'Предложения с выбранным статусом не найдены'
                  }
                </p>
                <button className="btn-primary flex items-center space-x-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  <span>Создать первое предложение</span>
                </button>
              </div>
            )}

            {!loading && filteredProposals.map((proposal) => (
              <div 
                key={proposal.id} 
                className={`liquid-glass cursor-pointer transition-all duration-300 hover:scale-[1.005] animate-enhanced-widget-chaos-4 ${
                  selectedProposal?.id === proposal.id 
                    ? 'ring-2 ring-purple-500/50 glass-secondary' 
                    : ''
                }`}
                onClick={() => setSelectedProposal(proposal)}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="card-title font-bold text-lg">{proposal.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(proposal.category)}`}>
                          {proposal.category}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{proposal.description}</p>
                      
                      {/* Proposer */}
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>Автор: {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-6)}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="glass-ultra hover:glass-accent p-2 rounded-lg transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProposal(selectedProposal?.id === proposal.id ? null : proposal);
                      }}
                    >
                      <Eye className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Voting Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">ЗА: {formatBalance(proposal.votesFor)} VG</span>
                      <span className="text-red-400">ПРОТИВ: {formatBalance(proposal.votesAgainst)} VG</span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (parseFloat(proposal.votesFor) / (parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span>Кворум: {formatBalance(proposal.quorum)} VG</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {proposal.status === 'Active' 
                          ? `Блок окончания: ${proposal.endBlock}`
                          : proposal.status === 'Pending'
                          ? `Блок начала: ${proposal.startBlock}`
                          : 'Завершено'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voting Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center text-slate-100">
            <Settings className="mr-3 text-purple-400" />
            Голосование
          </h2>

          {selectedProposal ? (
            <div className="card animate-enhanced-widget-chaos-5">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{selectedProposal.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{selectedProposal.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400">Статус</p>
                      <p className="font-medium text-slate-200">{selectedProposal.status}</p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400">Категория</p>
                      <p className="font-medium text-slate-200">{selectedProposal.category}</p>
                    </div>
                  </div>
                </div>

                {selectedProposal.status === 'Active' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-200">
                        Количество VG для голосования
                        <span className="text-xs text-gray-400 ml-2">
                          (Доступно: {formatBalance(userData.votingPower || '0')} VG)
                        </span>
                      </label>
                      <input
                        type="number"
                        value={voteAmount}
                        onChange={(e) => setVoteAmount(e.target.value)}
                        placeholder="0.0"
                        className="input-field w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setVoteSupport(true);
                          handleVote(selectedProposal.id, true);
                        }}
                        className="btn-success w-full"
                        disabled={!voteAmount || parseFloat(voteAmount) <= 0}
                      >
                        Голосовать ЗА
                      </button>
                      <button
                        onClick={() => {
                          setVoteSupport(false);
                          handleVote(selectedProposal.id, false);
                        }}
                        className="btn-danger w-full"
                        disabled={!voteAmount || parseFloat(voteAmount) <= 0}
                      >
                        Голосовать ПРОТИВ
                      </button>
                    </div>
                  </div>
                )}

                {selectedProposal.status !== 'Active' && (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-2">Голосование недоступно</p>
                    <p className="text-xs text-gray-500">
                      Статус предложения: {selectedProposal.status}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 animate-enhanced-widget-chaos-6">
              <Vote className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-200 mb-2">
                Выберите предложение
              </h3>
              <p className="text-gray-400">
                Выберите предложение слева для участия в голосовании
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Governance; 