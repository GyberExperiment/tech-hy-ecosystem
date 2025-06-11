import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, BSC_TESTNET } from '../constants/contracts';
import { Vote, Users, Lock, Unlock, ExternalLink, RefreshCw, Info, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface GovernanceData {
  vgBalance: string;
  vgvBalance: string;
  vgAllowance: string;
  votingPower: string;
  totalVotingPower: string;
}

const Governance: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    vgContract,
    vgVotesContract
  } = useWeb3();

  const [governanceData, setGovernanceData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [wrapAmount, setWrapAmount] = useState('');
  const [unwrapAmount, setUnwrapAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap');

  // Extended VGVotes ABI
  const VG_VOTES_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function deposit(uint256 amount) external",
    "function withdraw(uint256 amount) external",
    "function getVotes(address account) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function underlying() view returns (address)",
    "function decimals() view returns (uint8)",
  ];

  const fetchGovernanceData = async () => {
    if (!account || !isCorrectNetwork || !vgContract || !vgVotesContract) return;
    
    setLoading(true);
    try {
      const [
        vgBalance,
        vgvBalance,
        vgAllowance,
        votingPower,
        totalVotingPower
      ] = await Promise.all([
        vgContract.balanceOf(account),
        vgVotesContract.balanceOf(account),
        vgContract.allowance(account, CONTRACTS.VG_TOKEN_VOTES),
        vgVotesContract.getVotes(account),
        vgVotesContract.totalSupply(),
      ]);

      setGovernanceData({
        vgBalance: ethers.formatEther(vgBalance),
        vgvBalance: ethers.formatEther(vgvBalance),
        vgAllowance: ethers.formatEther(vgAllowance),
        votingPower: ethers.formatEther(votingPower),
        totalVotingPower: ethers.formatEther(totalVotingPower),
      });
    } catch (error) {
      console.error('Error fetching governance data:', error);
      toast.error('Ошибка загрузки данных governance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchGovernanceData();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchGovernanceData, 30000);
      return () => clearInterval(interval);
    }
  }, [account, isConnected, isCorrectNetwork]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const calculateVotingPower = () => {
    if (!governanceData) return '0%';
    const userPower = parseFloat(governanceData.votingPower);
    const totalPower = parseFloat(governanceData.totalVotingPower);
    if (totalPower === 0) return '0%';
    return `${((userPower / totalPower) * 100).toFixed(4)}%`;
  };

  const handleApprove = async () => {
    if (!vgContract || !wrapAmount) {
      toast.error('Введите количество VG токенов');
      return;
    }

    try {
      setTxLoading(true);
      const amount = ethers.parseEther(wrapAmount);
      
      toast.loading('Отправка approve...', { id: 'approve' });
      
      const tx = await vgContract.approve(CONTRACTS.VG_TOKEN_VOTES, amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'approve' });
      
      await tx.wait();
      
      toast.success('Approve выполнен успешно!', { id: 'approve' });
      
      // Обновляем данные
      fetchGovernanceData();
      
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(`Ошибка approve: ${error.message}`, { id: 'approve' });
    } finally {
      setTxLoading(false);
    }
  };

  const handleWrap = async () => {
    if (!vgVotesContract || !wrapAmount) {
      toast.error('Введите количество VG токенов');
      return;
    }

    try {
      setTxLoading(true);
      const amount = ethers.parseEther(wrapAmount);
      
      toast.loading('Отправка wrap транзакции...', { id: 'wrap' });
      
      const tx = await vgVotesContract.deposit(amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'wrap' });
      
      await tx.wait();
      
      toast.success('VG токены успешно завёрнуты в VGVotes!', { id: 'wrap' });
      
      // Обновляем данные и очищаем форму
      fetchGovernanceData();
      setWrapAmount('');
      
    } catch (error: any) {
      console.error('Wrap error:', error);
      toast.error(`Ошибка wrap: ${error.message}`, { id: 'wrap' });
    } finally {
      setTxLoading(false);
    }
  };

  const handleUnwrap = async () => {
    if (!vgVotesContract || !unwrapAmount) {
      toast.error('Введите количество VGV токенов');
      return;
    }

    try {
      setTxLoading(true);
      const amount = ethers.parseEther(unwrapAmount);
      
      toast.loading('Отправка unwrap транзакции...', { id: 'unwrap' });
      
      const tx = await vgVotesContract.withdraw(amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'unwrap' });
      
      await tx.wait();
      
      toast.success('VGV токены успешно развёрнуты в VG!', { id: 'unwrap' });
      
      // Обновляем данные и очищаем форму
      fetchGovernanceData();
      setUnwrapAmount('');
      
    } catch (error: any) {
      console.error('Unwrap error:', error);
      toast.error(`Ошибка unwrap: ${error.message}`, { id: 'unwrap' });
    } finally {
      setTxLoading(false);
    }
  };

  const setMaxWrap = () => {
    if (governanceData) {
      setWrapAmount(governanceData.vgBalance);
    }
  };

  const setMaxUnwrap = () => {
    if (governanceData) {
      setUnwrapAmount(governanceData.vgvBalance);
    }
  };

  if (!isConnected) {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-3xl font-bold mb-4">Подключите кошелёк</h2>
        <p className="text-gray-400">Для участия в governance необходимо подключить кошелёк</p>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-3xl font-bold mb-4 text-red-400">Неверная сеть</h2>
        <p className="text-gray-400">Переключитесь на BSC Testnet</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Governance
          </h1>
          <p className="text-xl text-gray-400 mt-2">
            Участвуйте в управлении экосистемой через голосование
          </p>
        </div>
        <button
          onClick={fetchGovernanceData}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">VG Balance</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(governanceData?.vgBalance || '0')}
              </p>
              <p className="text-xs text-gray-500">VirtualGold</p>
            </div>
            <Lock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">VGV Balance</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(governanceData?.vgvBalance || '0')}
              </p>
              <p className="text-xs text-gray-500">Voting Tokens</p>
            </div>
            <Vote className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Voting Power</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(governanceData?.votingPower || '0')}
              </p>
              <p className="text-xs text-gray-500">{calculateVotingPower()}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">VG Allowance</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(governanceData?.vgAllowance || '0')}
              </p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
            <Unlock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wrap/Unwrap Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <ArrowUpDown className="mr-3 text-purple-400" />
            VG ↔ VGVotes
          </h2>

          <div className="card">
            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('wrap')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'wrap'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Wrap VG
              </button>
              <button
                onClick={() => setActiveTab('unwrap')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'unwrap'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Unlock className="w-4 h-4 inline mr-2" />
                Unwrap VGV
              </button>
            </div>

            {/* Wrap Tab */}
            {activeTab === 'wrap' && (
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-sm text-purple-400 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Заблокируйте VG для получения голосующих токенов
                  </p>
                  <p className="text-xs text-gray-400">
                    1 VG = 1 VGV (1:1 обмен)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Количество VG токенов
                    <button
                      onClick={setMaxWrap}
                      className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      (MAX: {formatBalance(governanceData?.vgBalance || '0')})
                    </button>
                  </label>
                  <input
                    type="number"
                    value={wrapAmount}
                    onChange={(e) => setWrapAmount(e.target.value)}
                    placeholder="0.0"
                    className="input-field w-full"
                    step="any"
                  />
                </div>

                {governanceData && parseFloat(governanceData.vgAllowance) < parseFloat(wrapAmount || '0') ? (
                  <button
                    onClick={handleApprove}
                    disabled={!wrapAmount || txLoading}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <span>Approve VG Tokens</span>
                  </button>
                ) : (
                  <button
                    onClick={handleWrap}
                    disabled={!wrapAmount || txLoading || !governanceData || parseFloat(governanceData.vgBalance) < parseFloat(wrapAmount || '0')}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Wrap to VGVotes</span>
                  </button>
                )}
              </div>
            )}

            {/* Unwrap Tab */}
            {activeTab === 'unwrap' && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm text-green-400 mb-2">
                    <Unlock className="w-4 h-4 inline mr-1" />
                    Разблокируйте VGV для получения VG токенов
                  </p>
                  <p className="text-xs text-gray-400">
                    1 VGV = 1 VG (1:1 обмен)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Количество VGV токенов
                    <button
                      onClick={setMaxUnwrap}
                      className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      (MAX: {formatBalance(governanceData?.vgvBalance || '0')})
                    </button>
                  </label>
                  <input
                    type="number"
                    value={unwrapAmount}
                    onChange={(e) => setUnwrapAmount(e.target.value)}
                    placeholder="0.0"
                    className="input-field w-full"
                    step="any"
                  />
                </div>

                <button
                  onClick={handleUnwrap}
                  disabled={!unwrapAmount || txLoading || !governanceData || parseFloat(governanceData.vgvBalance) < parseFloat(unwrapAmount || '0')}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unwrap to VG</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Governance Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Info className="mr-3 text-blue-400" />
            Governance Info
          </h2>

          {/* Voting Power */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Ваша сила голоса</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-400 mb-2">
                  {formatBalance(governanceData?.votingPower || '0')}
                </p>
                <p className="text-sm text-gray-400">Голосующих токенов</p>
                <p className="text-lg font-medium text-gray-300 mt-1">
                  {calculateVotingPower()} от общей силы
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Общая сила голоса:</span>
                  <span className="font-medium">
                    {formatBalance(governanceData?.totalVotingPower || '0')} VGV
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(100, ((parseFloat(governanceData?.votingPower || '0') / parseFloat(governanceData?.totalVotingPower || '1')) * 100))}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ваша доля в governance
                </p>
              </div>
            </div>
          </div>

          {/* How Governance Works */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Как работает Governance</h3>
            
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-300">Заработайте VG токены</p>
                  <p>Стейкайте LP токены для получения VG наград</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-300">Заблокируйте VG</p>
                  <p>Заверните VG в VGVotes для получения силы голоса</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-300">Участвуйте в голосовании</p>
                  <p>Голосуйте за предложения и влияйте на развитие экосистемы</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Links */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Контракты</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">VG Token:</span>
                <a
                  href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono flex items-center space-x-1"
                >
                  <span>{`${CONTRACTS.VG_TOKEN.slice(0, 6)}...${CONTRACTS.VG_TOKEN.slice(-4)}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">VG Votes:</span>
                <a
                  href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VG_TOKEN_VOTES}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono flex items-center space-x-1"
                >
                  <span>{`${CONTRACTS.VG_TOKEN_VOTES.slice(0, 6)}...${CONTRACTS.VG_TOKEN_VOTES.slice(-4)}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Governor:</span>
                <a
                  href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.GOVERNOR}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono flex items-center space-x-1"
                >
                  <span>{`${CONTRACTS.GOVERNOR.slice(0, 6)}...${CONTRACTS.GOVERNOR.slice(-4)}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Timelock:</span>
                <a
                  href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.TIMELOCK}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono flex items-center space-x-1"
                >
                  <span>{`${CONTRACTS.TIMELOCK.slice(0, 6)}...${CONTRACTS.TIMELOCK.slice(-4)}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Governance Benefits */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Преимущества участия</h3>
            
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Vote className="w-4 h-4 text-purple-400" />
                <span>Влияние на развитие протокола</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-400" />
                <span>Участие в принятии решений</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span>Возможность разблокировки в любое время</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Governance; 