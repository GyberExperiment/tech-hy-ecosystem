import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, BSC_TESTNET } from '../constants/contracts';
import { TrendingUp, Coins, Gift, Info, ExternalLink, RefreshCw, AlertTriangle, Lock, Unlock, Users, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import LPPoolManager from '../components/LPPoolManager';
import OneClickLPStaking from '../components/OneClickLPStaking';

interface StakingData {
  lpBalance: string;
  lpAllowance: string;
  vgBalance: string;
  pendingRewards: string;
  lpTokenInfo: {
    totalSupply: string;
    reserves: { token0: string; token1: string };
    token0: string;
    token1: string;
  };
}

const LPStaking: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    lpContract,
    vgContract,
    lpLockerContract
  } = useWeb3();

  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // Extended LP Locker ABI
  const LP_LOCKER_ABI = [
    "function earnVG(address user, uint256 lpAmount) external",
    "function calculateVGReward(uint256 lpAmount) view returns (uint256)",
    "function getUserRewards(address user) view returns (uint256)",
    "function claimRewards() external",
    "function owner() view returns (address)",
    "function stakingEnabled() view returns (bool)",
    "function rewardRate() view returns (uint256)",
    "function totalStaked() view returns (uint256)",
  ];

  const LP_TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function totalSupply() view returns (uint256)",
    "function getReserves() view returns (uint112, uint112, uint32)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function decimals() view returns (uint8)",
  ];

  const fetchStakingData = async () => {
    if (!account || !isCorrectNetwork || !lpContract || !vgContract || !lpLockerContract) return;
    
    setLoading(true);
    try {
      const [
        lpBalance,
        lpAllowance,
        vgBalance,
        pendingRewards,
        totalSupply,
        reserves,
        token0,
        token1
      ] = await Promise.all([
        lpContract.balanceOf(account),
        lpContract.allowance(account, CONTRACTS.LP_LOCKER),
        vgContract.balanceOf(account),
        lpLockerContract.getUserRewards(account),
        lpContract.totalSupply(),
        lpContract.getReserves(),
        lpContract.token0(),
        lpContract.token1(),
      ]);

      setStakingData({
        lpBalance: ethers.formatEther(lpBalance),
        lpAllowance: ethers.formatEther(lpAllowance),
        vgBalance: ethers.formatEther(vgBalance),
        pendingRewards: ethers.formatEther(pendingRewards),
        lpTokenInfo: {
          totalSupply: ethers.formatEther(totalSupply),
          reserves: {
            token0: ethers.formatEther(reserves[0]),
            token1: ethers.formatEther(reserves[1])
          },
          token0,
          token1,
        }
      });
    } catch (error) {
      console.error('Error fetching staking data:', error);
      toast.error('Ошибка загрузки данных стейкинга');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchStakingData();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchStakingData, 30000);
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

  const handleApprove = async () => {
    if (!lpContract || !stakeAmount) {
      toast.error('Введите количество LP токенов');
      return;
    }

    try {
      setTxLoading(true);
      const amount = ethers.parseEther(stakeAmount);
      
      toast.loading('Отправка approve...', { id: 'approve' });
      
      const tx = await lpContract.approve(CONTRACTS.LP_LOCKER, amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'approve' });
      
      await tx.wait();
      
      toast.success('Approve выполнен успешно!', { id: 'approve' });
      
      // Обновляем данные
      fetchStakingData();
      
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(`Ошибка approve: ${error.message}`, { id: 'approve' });
    } finally {
      setTxLoading(false);
    }
  };

  const handleStake = async () => {
    if (!lpLockerContract || !stakeAmount) {
      toast.error('Введите количество LP токенов');
      return;
    }

    try {
      setTxLoading(true);
      const amount = ethers.parseEther(stakeAmount);
      
      toast.loading('Отправка стейкинг транзакции...', { id: 'stake' });
      
      const tx = await lpLockerContract.earnVG(account, amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'stake' });
      
      await tx.wait();
      
      toast.success('LP токены застейканы успешно!', { id: 'stake' });
      
      // Обновляем данные и очищаем форму
      fetchStakingData();
      setStakeAmount('');
      
    } catch (error: any) {
      console.error('Stake error:', error);
      toast.error(`Ошибка стейкинга: ${error.message}`, { id: 'stake' });
    } finally {
      setTxLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!lpLockerContract) return;

    try {
      setTxLoading(true);
      
      toast.loading('Отправка claim транзакции...', { id: 'claim' });
      
      const tx = await lpLockerContract.claimRewards();
      
      toast.loading('Ожидание подтверждения...', { id: 'claim' });
      
      await tx.wait();
      
      toast.success('Награды получены!', { id: 'claim' });
      
      // Обновляем данные
      fetchStakingData();
      
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(`Ошибка получения наград: ${error.message}`, { id: 'claim' });
    } finally {
      setTxLoading(false);
    }
  };

  const calculateReward = async () => {
    if (!lpLockerContract || !stakeAmount) {
      setRewardAmount('');
      return;
    }

    try {
      const amount = ethers.parseEther(stakeAmount);
      const reward = await lpLockerContract.calculateVGReward(amount);
      setRewardAmount(ethers.formatEther(reward));
    } catch (error) {
      console.error('Error calculating reward:', error);
      setRewardAmount('');
    }
  };

  useEffect(() => {
    if (stakeAmount) {
      calculateReward();
    } else {
      setRewardAmount('');
    }
  }, [stakeAmount]);

  const setMaxStake = () => {
    if (stakingData) {
      setStakeAmount(stakingData.lpBalance);
    }
  };

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            LP Token Staking
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Connect your wallet to stake LP tokens and earn VG rewards
          </p>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold mb-4 text-red-400">
            Wrong Network Detected
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Please switch to BSC Testnet to access LP staking
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          LP Token Staking
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Stake your VC/BNB LP tokens to earn VG rewards. Create LP tokens directly in our DApp or bring existing ones.
        </p>
      </div>

      {/* LP Pool Management Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Calculator className="mr-3 text-blue-400" />
          LP Token Management
        </h2>
        
        {/* Grid layout for LP management components */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <LPPoolManager />
          <OneClickLPStaking />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">LP Balance</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(stakingData?.lpBalance || '0')}
              </p>
              <p className="text-xs text-gray-500">VC-TBNB LP</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">VG Balance</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(stakingData?.vgBalance || '0')}
              </p>
              <p className="text-xs text-gray-500">VirtualGold</p>
            </div>
            <Coins className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Rewards</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(stakingData?.pendingRewards || '0')}
              </p>
              <p className="text-xs text-gray-500">VG Tokens</p>
            </div>
            <Gift className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">LP Allowance</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatBalance(stakingData?.lpAllowance || '0')}
              </p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
            <Info className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Staking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staking Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <TrendingUp className="mr-3 text-green-400" />
            Stake LP Tokens
          </h2>

          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Количество LP токенов
                  <button
                    onClick={setMaxStake}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    (MAX: {formatBalance(stakingData?.lpBalance || '0')})
                  </button>
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  className="input-field w-full"
                  step="any"
                />
              </div>

              {rewardAmount && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-300">Ожидаемая награда:</span>
                    <span className="font-bold text-green-400">{formatBalance(rewardAmount)} VG</span>
                  </div>
                </div>
              )}

              {stakingData && parseFloat(stakingData.lpAllowance) < parseFloat(stakeAmount || '0') ? (
                <button
                  onClick={handleApprove}
                  disabled={!stakeAmount || txLoading}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <span>Approve LP Tokens</span>
                </button>
              ) : (
                <button
                  onClick={handleStake}
                  disabled={!stakeAmount || txLoading || !stakingData || parseFloat(stakingData.lpBalance) < parseFloat(stakeAmount || '0')}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Stake LP Tokens</span>
                </button>
              )}

              {stakingData && parseFloat(stakingData.lpBalance) === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-yellow-400">
                      У вас нет LP токенов. Создайте ликвидность на PancakeSwap.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Claim Rewards */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Gift className="mr-3 text-purple-400" />
              Claim Rewards
            </h3>

            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Доступно для получения</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {formatBalance(stakingData?.pendingRewards || '0')} VG
                  </p>
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={txLoading || !stakingData || parseFloat(stakingData.pendingRewards) === 0}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Gift className="w-4 h-4" />
                <span>Claim Rewards</span>
              </button>
            </div>
          </div>
        </div>

        {/* LP Token Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Info className="mr-3 text-blue-400" />
            Pool Information
          </h2>

          <div className="card">
            <h3 className="text-xl font-bold mb-4">VC/TBNB LP Token</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Supply:</span>
                <span className="font-medium">
                  {formatBalance(stakingData?.lpTokenInfo.totalSupply || '0')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">VC Reserve:</span>
                <span className="font-medium">
                  {formatBalance(stakingData?.lpTokenInfo.reserves.token0 || '0')} VC
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">TBNB Reserve:</span>
                <span className="font-medium">
                  {formatBalance(stakingData?.lpTokenInfo.reserves.token1 || '0')} TBNB
                </span>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">LP Token:</span>
                  <a
                    href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.LP_TOKEN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center space-x-1"
                  >
                    <span>{`${CONTRACTS.LP_TOKEN.slice(0, 6)}...${CONTRACTS.LP_TOKEN.slice(-4)}`}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">LP Locker:</span>
                  <a
                    href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.LP_LOCKER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center space-x-1"
                  >
                    <span>{`${CONTRACTS.LP_LOCKER.slice(0, 6)}...${CONTRACTS.LP_LOCKER.slice(-4)}`}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Как это работает</h3>
            
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-300">Добавьте ликвидность</p>
                  <p>Создайте VC/TBNB пару на PancakeSwap и получите LP токены</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-300">Стейкайте LP токены</p>
                  <p>Застейкайте LP токены в нашем контракте для получения VG наград</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-300">Получайте награды</p>
                  <p>Забирайте накопленные VG токены в любое время</p>
                </div>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Полезные ссылки</h3>
            
            <div className="space-y-3">
              <a
                href={`https://pancakeswap.finance/add/${CONTRACTS.VC_TOKEN}/BNB`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full btn-secondary text-center"
              >
                Добавить ликвидность на PancakeSwap
              </a>
              
              <a
                href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.LP_LOCKER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full btn-secondary text-center"
              >
                Просмотреть контракт LP Locker
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="card">
        {/* ... existing rewards section ... */}
      </div>
    </div>
  );
};

export default LPStaking; 