import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../shared/config/contracts';
import GovernanceProposals from '../entities/Governance/ui/GovernanceProposals';
import TransactionHistory from '../entities/Transaction/ui/TransactionHistory';
import { 
  Vote, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Lock,
  Activity,
  TrendingUp,
  Shield,
  BarChart3,
  Coins,
  ExternalLink,
  RefreshCw,
  Zap,
  Target,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { log } from '../shared/lib/logger';

interface ProposalData {
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: 'Active' | 'Succeeded' | 'Defeated' | 'Pending' | 'Executed';
  votesFor: string;
  votesAgainst: string;
  startTime: number;
  endTime: number;
  quorum: string;
  category: 'Protocol' | 'Treasury' | 'Parameter' | 'Emergency';
}

const Governance: React.FC = () => {
  const { t } = useTranslation(['governance', 'common']);
  const { address } = useAccount();
  const chainId = useChainId();
  
  // TODO: Интегрировать контракты через wagmi
  const isConnected = !!address;
  const isCorrectNetwork = chainId === BSC_TESTNET.chainId;
  
  // Временные заглушки для контрактов (TODO: заменить на wagmi)
  const vgContract = null;
  const vgVotesContract = null;
  const governorContract = null;

  const [balances, setBalances] = useState<Record<string, string>>({});
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [governanceStats, setGovernanceStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProposalData | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [voteSupport, setVoteSupport] = useState<boolean | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock proposals data - в продакшене получать из контракта
  const mockProposals: ProposalData[] = [
    {
      id: 1,
      title: 'Увеличение LP-to-VG коэффициента',
      description: 'Предложение увеличить коэффициент обмена LP токенов на VG с 15:1 до 20:1 для стимулирования большего участия в LP locking.',
      proposer: '0x742d35Cc6634C0532925a3b8D4C9db9612345678',
      status: 'Active',
      votesFor: '125000',
      votesAgainst: '45000',
      startTime: Date.now() - 86400000, // 1 день назад
      endTime: Date.now() + 518400000, // 6 дней вперед
      quorum: '100000',
      category: 'Parameter'
    },
    {
      id: 2,
      title: 'Добавление нового токена в экосистему',
      description: 'Предложение добавить поддержку USDT в качестве альтернативы BNB для создания LP позиций.',
      proposer: '0x8ba1f109551bD432803012645Hac136c87654321',
      status: 'Pending',
      votesFor: '0',
      votesAgainst: '0',
      startTime: Date.now() + 86400000, // завтра
      endTime: Date.now() + 691200000, // 8 дней вперед
      quorum: '150000',
      category: 'Protocol'
    },
    {
      id: 3,
      title: 'Обновление timelock задержки',
      description: 'Предложение изменить задержку timelock с 2 дней на 3 дня для повышения безопасности критических изменений.',
      proposer: '0x1234567890abcdef1234567890abcdef12345678',
      status: 'Succeeded',
      votesFor: '200000',
      votesAgainst: '50000',
      startTime: Date.now() - 604800000, // неделю назад
      endTime: Date.now() - 86400000, // день назад
      quorum: '100000',
      category: 'Protocol'
    }
  ];

  const fetchBalances = async () => {
    if (!address) return;

    try {
      setLoading(true);
      
      // TODO: Реализовать когда контракты будут интегрированы
      // Временно устанавливаем заглушки
      setBalances({
        VG: '0',
        VGV: '0'
      });
    } catch (error) {
      log.error('Failed to fetch governance balances', {
        component: 'Governance',
        function: 'fetchBalances',
        address: address
      }, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGovernanceStats = async () => {
    // Заглушка - в продакшене получать из governance контракта
    setGovernanceStats({
      totalProposals: proposals.length,
      activeProposals: proposals.filter(p => p.status === 'Active').length,
      totalVotingPower: '500000',
      participationRate: '68.5',
    });
  };

  const fetchProposals = async () => {
    // Заглушка - в продакшене получать из Governor контракта
    // Пока используем пустой массив
    setProposals([]);
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchBalances();
      fetchGovernanceStats();
      fetchProposals();
    }
  }, [address, isConnected, isCorrectNetwork]);

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
      // TODO: Реализовать голосование когда контракты будут интегрированы
      toast.error('Голосование временно недоступно - контракты не интегрированы');
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

  const stats = [
    {
      title: 'Ваши VG токены',
      value: formatBalance(balances.VG || '0'),
      unit: 'VG',
      icon: Coins,
      color: 'text-yellow-400',
    },
    {
      title: 'Voting Power',
      value: formatBalance(balances.VGV || '0'),
      unit: 'VGV',
      icon: Vote,
      color: 'text-purple-400',
    },
    {
      title: 'Всего предложений',
      value: governanceStats.totalProposals?.toString() || '0',
      unit: 'proposals',
      icon: FileText,
      color: 'text-blue-400',
    },
    {
      title: 'Активных',
      value: governanceStats.activeProposals?.toString() || '0',
      unit: 'активных',
      icon: Activity,
      color: 'text-green-400',
    },
  ];

  const protocolStats = [
    {
      title: 'Общая voting power',
      value: formatBalance(governanceStats.totalVotingPower || '0'),
      unit: 'VGV',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      title: 'Участие в голосовании',
      value: governanceStats.participationRate || '0',
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
      title: 'Средний кворум',
      value: '125',
      unit: 'K VGV',
      icon: Target,
      color: 'text-yellow-400',
    },
  ];

  if (!isConnected) {
    return (
      <div className="animate-fade-in px-responsive">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-glass-pulse" />
          <h2 className="hero-title text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('common:messages.connectWallet')}
          </h2>
          <p className="hero-subtitle text-xl text-gray-400 mb-8">
            Подключите кошелек для участия в governance
          </p>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in px-responsive">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400 animate-glass-pulse" />
          <h2 className="hero-title text-3xl font-bold mb-4 text-red-400">
            Неправильная сеть
          </h2>
          <p className="hero-subtitle text-xl text-gray-400 mb-8">
            {t('common:messages.wrongNetwork')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-responsive px-responsive">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <Vote className="w-8 h-8 text-purple-400 animate-glass-pulse" />
          <h1 className="hero-title text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            {t('governance:title')}
          </h1>
        </div>
        <p className="hero-subtitle text-xl text-gray-300 max-w-2xl mx-auto">
          {t('governance:subtitle')}
        </p>
      </div>

      {/* Personal Stats */}
      <div>
        <h2 className="section-title text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Activity className="mr-3 text-purple-400 animate-glass-pulse" />
          Ваша статистика
        </h2>
        
        <div className="grid-responsive-1-2-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card-ultra animate-glass-float">
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
                <stat.icon className={`w-8 h-8 ${stat.color} animate-glass-pulse`} />
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
            <div key={index} className="card-ultra animate-glass-float">
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
                <stat.icon className={`w-8 h-8 ${stat.color} animate-glass-pulse`} />
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
            {filteredProposals.map((proposal) => (
              <div 
                key={proposal.id} 
                className={`liquid-glass cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-glass-float ${
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
                      <span className="text-green-400">ЗА: {formatBalance(proposal.votesFor)} VGV</span>
                      <span className="text-red-400">ПРОТИВ: {formatBalance(proposal.votesAgainst)} VGV</span>
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
                      <span>Кворум: {formatBalance(proposal.quorum)} VGV</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {proposal.status === 'Active' 
                          ? `Осталось ${Math.ceil((proposal.endTime - Date.now()) / 86400000)} дней`
                          : proposal.status === 'Pending'
                          ? `Начнется через ${Math.ceil((proposal.startTime - Date.now()) / 86400000)} дней`
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
            <div className="card">
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
                        Количество VGV для голосования
                        <span className="text-xs text-gray-400 ml-2">
                          (Доступно: {formatBalance(balances.VGV || '0')} VGV)
                        </span>
                      </label>
                      <input
                        type="number"
                        value={voteAmount}
                        onChange={(e) => setVoteAmount(e.target.value)}
                        placeholder="0.0"
                        className="input-field w-full"
                        step="any"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setVoteSupport(true)}
                        className={`py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                          voteSupport === true
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-green-500/10 hover:text-green-400'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>ЗА</span>
                      </button>
                      
                      <button
                        onClick={() => setVoteSupport(false)}
                        className={`py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                          voteSupport === false
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>ПРОТИВ</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleVote(selectedProposal.id, voteSupport!)}
                      disabled={!voteAmount || voteSupport === null}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Vote className="w-4 h-4" />
                      <span>Проголосовать</span>
                    </button>
                  </div>
                )}

                {selectedProposal.status !== 'Active' && (
                  <div className="text-center py-6 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Голосование {selectedProposal.status === 'Pending' ? 'еще не началось' : 'завершено'}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🗳️</div>
              <h3 className="text-xl font-bold mb-2 text-slate-100">Выберите предложение</h3>
              <p className="text-gray-400">
                Выберите предложение из списка для голосования
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Zap className="mr-3 text-yellow-400" />
          Быстрые действия
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Coins className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">Получить VG</h3>
            <p className="text-gray-400 mb-4">Заблокируйте LP токены для получения VG</p>
            <a href="/staking" className="btn-primary inline-block">
              Перейти к LP Locking
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <Vote className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">Конвертировать VG</h3>
            <p className="text-gray-400 mb-4">Обменяйте VG на VGVotes для голосования</p>
            <a href="/staking" className="btn-primary inline-block">
              Конвертировать
            </a>
          </div>
          
          <div className="card text-center group hover:scale-105 transition-transform duration-200">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2 text-slate-100">Аналитика</h3>
            <p className="text-gray-400 mb-4">Просмотрите статистику governance</p>
            <a href="/" className="btn-primary inline-block">
              Перейти к Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <Shield className="mr-3 text-blue-400" />
          Информация о контрактах
        </h2>
        
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium text-slate-200">VG Token</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.VG_TOKEN.slice(0, 6)}...${CONTRACTS.VG_TOKEN.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium text-slate-200">VG Votes</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN_VOTES}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.VG_TOKEN_VOTES.slice(0, 6)}...${CONTRACTS.VG_TOKEN_VOTES.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium text-slate-200">Timelock</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.TIMELOCK}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.TIMELOCK.slice(0, 6)}...${CONTRACTS.TIMELOCK.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-white/5">
              <span className="font-medium text-slate-200">Governor</span>
              <a
                href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.GOVERNOR}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
              >
                <span>{`${CONTRACTS.GOVERNOR.slice(0, 6)}...${CONTRACTS.GOVERNOR.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Governance Component */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
          <FileText className="mr-3 text-green-400" />
          Дополнительные предложения
        </h2>
      <GovernanceProposals />
      </div>

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default Governance; 