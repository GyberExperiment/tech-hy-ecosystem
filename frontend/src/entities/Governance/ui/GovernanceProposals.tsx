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
  AlertTriangle
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
          className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
            filter === 'all' 
              ? 'btn-glass-blue text-white animate-glass-pulse' 
              : 'glass-ultra text-gray-300 hover:glass-accent'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
            filter === 'active' 
              ? 'btn-glass-blue text-white animate-glass-pulse' 
              : 'glass-ultra text-gray-300 hover:glass-accent'
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => setFilter('protocol')}
          className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
            filter === 'protocol' 
              ? 'btn-glass-blue text-white animate-glass-pulse' 
              : 'glass-ultra text-gray-300 hover:glass-accent'
          }`}
        >
          Протокол
        </button>
        <button
          onClick={() => setFilter('treasury')}
          className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
            filter === 'treasury' 
              ? 'btn-glass-blue text-white animate-glass-pulse' 
              : 'glass-ultra text-gray-300 hover:glass-accent'
          }`}
        >
          Казна
        </button>
      </div>

      {/* Create Proposal Modal */}
      {showCreateProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="liquid-glass max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-glass-float">
            <h3 className="section-title text-xl font-bold mb-6 text-slate-100">Создать предложение</h3>
            
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
                <button
                  onClick={() => setShowCreateProposal(false)}
                  className="btn-glass-fire flex-1"
                >
                  Отмена
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
          <h3 className="text-lg font-semibold mb-2 text-slate-100">Предложений не найдено</h3>
          <p>Пока нет активных предложений для голосования</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProposals.map((proposal) => {
            const percentages = calculateVotingPercentages(proposal);
            
            return (
              <div key={proposal.id} className="liquid-glass animate-glass-float">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="animate-glass-pulse">
                      {getCategoryIcon(proposal.category)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{proposal.title}</h3>
                      <p className="text-gray-400 text-sm">Предложил: {proposal.proposer}</p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold border animate-glass-pulse ${getStatusColor(proposal.status)}`}>
                    {getStatusLabel(proposal.status)}
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">{proposal.description}</p>
                
                {/* Voting Results */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Результаты голосования</span>
                    <span>{(parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes) + parseFloat(proposal.abstainVotes)).toLocaleString()} голосов</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 text-sm">За ({percentages.for.toFixed(1)}%)</span>
                      <span className="text-sm">{parseFloat(proposal.forVotes).toLocaleString()} VG</span>
                    </div>
                    <div className="w-full glass-ultra rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full animate-glass-pulse" 
                        style={{ width: `${percentages.for}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 text-sm">Против ({percentages.against.toFixed(1)}%)</span>
                      <span className="text-sm">{parseFloat(proposal.againstVotes).toLocaleString()} VG</span>
                    </div>
                    <div className="w-full glass-ultra rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full animate-glass-pulse" 
                        style={{ width: `${percentages.against}%` }}
                      />
                    </div>
                    
                    {parseFloat(proposal.abstainVotes) > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Воздержались ({percentages.abstain.toFixed(1)}%)</span>
                          <span className="text-sm">{parseFloat(proposal.abstainVotes).toLocaleString()} VG</span>
                        </div>
                        <div className="w-full glass-ultra rounded-full h-2">
                          <div 
                            className="bg-gray-500 h-2 rounded-full animate-glass-pulse" 
                            style={{ width: `${percentages.abstain}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Voting Buttons */}
                {proposal.status === 'active' && parseFloat(votingPower) > 0 && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleVote(proposal.proposalId, 1)}
                      className="btn-glass-green flex items-center space-x-2 animate-glass-pulse"
                    >
                      <CheckCircle size={16} />
                      <span>За</span>
                    </button>
                    <button
                      onClick={() => handleVote(proposal.proposalId, 0)}
                      className="btn-glass-fire flex items-center space-x-2 animate-glass-pulse"
                    >
                      <XCircle size={16} />
                      <span>Против</span>
                    </button>
                    <button
                      onClick={() => handleVote(proposal.proposalId, 2)}
                      className="btn-glass-orange flex items-center space-x-2 animate-glass-pulse"
                    >
                      <Clock size={16} />
                      <span>Воздержаться</span>
                    </button>
                  </div>
                )}
                
                {proposal.status === 'active' && parseFloat(votingPower) === 0 && (
                  <div className="glass-accent border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm animate-glass-pulse">
                    У вас нет VG токенов для голосования. Получите VG через стейкинг LP токенов.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GovernanceProposals; 