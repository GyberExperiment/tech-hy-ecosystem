import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { ethers } from 'ethers';
import { TableSkeleton } from '../../../shared/ui/LoadingSkeleton';
import { log } from '../../../shared/lib/logger';

interface Proposal {
  id: string;
  proposalId: number;
  title: string;
  description: string;
  proposer: string;
  startBlock: number;
  endBlock: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  status: 'pending' | 'active' | 'succeeded' | 'defeated' | 'queued' | 'executed' | 'canceled';
  targets: string[];
  values: string[];
  calldatas: string[];
  eta?: number;
  category: 'treasury' | 'protocol' | 'community' | 'emergency';
}

const GovernanceProposals: React.FC = () => {
  const { account, governorContract, vgVotesContract, provider } = useWeb3();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [votingPower, setVotingPower] = useState('0');
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // New proposal form
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'protocol' as Proposal['category'],
    targets: [''],
    values: ['0'],
    calldatas: ['0x'],
  });

  useEffect(() => {
    if (account && governorContract) {
      fetchProposals();
      fetchVotingPower();
    }
  }, [account, governorContract]);

  const fetchVotingPower = async () => {
    if (!account || !vgVotesContract || !provider) return;
    
    try {
      const currentBlock = await provider.getBlockNumber();
      const power = await vgVotesContract?.getPastVotes?.(account, currentBlock - 1);
      setVotingPower(power ? ethers.formatEther(power) : '0');
    } catch (error: any) {
      log.error('Failed to fetch voting power', {
        component: 'GovernanceProposals',
        function: 'fetchVotingPower',
        address: account
      }, error);
      setVotingPower('0');
    }
  };

  const fetchProposals = async () => {
    if (!governorContract) return;
    
    setLoading(true);
    try {
      // Fetch proposal created events and build proposal list
      // For demo purposes, we'll use mock data
      const mockProposals: Proposal[] = [
        {
          id: '1',
          proposalId: 1,
          title: 'Увеличить награды за стейкинг до 15% APY',
          description: 'Предлагается увеличить награды за стейкинг LP токенов с текущих 10% до 15% APY для привлечения большего количества ликвидности в протокол.',
          proposer: '0x742...abc',
          startBlock: 12345600,
          endBlock: 12346000,
          forVotes: '250000',
          againstVotes: '80000',
          abstainVotes: '20000',
          status: 'active',
          targets: ['0x9269baba99cE0388Daf814E351b4d556fA728D32'],
          values: ['0'],
          calldatas: ['0x'],
          category: 'protocol',
        },
        {
          id: '2',
          proposalId: 2,
          title: 'Создать фонд развития протокола',
          description: 'Предлагается выделить 100,000 VG токенов из казны для создания фонда развития протокола и маркетинговых активностей.',
          proposer: '0x123...def',
          startBlock: 12345000,
          endBlock: 12345400,
          forVotes: '180000',
          againstVotes: '320000',
          abstainVotes: '50000',
          status: 'defeated',
          targets: ['0x786133467f52813Ce0855023D4723A244524563E'],
          values: ['0'],
          calldatas: ['0x'],
          category: 'treasury',
        },
        {
          id: '3',
          proposalId: 3,
          title: 'Обновить параметры голосования',
          description: 'Изменить порог кворума с 4% до 3% и период голосования с 3 дней до 5 дней для увеличения участия в голосованиях.',
          proposer: '0x456...ghi',
          startBlock: 12346500,
          endBlock: 12347000,
          forVotes: '0',
          againstVotes: '0',
          abstainVotes: '0',
          status: 'pending',
          targets: ['0x786133467f52813Ce0855023D4723A244524563E'],
          values: ['0'],
          calldatas: ['0x'],
          category: 'protocol',
        }
      ];
      
      setProposals(mockProposals);
    } catch (error: any) {
      log.error('Failed to fetch proposals', {
        component: 'GovernanceProposals',
        function: 'fetchProposals'
      }, error);
      toast.error('Ошибка загрузки предложений');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: number, support: number) => {
    if (!governorContract || !account) return;
    
    try {
      toast.loading('Отправка голоса...', { id: 'vote' });
      
      const tx = await governorContract?.castVote?.(proposalId, support);
      await tx?.wait?.();
      
      toast.success('Голос успешно отправлен!', { id: 'vote' });
      fetchProposals(); // Refresh proposals
    } catch (error: any) {
      log.error('Failed to vote on proposal', {
        component: 'GovernanceProposals',
        function: 'handleVote',
        proposalId,
        support,
        address: account
      }, error);
      toast.error('Ошибка голосования');
    }
  };

  const handleCreateProposal = async () => {
    if (!governorContract || !account) return;
    
    if (!newProposal.title || !newProposal.description) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    try {
      toast.loading('Создание предложения...', { id: 'create' });
      
      const tx = await governorContract?.propose?.(
        newProposal.targets,
        newProposal.values,
        newProposal.calldatas,
        `${newProposal.title}\n\n${newProposal.description}`
      );
      await tx?.wait?.();
      
      toast.success('Предложение успешно создано!', { id: 'create' });
      setShowCreateProposal(false);
      setNewProposal({
        title: '',
        description: '',
        category: 'protocol',
        targets: [''],
        values: ['0'],
        calldatas: ['0x'],
      });
      fetchProposals();
    } catch (error: any) {
      log.error('Failed to create proposal', {
        component: 'GovernanceProposals',
        function: 'handleCreateProposal',
        title: newProposal.title,
        description: newProposal.description,
        address: account
      }, error);
      toast.error('Ошибка создания предложения');
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'succeeded':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'defeated':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'executed':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'queued':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'pending':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'Активно';
      case 'succeeded':
        return 'Принято';
      case 'defeated':
        return 'Отклонено';
      case 'executed':
        return 'Исполнено';
      case 'queued':
        return 'В очереди';
      case 'pending':
        return 'Ожидает';
      case 'canceled':
        return 'Отменено';
      default:
        return 'Неизвестно';
    }
  };

  const getCategoryIcon = (category: Proposal['category']) => {
    switch (category) {
      case 'treasury':
        return <FileText className="text-green-400" size={16} />;
      case 'protocol':
        return <TrendingUp className="text-blue-400" size={16} />;
      case 'community':
        return <Users className="text-purple-400" size={16} />;
      case 'emergency':
        return <AlertTriangle className="text-red-400" size={16} />;
      default:
        return <FileText className="text-gray-400" size={16} />;
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    return proposal.status === filter || proposal.category === filter;
  });

  const calculateVotingPercentages = (proposal: Proposal) => {
    const total = parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes) + parseFloat(proposal.abstainVotes);
    if (total === 0) return { for: 0, against: 0, abstain: 0 };
    
    return {
      for: (parseFloat(proposal.forVotes) / total) * 100,
      against: (parseFloat(proposal.againstVotes) / total) * 100,
      abstain: (parseFloat(proposal.abstainVotes) / total) * 100,
    };
  };

  if (!account) {
    return (
      <div className="liquid-glass text-center text-gray-400 animate-glass-float">
        <Vote className="mx-auto mb-4 animate-glass-pulse" size={48} />
        <h3 className="text-lg font-semibold mb-2 text-slate-100">Управление протоколом</h3>
        <p>Подключите кошелёк для участия в голосованиях</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liquid-glass text-center text-gray-400 animate-glass-float">
        <Vote className="mx-auto mb-4 animate-glass-pulse" size={48} />
        <h3 className="text-xl font-bold mb-2 text-slate-100">Ошибка загрузки</h3>
        <p className="mb-4">{error}</p>
        <button 
          onClick={fetchProposals}
          className="btn-glass-morphic flex items-center space-x-2 animate-glass-glow"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Попробовать снова</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-responsive">
      {/* Header with voting power and create button */}
      <div className="liquid-glass animate-glass-float">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="section-title text-2xl font-bold mb-2 text-slate-100">Управление протоколом</h2>
            <p className="text-gray-400">Участвуйте в развитии экосистемы через голосования</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="text-center glass-ultra px-3 py-2 rounded-lg">
              <div className="text-sm text-gray-400">Ваша сила голоса</div>
              <div className="text-xl font-bold text-blue-400">{parseFloat(votingPower).toLocaleString()} VG</div>
            </div>
            
            <button
              onClick={() => setShowCreateProposal(true)}
              className="btn-glass-morphic flex items-center space-x-2 animate-glass-pulse"
              disabled={parseFloat(votingPower) < 1000} // Minimum threshold
            >
              <Plus size={18} />
              <span>Создать предложение</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            filter === 'all' 
              ? 'btn-glass-blue text-white animate-glass-glow'
              : 'glass-card hover:glass-accent'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            filter === 'active' 
              ? 'btn-glass-blue text-white animate-glass-glow'
              : 'glass-card hover:glass-accent'
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            filter === 'closed'
              ? 'btn-glass-blue text-white animate-glass-glow'
              : 'glass-card hover:glass-accent'
          }`}
        >
          Закрытые
        </button>
        <button
          onClick={() => setFilter('executed')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            filter === 'executed'
              ? 'btn-glass-blue text-white animate-glass-glow'
              : 'glass-card hover:glass-accent'
          }`}
        >
          Исполненные
        </button>
      </div>

      {/* Create Proposal Modal */}
      {showCreateProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="liquid-glass max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-glass-float">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Создать предложение</h3>
              <button
                onClick={() => setShowCreateProposal(false)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  'glass-card hover:glass-accent'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">Название *</label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  className="input-field w-full"
                  placeholder="Краткое название предложения"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">Категория</label>
                <select
                  value={newProposal.category}
                  onChange={(e) => setNewProposal({...newProposal, category: e.target.value as Proposal['category']})}
                  className="input-field w-full"
                >
                  <option value="protocol">Протокол</option>
                  <option value="treasury">Казна</option>
                  <option value="community">Сообщество</option>
                  <option value="emergency">Срочное</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">Описание *</label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                  className="input-field w-full h-32"
                  placeholder="Подробное описание предложения и его обоснование"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateProposal}
                  className="btn-glass-morphic flex-1 animate-glass-pulse"
                >
                  Создать предложение
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {loading ? (
        <TableSkeleton rows={3} />
      ) : filteredProposals.length === 0 ? (
        <div className="liquid-glass text-center text-gray-400 py-12 animate-glass-float">
          <Vote className="mx-auto mb-4 animate-glass-pulse" size={48} />
          <h3 className="text-xl font-bold mb-2 text-slate-100">Нет предложений</h3>
          <p>Пока нет предложений в этой категории</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const percentages = calculateVotingPercentages(proposal);
            
            return (
              <div key={proposal.id} className="liquid-glass animate-glass-float">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="animate-glass-glow">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        #{proposal.id} {proposal.title}
                      </h3>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`px-3 py-1 rounded-lg text-xs font-semibold border animate-glass-glow ${getStatusColor(proposal.status)}`}>
                    {getStatusLabel(proposal.status)}
                  </div>
                        <span className="text-sm text-gray-400">
                          {/* Add date formatting logic here */}
                        </span>
                    </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4 line-clamp-2">
                      {proposal.description}
                    </p>
                    
                    {/* Voting Progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">За: {proposal.forVotes} голосов</span>
                        <span className="text-red-400">Против: {proposal.againstVotes} голосов</span>
                    </div>
                      
                      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                          className="absolute top-0 left-0 h-full bg-green-500 animate-glass-glow"
                          style={{ width: `${percentages.for}%` }}
                        />
                        <div 
                          className="absolute top-0 right-0 h-full bg-red-500 animate-glass-glow"
                        style={{ width: `${percentages.against}%` }}
                      />
                    {parseFloat(proposal.abstainVotes) > 0 && (
                          <div 
                            className="absolute top-0 h-full bg-gray-500 animate-glass-glow"
                            style={{ 
                              left: `${percentages.for}%`,
                              width: `${percentages.abstain}%` 
                            }}
                          />
                    )}
                  </div>
                </div>
                
                    {/* Action Buttons */}
                {proposal.status === 'active' && parseFloat(votingPower) > 0 && (
                      <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleVote(proposal.proposalId, 1)}
                          disabled={parseFloat(votingPower) === 0}
                          className="btn-glass-green flex items-center space-x-2 animate-glass-glow"
                    >
                          <ThumbsUp className="w-4 h-4" />
                      <span>За</span>
                    </button>
                    <button
                      onClick={() => handleVote(proposal.proposalId, 0)}
                          disabled={parseFloat(votingPower) === 0}
                          className="btn-glass-fire flex items-center space-x-2 animate-glass-glow"
                    >
                          <ThumbsDown className="w-4 h-4" />
                      <span>Против</span>
                    </button>
                    <button
                      onClick={() => handleVote(proposal.proposalId, 2)}
                          disabled={parseFloat(votingPower) === 0}
                          className="btn-glass-orange flex items-center space-x-2 animate-glass-glow"
                    >
                          <Minus className="w-4 h-4" />
                      <span>Воздержаться</span>
                    </button>
                  </div>
                )}
                
                    {proposal.status === 'executed' && (
                      <div className="glass-accent border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm animate-glass-glow">
                        ✅ Предложение исполнено {/* Add date formatting logic here */}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GovernanceProposals; 