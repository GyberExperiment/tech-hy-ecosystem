import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS } from '../constants/contracts';
import { toast } from 'react-hot-toast';
import { RefreshCw, Vote, Gem, Lightbulb, ArrowRightLeft, Clock } from 'lucide-react';

interface VGConverterProps {
  className?: string;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)"
];

const VGVOTES_ABI = [
  "function deposit(uint256) external",
  "function withdraw(uint256) external",
  "function balanceOf(address) view returns (uint256)",
  "function underlying() view returns (address)"
];

const VGConverter: React.FC<VGConverterProps> = ({ className = '' }) => {
  const { account, signer, isConnected, getContract } = useWeb3();
  const [vgBalance, setVgBalance] = useState('0');
  const [vgVotesBalance, setVgVotesBalance] = useState('0');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => {
    if (isConnected && account) {
      loadBalances();
    }
  }, [isConnected, account]);

  const loadBalances = async () => {
    if (!account || !getContract) return;

    try {
      const vgContract = getContract(CONTRACTS.VG_TOKEN, ERC20_ABI);
      const vgVotesContract = getContract(CONTRACTS.VG_TOKEN_VOTES, ERC20_ABI);

      if (!vgContract || !vgVotesContract) return;

      const [vgBal, vgVotesBal] = await Promise.allSettled([
        vgContract.balanceOf(account),
        vgVotesContract.balanceOf(account)
      ]);

      setVgBalance(vgBal.status === 'fulfilled' ? ethers.formatEther(vgBal.value) : '0');
      setVgVotesBalance(vgVotesBal.status === 'fulfilled' ? ethers.formatEther(vgVotesBal.value) : '0');

    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const handleDeposit = async () => {
    if (!signer || !account || !getContract || !amount) {
      toast.error('Проверьте подключение и введите количество');
      return;
    }

    setLoading(true);

    try {
      const amountWei = ethers.parseEther(amount);

      // 1. Approve VG токены
      const vgContract = getContract(CONTRACTS.VG_TOKEN, ERC20_ABI);
      if (!vgContract) throw new Error('Failed to create VG contract');

      const vgContractWithSigner = vgContract.connect(signer);

      const allowance = await vgContractWithSigner.allowance(account, CONTRACTS.VG_TOKEN_VOTES);
      if (allowance < amountWei) {
        toast.loading('Approving VG tokens...');
        const approveTx = await vgContractWithSigner.approve(CONTRACTS.VG_TOKEN_VOTES, amountWei);
        await approveTx.wait();
      }

      // 2. Deposit to VGVotes
      const vgVotesContract = getContract(CONTRACTS.VG_TOKEN_VOTES, VGVOTES_ABI);
      if (!vgVotesContract) throw new Error('Failed to create VGVotes contract');

      const vgVotesWithSigner = vgVotesContract.connect(signer);

      toast.loading('Converting to VGVotes...');
      const depositTx = await vgVotesWithSigner.deposit(amountWei);
      await depositTx.wait();

      toast.success('🎉 VG токены конвертированы в VGVotes!');
      setAmount('');

    } catch (error: any) {
      console.error('Error depositing:', error);
      toast.error(error.message || 'Ошибка при конвертации');
    } finally {
      setLoading(false);
      loadBalances();
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !account || !getContract || !amount) {
      toast.error('Проверьте подключение и введите количество');
      return;
    }

    setLoading(true);

    try {
      const amountWei = ethers.parseEther(amount);

      const vgVotesContract = getContract(CONTRACTS.VG_TOKEN_VOTES, VGVOTES_ABI);
      if (!vgVotesContract) throw new Error('Failed to create VGVotes contract');

      const vgVotesWithSigner = vgVotesContract.connect(signer);

      toast.loading('Converting back to VG...');
      const withdrawTx = await vgVotesWithSigner.withdraw(amountWei);
      await withdrawTx.wait();

      toast.success('🎉 VGVotes конвертированы обратно в VG!');
      setAmount('');

    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast.error(error.message || 'Ошибка при конвертации');
    } finally {
      setLoading(false);
      loadBalances();
    }
  };

  const setMaxAmount = () => {
    const maxAmount = mode === 'deposit' ? vgBalance : vgVotesBalance;
    setAmount(maxAmount);
  };

  if (!isConnected) {
    return (
      <div className={`glass-panel p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">VG ↔ VGVotes Converter</h3>
          <p className="text-gray-300">Подключите кошелёк для конвертации токенов</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <RefreshCw className="w-6 h-6 text-blue-400" />
          <h3 className="text-2xl font-bold text-white">VG ↔ VGVotes</h3>
        </div>
        <p className="text-gray-300">
          Конвертируйте VG токены в VGVotes для участия в голосовании DAO
        </p>
      </div>

      {/* Балансы */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-400">VG Balance</p>
          <p className="text-xl font-bold text-purple-400">{parseFloat(vgBalance).toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">VGVotes Balance</p>
          <p className="text-xl font-bold text-green-400">{parseFloat(vgVotesBalance).toFixed(2)}</p>
        </div>
      </div>

      {/* Режим переключения */}
      <div className="flex rounded-lg bg-black/30 p-1 mb-4">
        <button
          onClick={() => setMode('deposit')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all text-slate-200 ${
            mode === 'deposit'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          VG → VGVotes
        </button>
        <button
          onClick={() => setMode('withdraw')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all text-slate-200 ${
            mode === 'withdraw'
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          VGVotes → VG
        </button>
      </div>

      {/* Ввод количества */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">
              Amount {mode === 'deposit' ? 'VG' : 'VGVotes'}
            </label>
            <button
              onClick={setMaxAmount}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              MAX
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg text-white"
            placeholder="0.0"
            step="0.01"
          />
        </div>

        <button
          onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className={`w-full py-4 font-bold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
            mode === 'deposit'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
          }`}
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : mode === 'deposit' ? (
            <>
              <Vote className="w-4 h-4" />
              <span>Convert to VGVotes</span>
            </>
          ) : (
            <>
              <Gem className="w-4 h-4" />
              <span>Convert to VG</span>
            </>
          )}
        </button>
      </div>

      {/* Информация */}
      <div className="mt-6 space-y-2 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center space-x-2">
          <ArrowRightLeft className="w-4 h-4" />
          <span>Соотношение конвертации: 1:1</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Vote className="w-4 h-4" />
          <span>VGVotes нужны для участия в голосовании DAO</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Конвертация в обе стороны доступна в любое время</span>
        </div>
      </div>
    </div>
  );
};

export default VGConverter; 