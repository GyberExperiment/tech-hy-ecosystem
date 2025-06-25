import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Users
} from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed';
  votesFor: number;
  votesAgainst: number;
  endDate: string;
  proposer: string;
}

const ProposalList: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'failed'>('all');

  const proposals: Proposal[] = [
    {
      id: 'prop-001',
      title: 'Increase Mining Rewards for VG Token Holders',
      description: 'Proposal to increase daily mining rewards from 0.1% to 0.15% for VG token holders.',
      status: 'active',
      votesFor: 125486,
      votesAgainst: 23749,
      endDate: '2025-02-15T23:59:59Z',
      proposer: '0x742d...A5E9'
    },
    {
      id: 'prop-002',
      title: 'Partnership with Major DeFi Protocol',
      description: 'Establish strategic partnership with Uniswap for additional liquidity incentives.',
      status: 'active',
      votesFor: 89234,
      votesAgainst: 45123,
      endDate: '2025-02-20T23:59:59Z',
      proposer: '0x3F2A...B7C4'
    },
    {
      id: 'prop-003',
      title: 'Community Grant Program Launch',
      description: 'Allocate $500,000 from treasury for community-driven development grants.',
      status: 'passed',
      votesFor: 234567,
      votesAgainst: 45234,
      endDate: '2025-01-05T23:59:59Z',
      proposer: '0x9B8C...D1F6'
    }
  ];

  const filteredProposals = proposals.filter(proposal => 
    filter === 'all' || proposal.status === filter
  );

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'passed': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border border-red-500/30';
    }
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  return (
    <motion.div
      className="space-y-6 animate-section-breathing-subtle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="glass-enhanced-breathing p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Governance Proposals</h1>
        <p className="text-gray-300 mb-6">Shape the future of TECH HY ecosystem</p>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'passed', label: 'Passed' },
            { key: 'failed', label: 'Failed' }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.05 }}
              onClick={() => setFilter(tab.key as any)}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Proposals */}
      <div className="space-y-4">
        {filteredProposals.map((proposal, index) => {
          const totalVotes = proposal.votesFor + proposal.votesAgainst;
          const forPercentage = calculateVotePercentage(proposal.votesFor, totalVotes);
          const againstPercentage = calculateVotePercentage(proposal.votesAgainst, totalVotes);

          return (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-enhanced-breathing group relative overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{proposal.title}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(proposal.status)}
                          <span className="capitalize">{proposal.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>By {proposal.proposer}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Ends {new Date(proposal.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 mb-6">{proposal.description}</p>

                {/* Voting Progress */}
                <div className="space-y-3">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="h-full flex rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500 transition-all duration-500"
                        style={{ width: `${forPercentage}%` }}
                      />
                      <div 
                        className="bg-red-500 transition-all duration-500"
                        style={{ width: `${againstPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-green-400">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{forPercentage}% ({proposal.votesFor.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                      <ThumbsDown className="w-4 h-4" />
                      <span>{againstPercentage}% ({proposal.votesAgainst.toLocaleString()})</span>
                    </div>
                  </div>
                </div>

                {proposal.status === 'active' && (
                  <div className="flex gap-4 mt-6">
                    <motion.button
                      className="flex-1 glass-btn-ghost border-green-500/30 hover:bg-green-500/10"
                      whileHover={{ scale: 1.02 }}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Vote For</span>
                    </motion.button>
                    
                    <motion.button
                      className="flex-1 glass-btn-ghost border-red-500/30 hover:bg-red-500/10"
                      whileHover={{ scale: 1.02 }}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>Vote Against</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProposalList; 