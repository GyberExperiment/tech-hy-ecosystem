import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../../../shared/config/contracts';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';
import { useTokenData } from '../../Token/model/useTokenData';

export interface GovernanceProposal {
  id: number;
  proposalId: bigint;
  title: string;
  description: string;
  proposer: string;
  status: 'Pending' | 'Active' | 'Canceled' | 'Defeated' | 'Succeeded' | 'Queued' | 'Expired' | 'Executed';
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  startBlock: number;
  endBlock: number;
  eta: number;
  quorum: string;
  category: 'Protocol' | 'Treasury' | 'Parameter' | 'Emergency';
  targets: string[];
  values: string[];
  calldatas: string[];
  createdAt: number;
  updatedAt: number;
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVotingPower: string;
  participationRate: string;
  quorumRequired: string;
  proposalThreshold: string;
  votingDelay: number;
  votingPeriod: number;
}

export interface GovernanceUserData {
  votingPower: string;
  delegatedTo: string | null;
  hasVoted: Record<number, boolean>;
  voteChoices: Record<number, number>; // 0=Against, 1=For, 2=Abstain
}

interface UseGovernanceDataReturn {
  proposals: GovernanceProposal[];
  stats: GovernanceStats;
  userData: GovernanceUserData;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshData: () => void;
  refreshProposals: () => void;
  refreshStats: () => void;
  isSystemReady: boolean;
}

// Governor ABI для чтения данных
const GOVERNOR_ABI = [
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256 proposalId) view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function getVotes(address account, uint256 blockNumber) view returns (uint256)",
  "function quorum(uint256 blockNumber) view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)"
];

// Cache для governance данных
const governanceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 120000; // 2 минуты

