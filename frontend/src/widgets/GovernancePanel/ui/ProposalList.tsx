import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  RefreshCw,
  AlertCircle,
  Wallet,
  Vote,
  Loader2
} from 'lucide-react';
import { useRealGovernanceData, ProposalState } from '../../../entities/Governance/api/useRealGovernanceData';
import { useFormatUtils } from '../../../shared/hooks/useCalculations';
import { WIDGET_CONFIG } from '../../../shared/config/widgets';

const ProposalList: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'failed'>('all');
  const [votingProposal, setVotingProposal] = useState<string | null>(null);
  
  const {
    proposals,
    stats,
    userData,
    loading,
    refreshing,
    error,
    isSystemReady,
    refreshData,
    castVote,
  } = useRealGovernanceData();

  const { formatTokenAmount, formatAddress } = useFormatUtils();

  // Map proposal states to our filter format
  const mapStateToFilter = (state: ProposalState): 'active' | 'passed' | 'failed' | 'other' => {
    switch (state) {
      case ProposalState.Active:
        return 'active';
      case ProposalState.Succeeded:
      case ProposalState.Executed:
        return 'passed';
      case ProposalState.Defeated:
        return 'failed';
      default:
        return 'other';
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    const mappedState = mapStateToFilter(proposal.state);
    return mappedState === filter;
  });

  const handleVote = async (proposalId: string, support: number) => {
    setVotingProposal(proposalId);
    try {
      await castVote(proposalId, support);
    } finally {
      setVotingProposal(null);
    }
  };

  // Loading state
  if (loading && proposals.length === 0) {
    return (
      <motion.div
        className="space-y-6 animate-section-breathing-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass-enhanced-breathing p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
            <span className="text-white">Loading governance data...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error && !isSystemReady) {
    return (
      <motion.div
        className="space-y-6 animate-section-breathing-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass-enhanced-breathing p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Governance Not Available</h3>
            <p className="text-gray-300 mb-4">
              Governance contracts are not deployed yet or network connection failed.
            </p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const getStatusIcon = (state: ProposalState) => {
    switch (state) {
      case ProposalState.Active: return <Clock className="w-4 h-4 text-blue-400" />;
      case ProposalState.Succeeded:
      case ProposalState.Executed: return <CheckCircle className="w-4 h-4 text-green-400" />;
      case ProposalState.Defeated: return <XCircle className="w-4 h-4 text-red-400" />;
      case ProposalState.Pending: return <Clock className="w-4 h-4 text-yellow-400" />;
      case ProposalState.Queued: return <Calendar className="w-4 h-4 text-purple-400" />;
      case ProposalState.Canceled: return <XCircle className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (state: ProposalState) => {
    switch (state) {
      case ProposalState.Active: return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case ProposalState.Succeeded:
      case ProposalState.Executed: return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case ProposalState.Defeated: return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case ProposalState.Pending: return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case ProposalState.Queued: return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case ProposalState.Canceled: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  return (
    <motion.div
      className="space-y-6 animate-section-breathing-subtle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="glass-enhanced-breathing p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Governance Proposals</h1>
            <p className="text-gray-300">Shape the future of TECH HY ecosystem</p>
          </div>
          <div className="flex items-center gap-4">
            {userData && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Your Voting Power</div>
                <div className="text-lg font-bold text-blue-300">
                  {formatTokenAmount(userData.votingPower)} VG
                </div>
              </div>
            )}
            <motion.button
              onClick={refreshData}
              disabled={refreshing}
              className="p-2 backdrop-blur-xl bg-white/8 border border-blue-400/25 rounded-xl hover:bg-blue-500/15 transition-all duration-300 group disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`h-5 w-5 text-blue-300/80 group-hover:text-white transition-colors duration-300 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-blue-400/8 to-cyan-400/5 border border-blue-400/25 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-300">{stats.totalProposals}</div>
              <div className="text-xs text-blue-200/80">Total Proposals</div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-green-400/8 to-emerald-400/5 border border-green-400/25 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-300">{stats.activeProposals}</div>
              <div className="text-xs text-green-200/80">Active</div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-purple-400/8 to-pink-400/5 border border-purple-400/25 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-300">{stats.passedProposals}</div>
              <div className="text-xs text-purple-200/80">Passed</div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 via-orange-400/8 to-red-400/5 border border-orange-400/25 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-300">{formatTokenAmount(stats.quorumVotes)}</div>
              <div className="text-xs text-orange-200/80">Quorum VG</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', count: proposals.length },
            { key: 'active', label: 'Active', count: filteredProposals.filter(p => mapStateToFilter(p.state) === 'active').length },
            { key: 'passed', label: 'Passed', count: filteredProposals.filter(p => mapStateToFilter(p.state) === 'passed').length },
            { key: 'failed', label: 'Failed', count: filteredProposals.filter(p => mapStateToFilter(p.state) === 'failed').length }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                filter === tab.key
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.05 }}
              onClick={() => setFilter(tab.key as any)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 bg-current/20 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Proposals */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="glass-enhanced-breathing p-12 text-center">
            <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Proposals Found</h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'No governance proposals available yet.' 
                : `No ${filter} proposals found.`
              }
            </p>
          </div>
        ) : (
          filteredProposals.map((proposal, index) => {
            const isVoting = votingProposal === proposal.id;

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
                        <h3 className="text-xl font-bold text-white line-clamp-2">{proposal.title}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.state)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(proposal.state)}
                            <span>{proposal.stateLabel}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>By {formatAddress(proposal.proposer)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {proposal.isActive 
                              ? `Ends ${proposal.estimatedEndDate.toLocaleDateString()}`
                              : `Ended ${proposal.estimatedEndDate.toLocaleDateString()}`
                            }
                          </span>
                        </div>
                        {proposal.hasVoted && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Voted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6 line-clamp-3">{proposal.description}</p>

                  {/* Voting Progress */}
                  <div className="space-y-3">
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="h-full flex rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500 transition-all duration-500"
                          style={{ width: `${proposal.forPercentage}%` }}
                        />
                        <div 
                          className="bg-red-500 transition-all duration-500"
                          style={{ width: `${proposal.againstPercentage}%` }}
                        />
                        {proposal.abstainPercentage > 0 && (
                          <div 
                            className="bg-gray-500 transition-all duration-500"
                            style={{ width: `${proposal.abstainPercentage}%` }}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-green-400">
                        <ThumbsUp className="w-4 h-4" />
                        <span>
                          {proposal.forPercentage.toFixed(1)}% ({formatTokenAmount(proposal.votesFor)} VG)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400">
                        <ThumbsDown className="w-4 h-4" />
                        <span>
                          {proposal.againstPercentage.toFixed(1)}% ({formatTokenAmount(proposal.votesAgainst)} VG)
                        </span>
                      </div>
                    </div>
                    
                    {/* Show user's vote if they voted */}
                    {proposal.userVote && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                        <div className="text-xs text-blue-300">
                          Your vote: {proposal.userVote.support === 0 ? 'Against' : proposal.userVote.support === 1 ? 'For' : 'Abstain'} 
                          ({formatTokenAmount(proposal.userVote.votes)} VG)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voting buttons for active proposals */}
                  {proposal.canVote && userData && parseFloat(userData.votingPower) > 0 && (
                    <div className="flex gap-4 mt-6">
                      <motion.button
                        onClick={() => handleVote(proposal.id, 1)}
                        disabled={isVoting}
                        className="flex-1 glass-btn-ghost border-green-500/30 hover:bg-green-500/10 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isVoting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-4 h-4" />
                        )}
                        <span>Vote For</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleVote(proposal.id, 0)}
                        disabled={isVoting}
                        className="flex-1 glass-btn-ghost border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isVoting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ThumbsDown className="w-4 h-4" />
                        )}
                        <span>Vote Against</span>
                      </motion.button>
                    </div>
                  )}

                  {/* Message for users without voting power */}
                  {proposal.isActive && (!userData || parseFloat(userData.votingPower) === 0) && (
                    <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-300 text-sm">
                        <Wallet className="w-4 h-4" />
                        <span>
                          {!userData 
                            ? 'Connect your wallet to vote'
                            : 'You need VG tokens to vote on proposals'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default ProposalList; 