import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS, LP_POOL_CONFIG } from '../constants/contracts';
import { Zap, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface OneClickEstimate {
  vcAmount: string;
  bnbAmount: string;
  lpTokensToReceive: string;
  vgRewards: string;
  totalSteps: number;
}

const OneClickLPStaking: React.FC = () => {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    vcContract,
    lpContract,
    lpLockerContract,
    pancakeRouterContract,
    provider
  } = useWeb3();

  const [vcInput, setVcInput] = useState('');
  const [bnbInput, setBnbInput] = useState('');
  const [estimate, setEstimate] = useState<OneClickEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [vcApproved, setVcApproved] = useState(false);
  const [routerApproved, setRouterApproved] = useState(false);
  const [lockerApproved, setLockerApproved] = useState(false);

  const calculateEstimate = async () => {
    if (!vcInput || !bnbInput || !lpContract || !lpLockerContract) {
      setEstimate(null);
      return;
    }

    try {
      // Get pool info for LP calculation
      const reserves = await lpContract.getReserves();
      const totalSupply = await lpContract.totalSupply();
      
      const vcReserve = ethers.formatEther(reserves[0]);
      const bnbReserve = ethers.formatEther(reserves[1]);
      const totalSupplyFormatted = ethers.formatEther(totalSupply);

      // Calculate LP tokens (simplified)
      const vcShare = parseFloat(vcInput) / parseFloat(vcReserve);
      const bnbShare = parseFloat(bnbInput) / parseFloat(bnbReserve);
      const minShare = Math.min(vcShare, bnbShare);
      const lpTokensToReceive = minShare * parseFloat(totalSupplyFormatted);

      // Calculate VG rewards
      const lpAmount = ethers.parseEther(lpTokensToReceive.toString());
      const vgReward = await lpLockerContract.calculateVGReward(lpAmount);
      const vgRewards = ethers.formatEther(vgReward);

      setEstimate({
        vcAmount: vcInput,
        bnbAmount: bnbInput,
        lpTokensToReceive: lpTokensToReceive.toFixed(6),
        vgRewards: parseFloat(vgRewards).toFixed(6),
        totalSteps: 3, // Add Liquidity + Approve LP + Stake
      });
    } catch (error) {
      console.error('Error calculating estimate:', error);
      setEstimate(null);
    }
  };

  const checkApprovals = async () => {
    if (!account || !vcContract || !lpContract) return;

    try {
      // Check VC approval for Router
      const vcAllowance = await vcContract.allowance(account, CONTRACTS.PANCAKE_ROUTER);
      const vcNeeded = ethers.parseEther(vcInput || '0');
      setVcApproved(vcAllowance >= vcNeeded);

      // We'll check LP approval after adding liquidity
      setLockerApproved(false);
    } catch (error) {
      console.error('Error checking approvals:', error);
    }
  };

  const approveVC = async () => {
    if (!vcContract || !vcInput) return;

    try {
      const amount = ethers.parseEther(vcInput);
      const tx = await vcContract.approve(CONTRACTS.PANCAKE_ROUTER, amount);
      toast.loading('Approving VC tokens...', { id: 'approve-vc' });
      await tx.wait();
      toast.success('VC tokens approved!', { id: 'approve-vc' });
      setVcApproved(true);
    } catch (error: any) {
      console.error('Error approving VC:', error);
      toast.error('Failed to approve VC tokens', { id: 'approve-vc' });
    }
  };

  const executeOneClickStaking = async () => {
    if (!estimate || !pancakeRouterContract || !lpLockerContract || !account) return;

    setLoading(true);
    try {
      // Step 1: Add Liquidity
      toast.loading('Step 1/3: Adding liquidity...', { id: 'one-click' });
      
      const vcAmount = ethers.parseEther(estimate.vcAmount);
      const bnbAmount = ethers.parseEther(estimate.bnbAmount);
      const slippage = LP_POOL_CONFIG.DEFAULT_SLIPPAGE;
      
      const vcMin = vcAmount * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      const bnbMin = bnbAmount * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      const deadline = Math.floor(Date.now() / 1000) + (LP_POOL_CONFIG.DEADLINE_MINUTES * 60);

      const addLiquidityTx = await pancakeRouterContract.addLiquidityETH(
        CONTRACTS.VC_TOKEN,
        vcAmount,
        vcMin,
        bnbMin,
        account,
        deadline,
        { value: bnbAmount }
      );
      await addLiquidityTx.wait();

      // Step 2: Check and Approve LP tokens for staking
      toast.loading('Step 2/3: Approving LP tokens...', { id: 'one-click' });
      
      const lpBalance = await lpContract!.balanceOf(account);
      const approveTx = await lpContract!.approve(CONTRACTS.LP_LOCKER, lpBalance);
      await approveTx.wait();

      // Step 3: Stake LP tokens
      toast.loading('Step 3/3: Staking LP tokens...', { id: 'one-click' });
      
      const stakeTx = await lpLockerContract.earnVG(account, lpBalance);
      await stakeTx.wait();

      toast.success('One-click LP staking completed! 🎉', { id: 'one-click' });
      
      // Reset form
      setVcInput('');
      setBnbInput('');
      setEstimate(null);
    } catch (error: any) {
      console.error('Error in one-click staking:', error);
      toast.error('One-click staking failed', { id: 'one-click' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateEstimate();
    checkApprovals();
  }, [vcInput, bnbInput]);

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4 flex items-center justify-center">
          <Zap className="mr-2 text-yellow-400" />
          One-Click LP Staking
        </h3>
        <p className="text-gray-400">Connect wallet to use this feature</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <Zap className="mr-3 text-yellow-400" />
          One-Click LP Staking
        </h3>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1">
          <span className="text-yellow-400 text-xs font-medium">PREMIUM FEATURE</span>
        </div>
      </div>

      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="text-yellow-400 mt-0.5" size={16} />
          <div className="text-sm">
            <div className="font-medium text-yellow-400 mb-1">How it works:</div>
            <div className="text-gray-300 space-y-1">
              <div>1. Automatically creates LP position from your VC + BNB</div>
              <div>2. Immediately stakes the LP tokens to earn VG rewards</div>
              <div>3. All in one smooth transaction flow</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">VC Amount</label>
            <input
              type="number"
              value={vcInput}
              onChange={(e) => setVcInput(e.target.value)}
              placeholder="0.0"
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">BNB Amount</label>
            <input
              type="number"
              value={bnbInput}
              onChange={(e) => setBnbInput(e.target.value)}
              placeholder="0.0"
              className="input-field"
            />
          </div>
        </div>

        {/* Estimate Preview */}
        {estimate && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h5 className="font-semibold mb-3 text-green-400">Estimate Preview</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>LP Tokens to receive:</span>
                <span className="font-semibold">{estimate.lpTokensToReceive}</span>
              </div>
              <div className="flex justify-between">
                <span>VG Rewards (immediate):</span>
                <span className="font-semibold text-green-400">{estimate.vgRewards} VG</span>
              </div>
              <div className="flex justify-between">
                <span>Total steps:</span>
                <span className="font-semibold">{estimate.totalSteps}</span>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {estimate && parseFloat(estimate.vcAmount) > 1000 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle size={14} className="mr-2" />
              <span>Large amount detected - please verify all inputs carefully</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!vcApproved && vcInput && parseFloat(vcInput) > 0 && (
            <button onClick={approveVC} className="btn-secondary w-full">
              Approve VC Tokens
            </button>
          )}
          
          <button
            onClick={executeOneClickStaking}
            disabled={!estimate || !vcApproved || loading || parseFloat(vcInput) === 0 || parseFloat(bnbInput) === 0}
            className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 relative overflow-hidden"
          >
            <Zap size={18} className={loading ? 'animate-pulse' : ''} />
            <span>{loading ? 'Processing...' : 'Execute One-Click Staking'}</span>
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            )}
          </button>
        </div>

        <div className="text-xs text-gray-400 text-center">
          This feature combines multiple operations into a single flow for convenience
        </div>
      </div>
    </div>
  );
};

export default OneClickLPStaking; 