export const useGovernanceData = (): UseGovernanceDataReturn => {
  // Используем централизованный хук для балансов
  const { balances, loading: balancesLoading } = useTokenData();
  
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [stats, setStats] = useState<GovernanceStats>({
    totalProposals: 0,
    activeProposals: 0,
    totalVotingPower: '0',
    participationRate: '0',
    quorumRequired: '0',
    proposalThreshold: '0',
    votingDelay: 0,
    votingPeriod: 0
  });
  const [userData, setUserData] = useState<GovernanceUserData>({
    votingPower: '0',
    delegatedTo: null,
    hasVoted: {},
    voteChoices: {}
  });
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fetchInProgressRef.current = false;
    };
  }, []);

  const fetchGovernanceStats = useCallback(async (): Promise<void> => {
    if (fetchInProgressRef.current) return;

    const cacheKey = 'governance_stats';
    const cached = governanceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (mountedRef.current) {
        setStats(cached.data);
      }
      return;
    }

    fetchInProgressRef.current = true;
    try {
      log.info('Fetching governance stats', {
        component: 'useGovernanceData',
        function: 'fetchGovernanceStats'
      });

      const statsData = await rpcService.withFallback(async (provider) => {
        // Проверяем, есть ли контракт governor
        const code = await provider.getCode(CONTRACTS.LP_LOCKER_GOVERNOR);
        if (code === '0x') {
          log.warn('Governor contract not deployed', {
            component: 'useGovernanceData',
            contract: CONTRACTS.LP_LOCKER_GOVERNOR
          });
          return null;
        }

        const governorContract = new ethers.Contract(CONTRACTS.LP_LOCKER_GOVERNOR, GOVERNOR_ABI, provider);
        
        const [
          proposalCount,
          proposalThreshold,
          votingDelay,
          votingPeriod,
          currentBlock
        ] = await Promise.all([
          governorContract.proposalCount?.() || Promise.resolve(0n),
          governorContract.proposalThreshold?.() || Promise.resolve(0n),
          governorContract.votingDelay?.() || Promise.resolve(0n),
          governorContract.votingPeriod?.() || Promise.resolve(0n),
          provider.getBlockNumber()
        ]);

        // Получаем quorum для текущего блока
        let quorumRequired = '0';
        try {
          const quorum = await governorContract.quorum?.(currentBlock) || 0n;
          quorumRequired = ethers.formatEther(quorum);
        } catch (error) {
          log.warn('Failed to get quorum', { error });
        }

        return {
          totalProposals: Number(proposalCount),
          activeProposals: 0, // Будет подсчитано при загрузке proposals
          totalVotingPower: balances.VG || '0', // Используем реальный баланс VG
          participationRate: '0', // Рассчитается позже
          quorumRequired,
          proposalThreshold: ethers.formatEther(proposalThreshold),
          votingDelay: Number(votingDelay),
          votingPeriod: Number(votingPeriod)
        };
      });

      if (mountedRef.current && statsData) {
        setStats(statsData);
        governanceCache.set(cacheKey, { data: statsData, timestamp: Date.now() });
        log.info('Governance stats loaded', {
          component: 'useGovernanceData',
          stats: statsData
        });
      } else if (mountedRef.current) {
        // Governor контракт не развернут, используем минимальные данные
        const fallbackStats = {
          totalProposals: 0,
          activeProposals: 0,
          totalVotingPower: balances.VG || '0',
          participationRate: '0',
          quorumRequired: '0',
          proposalThreshold: '0',
          votingDelay: 0,
          votingPeriod: 0
        };
        setStats(fallbackStats);
        log.info('Governor not deployed, using fallback stats', {
          component: 'useGovernanceData'
        });
      }

    } catch (error: any) {
      log.error('Failed to fetch governance stats', {
        component: 'useGovernanceData',
        function: 'fetchGovernanceStats'
      }, error);
      
      if (mountedRef.current) {
        setError('Failed to load governance stats');
        // Используем fallback данные с реальными балансами
        setStats(prev => ({
          ...prev,
          totalVotingPower: balances.VG || '0'
        }));
      }
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [balances.VG]);

  const fetchProposals = useCallback(async (): Promise<void> => {
    try {
      log.info('Fetching governance proposals', {
        component: 'useGovernanceData',
        function: 'fetchProposals'
      });

      const proposalsData = await rpcService.withFallback(async (provider) => {
        // Проверяем, есть ли контракт governor
        const code = await provider.getCode(CONTRACTS.LP_LOCKER_GOVERNOR);
        if (code === '0x') {
          return [];
        }

        const governorContract = new ethers.Contract(CONTRACTS.LP_LOCKER_GOVERNOR, GOVERNOR_ABI, provider);
        
        // Получаем количество proposals
        const proposalCount = await governorContract.proposalCount?.() || 0n;
        
        if (proposalCount === 0n) {
          return [];
        }

        // Загружаем последние 10 proposals
        const proposals: GovernanceProposal[] = [];
        const limit = Math.min(Number(proposalCount), 10);
        
        for (let i = 0; i < limit; i++) {
          try {
            const proposalId = BigInt(Number(proposalCount) - i);
            const proposalData = await governorContract.proposals?.(proposalId);
            const state = await governorContract.state?.(proposalId);
            
            if (proposalData) {
              const proposal: GovernanceProposal = {
                id: Number(proposalId),
                proposalId,
                title: `Proposal #${proposalId}`,
                description: `Governance proposal #${proposalId}`,
                proposer: proposalData[1] || ethers.ZeroAddress,
                status: getProposalStatus(Number(state)),
                votesFor: ethers.formatEther(proposalData[5] || 0n),
                votesAgainst: ethers.formatEther(proposalData[6] || 0n),
                votesAbstain: ethers.formatEther(proposalData[7] || 0n),
                startBlock: Number(proposalData[3] || 0n),
                endBlock: Number(proposalData[4] || 0n),
                eta: Number(proposalData[2] || 0n),
                quorum: '100000', // Может быть получено из контракта
                category: 'Protocol',
                targets: [],
                values: [],
                calldatas: [],
                createdAt: Date.now() - (Number(proposalId) * 86400000), // Примерная дата
                updatedAt: Date.now()
              };
              
              proposals.push(proposal);
            }
          } catch (error) {
            log.warn('Failed to load proposal', { proposalId: Number(proposalCount) - i, error });
          }
        }
        
        return proposals;
      });

      if (mountedRef.current) {
        setProposals(proposalsData);
        
        // Обновляем активные proposals в stats
        const activeCount = proposalsData.filter(p => p.status === 'Active').length;
        setStats(prev => ({ ...prev, activeProposals: activeCount }));
        
        log.info('Governance proposals loaded', {
          component: 'useGovernanceData',
          count: proposalsData.length,
          active: activeCount
        });
      }

    } catch (error: any) {
      log.error('Failed to fetch governance proposals', {
        component: 'useGovernanceData',
        function: 'fetchProposals'
      }, error);
      
      if (mountedRef.current) {
        setError('Failed to load proposals');
        setProposals([]); // Очищаем proposals при ошибке
      }
    }
  }, []);

  // Маппинг состояний proposals
  const getProposalStatus = (state: number): GovernanceProposal['status'] => {
    const states = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
    return (states[state] as GovernanceProposal['status']) || 'Pending';
  };

  // Unified refresh function
  const refreshData = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchGovernanceStats(),
        fetchProposals()
      ]);
    } catch (error) {
      log.error('Failed to refresh governance data', {
        component: 'useGovernanceData',
        function: 'refreshData'
      }, error as Error);
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [refreshing, fetchGovernanceStats, fetchProposals]);

  const refreshProposals = useCallback(() => {
    fetchProposals();
  }, [fetchProposals]);

  const refreshStats = useCallback(() => {
    fetchGovernanceStats();
  }, [fetchGovernanceStats]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await refreshData();
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [refreshData]);

  // Update voting power when balances change
  useEffect(() => {
    if (balances.VG) {
      setUserData(prev => ({
        ...prev,
        votingPower: balances.VG || '0'
      }));
    }
  }, [balances.VG]);

  const isSystemReady = !balancesLoading && !loading;

  return {
    proposals,
    stats,
    userData,
    loading,
    refreshing,
    error,
    refreshData,
    refreshProposals,
    refreshStats,
    isSystemReady
  };
}; 