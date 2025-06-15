import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS } from '../constants/contracts';
import { toast } from 'react-hot-toast';
import { RefreshCw, Vote, Gem, ArrowRightLeft, Clock } from 'lucide-react';
import { useTokenData } from '../hooks/useTokenData';
import { log } from '../utils/logger';

interface VGConverterProps {
  className?: string;
}

const VGConverter: React.FC<VGConverterProps> = ({ className = '' }) => {
  const { account, signer, isConnected, vgContract, vgVotesContract } = useWeb3();
  
  // Use centralized token data hook
  const { balances, loading: balancesLoading, fetchTokenData } = useTokenData();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');

  const handleDeposit = async () => {
    if (!signer || !account || !vgContract || !vgVotesContract || !amount) {
      toast.error('Проверьте подключение и введите количество');
      return;
    }

    setLoading(true);

    try {
      const amountWei = ethers.parseEther(amount);

      // 1. Approve VG токены
      const vgContractWithSigner = vgContract.connect(signer);

      const allowance = await (vgContractWithSigner as any).allowance(account, CONTRACTS.VG_TOKEN_VOTES);
      if (allowance < amountWei) {
        toast.loading('Approving VG tokens...');
        const approveTx = await (vgContractWithSigner as any).approve(CONTRACTS.VG_TOKEN_VOTES, amountWei);
        await approveTx.wait();
      }

      // 2. Deposit to VGVotes
      const vgVotesWithSigner = vgVotesContract.connect(signer);

      toast.loading('Converting to VGVotes...');
      const depositTx = await (vgVotesWithSigner as any).deposit(amountWei);
      await depositTx.wait();

      toast.success('🎉 VG токены конвертированы в VGVotes!');
      setAmount('');

    } catch (error: any) {
      log.error('Failed to deposit VG', {
        component: 'VGConverter',
        function: 'handleDeposit',
        amount: amount,
        address: account
      }, error);
      toast.error('Ошибка депозита');
    } finally {
      setLoading(false);
      // Refresh balances after transaction
      setTimeout(() => {
        fetchTokenData(true);
      }, 2000);
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !account || !vgVotesContract || !amount) {
      toast.error('Проверьте подключение и введите количество');
      return;
    }

    setLoading(true);

    try {
      const amountWei = ethers.parseEther(amount);

      const vgVotesWithSigner = vgVotesContract.connect(signer);

      toast.loading('Converting back to VG...');
      const withdrawTx = await (vgVotesWithSigner as any).withdraw(amountWei);
      await withdrawTx.wait();

      toast.success('🎉 VGVotes конвертированы обратно в VG!');
      setAmount('');

    } catch (error: any) {
      log.error('Failed to withdraw VG', {
        component: 'VGConverter',
        function: 'handleWithdraw',
        amount: amount,
        address: account
      }, error);
      toast.error('Ошибка вывода');
    } finally {
      setLoading(false);
      // Refresh balances after transaction
      setTimeout(() => {
        fetchTokenData(true);
      }, 2000);
    }
  };

  const setMaxAmount = () => {
    const maxAmount = mode === 'deposit' ? balances.VG : balances.VGVotes;
    setAmount(maxAmount);
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
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
          <p className="text-xl font-bold text-purple-400">
            {balancesLoading ? (
              <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
            ) : (
              formatBalance(balances.VG || '0')
            )}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">VGVotes Balance</p>
          <p className="text-xl font-bold text-green-400">
            {balancesLoading ? (
              <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
            ) : (
              formatBalance(balances.VGVotes || '0')
            )}
          </p>
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