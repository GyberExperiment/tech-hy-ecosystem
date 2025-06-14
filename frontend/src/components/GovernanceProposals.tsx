import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  ExternalLink,
  AlertTriangle,
  Filter,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { TableSkeleton } from './LoadingSkeleton';

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
      const power = await vgVotesContract.getPastVotes(account, currentBlock - 1);
      setVotingPower(power ? ethers.formatEther(power) : '0');
    } catch (error) {
      console.error('Error fetching voting power:', error);
      setVotingPower('0'); // Fallback значение при ошибке
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
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Ошибка загрузки предложений');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: number, support: number) => {
    if (!governorContract || !account) return;
    
    try {
      toast.loading('Отправка голоса...', { id: 'vote' });
      
      const tx = await governorContract.castVote(proposalId, support);
      await tx.wait();
      
      toast.success('Голос успешно отправлен!', { id: 'vote' });
      fetchProposals(); // Refresh proposals
    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error(`Ошибка голосования: ${error.message}`, { id: 'vote' });
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
      
      const tx = await governorContract.propose(
        newProposal.targets,
        newProposal.values,
        newProposal.calldatas,
        `${newProposal.title}\n\n${newProposal.description}`
      );
      await tx.wait();
      
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
      console.error('Error creating proposal:', error);
      toast.error(`Ошибка создания: ${error.message}`, { id: 'create' });
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
      <div className="card text-center text-gray-400">
        <Vote className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2 text-slate-100">Управление протоколом</h3>
        <p>Подключите кошелёк для участия в голосованиях</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with voting power and create button */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-slate-100">Управление протоколом</h2>
            <p className="text-gray-400">Участвуйте в развитии экосистемы через голосования</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">Ваша сила голоса</div>
              <div className="text-xl font-bold text-blue-400">{parseFloat(votingPower).toLocaleString()} VG</div>
            </div>
            
            <button
              onClick={() => setShowCreateProposal(true)}
              className="btn-primary flex items-center space-x-2"
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
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'active' 
              ? 'bg-blue-500 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => setFilter('protocol')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'protocol' 
              ? 'bg-blue-500 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Протокол
        </button>
        <button
          onClick={() => setFilter('treasury')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'treasury' 
              ? 'bg-blue-500 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Казна
        </button>
      </div>

      {/* Create Proposal Modal */}
      {showCreateProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-100">Создать предложение</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">Название *</label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                  placeholder="Краткое название предложения"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">Категория</label>
                <select
                  value={newProposal.category}
                  onChange={(e) => setNewProposal({...newProposal, category: e.target.value as Proposal['category']})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
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
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 h-32"
                  placeholder="Подробное описание предложения и его обоснование"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateProposal}
                  className="btn-primary flex-1"
                >
                  Создать предложение
                </button>
                <button
                  onClick={() => setShowCreateProposal(false)}
                  className="btn-secondary flex-1"
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
        <div className="card text-center text-gray-400 py-12">
          <Vote className="mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2 text-slate-100">Предложений не найдено</h3>
          <p>Пока нет активных предложений для голосования</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProposals.map((proposal) => {
            const percentages = calculateVotingPercentages(proposal);
            
            return (
              <div key={proposal.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    {getCategoryIcon(proposal.category)}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{proposal.title}</h3>
                      <p className="text-gray-400 text-sm">Предложил: {proposal.proposer}</p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(proposal.status)}`}>
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
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${percentages.for}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 text-sm">Против ({percentages.against.toFixed(1)}%)</span>
                      <span className="text-sm">{parseFloat(proposal.againstVotes).toLocaleString()} VG</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${percentages.against}%` }}
                      />
                    </div>
                    
                    {parseFloat(proposal.abstainVotes) > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Воздержались ({percentages.abstain.toFixed(1)}%)</span>
                          <span className="text-sm">{parseFloat(proposal.abstainVotes).toLocaleString()} VG</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gray-500 h-2 rounded-full" 
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
                      className="btn-success flex items-center space-x-2"
                    >
                      <CheckCircle size={16} />
                      <span>За</span>
                    </button>
                    <button
                      onClick={() => handleVote(proposal.proposalId, 0)}
                      className="btn-danger flex items-center space-x-2"
                    >
                      <XCircle size={16} />
                      <span>Против</span>
                    </button>
                    <button
                      onClick={() => handleVote(proposal.proposalId, 2)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Clock size={16} />
                      <span>Воздержаться</span>
                    </button>
                  </div>
                )}
                
                {proposal.status === 'active' && parseFloat(votingPower) === 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm">
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