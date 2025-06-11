import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS, LP_POOL_CONFIG, TOKEN_INFO } from '../constants/contracts';
import { Calculator, Plus, Minus, AlertTriangle, Info, RefreshCw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { PoolInfoSkeleton, InputFormSkeleton } from './LoadingSkeleton';

interface PoolInfo {
  reserve0: string;
  reserve1: string;
  token0: string;
  token1: string;
  totalSupply: string;
  userLPBalance: string;
  userVCBalance: string;
  userBNBBalance: string;
  vcPrice: string;
  bnbPrice: string;
}

interface LiquidityCalculation {
  vcAmount: string;
  bnbAmount: string;
  lpTokensToReceive: string;
  priceImpact: number;
  shareOfPool: number;
}

const LPPoolManager: React.FC = () => {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    vcContract,
    lpContract,
    pancakeRouterContract,
    wbnbContract,
    provider,
    pancakeFactoryContract
  } = useWeb3();

  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  
  // Add liquidity state
  const [vcInput, setVcInput] = useState('');
  const [bnbInput, setBnbInput] = useState('');
  const [slippage, setSlippage] = useState(LP_POOL_CONFIG.DEFAULT_SLIPPAGE);
  const [calculation, setCalculation] = useState<LiquidityCalculation | null>(null);
  
  // Remove liquidity state
  const [lpTokensInput, setLpTokensInput] = useState('');
  const [removePercentage, setRemovePercentage] = useState(25);

  // Approvals state
  const [vcApproved, setVcApproved] = useState(false);
  const [bnbApproved, setBnbApproved] = useState(false);
  const [lpApproved, setLpApproved] = useState(false);

  const fetchPoolInfo = async () => {
    if (!account || !isConnected || !lpContract || !vcContract || !provider || !pancakeFactoryContract) return;
    
    try {
      setLoading(true);
      
      // Get LP pair address from PancakeSwap factory
      const pairAddress = await pancakeFactoryContract.getPair(CONTRACTS.VC_TOKEN, CONTRACTS.WBNB);
      if (pairAddress === ethers.ZeroAddress) {
        throw new Error('LP пул не найден');
      }
      
      // Create LP pair contract for getReserves calls
      const PANCAKE_PAIR_ABI = [
        "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
        "function token0() external view returns (address)",
        "function token1() external view returns (address)",
        "function totalSupply() external view returns (uint256)",
      ];
      const lpPairContract = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, provider);
      
      // Get pool reserves from pair contract
      const reserves = await lpPairContract.getReserves();
      const token0 = await lpPairContract.token0();
      const token1 = await lpPairContract.token1();
      const totalSupply = await lpPairContract.totalSupply();
      
      // Get user balances
      const userLPBalance = await lpContract.balanceOf(account);
      const userVCBalance = await vcContract.balanceOf(account);
      const userBNBBalance = await provider.getBalance(account);

      // Calculate accurate prices accounting for token order
      const reserve0 = ethers.formatEther(reserves[0]);
      const reserve1 = ethers.formatEther(reserves[1]);
      
      // Determine which token is which based on contract addresses
      const isVC0 = token0.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase();
      const vcReserve = parseFloat(isVC0 ? reserve0 : reserve1);
      const bnbReserve = parseFloat(isVC0 ? reserve1 : reserve0);
      
      // Calculate exact prices: VC price = BNB_reserve / VC_reserve, BNB price = VC_reserve / BNB_reserve
      const vcPriceInBNB = bnbReserve / vcReserve;
      const bnbPriceInVC = vcReserve / bnbReserve;

      setPoolInfo({
        reserve0,
        reserve1,
        token0,
        token1,
        totalSupply: ethers.formatEther(totalSupply),
        userLPBalance: ethers.formatEther(userLPBalance),
        userVCBalance: ethers.formatEther(userVCBalance),
        userBNBBalance: ethers.formatEther(userBNBBalance),
        vcPrice: vcPriceInBNB.toFixed(8),
        bnbPrice: bnbPriceInVC.toFixed(8),
      });
    } catch (error) {
      console.error('Error fetching pool info:', error);
      toast.error('Ошибка загрузки информации о пуле');
    } finally {
      setLoading(false);
    }
  };

  const calculateLiquidity = async () => {
    if (!poolInfo || (!vcInput && !bnbInput)) {
      setCalculation(null);
      return;
    }

    try {
      const vcAmount = vcInput || '0';
      const bnbAmount = bnbInput || '0';
      
      // Get current reserves (accounting for token order)
      const isVC0 = poolInfo.token0.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase();
      const vcReserve = parseFloat(isVC0 ? poolInfo.reserve0 : poolInfo.reserve1);
      const bnbReserve = parseFloat(isVC0 ? poolInfo.reserve1 : poolInfo.reserve0);
      const totalSupply = parseFloat(poolInfo.totalSupply);
      
      let finalVcAmount = parseFloat(vcAmount);
      let finalBnbAmount = parseFloat(bnbAmount);
      
      // If user entered VC amount, calculate required BNB using exact reserve ratio
      if (vcInput && !bnbInput) {
        finalBnbAmount = (finalVcAmount * bnbReserve) / vcReserve;
        setBnbInput(finalBnbAmount.toFixed(8));
      }
      
      // If user entered BNB amount, calculate required VC using exact reserve ratio
      if (bnbInput && !vcInput) {
        finalVcAmount = (finalBnbAmount * vcReserve) / bnbReserve;
        setVcInput(finalVcAmount.toFixed(8));
      }

      // Calculate LP tokens using PancakeSwap formula: min(vcAmount/vcReserve, bnbAmount/bnbReserve) * totalSupply
      const vcShare = finalVcAmount / vcReserve;
      const bnbShare = finalBnbAmount / bnbReserve;
      const minShare = Math.min(vcShare, bnbShare);
      
      const lpTokensToReceive = minShare * totalSupply;
      
      // Calculate share of pool after deposit
      const newTotalSupply = totalSupply + lpTokensToReceive;
      const shareOfPool = (lpTokensToReceive / newTotalSupply) * 100;
      
      // Calculate price impact using constant product formula
      // Price impact = |1 - (new_price / old_price)| * 100
      const oldPrice = bnbReserve / vcReserve;
      const newVcReserve = vcReserve + finalVcAmount;
      const newBnbReserve = bnbReserve + finalBnbAmount;
      const newPrice = newBnbReserve / newVcReserve;
      const priceImpact = Math.abs(1 - (newPrice / oldPrice)) * 100;

      setCalculation({
        vcAmount: finalVcAmount.toFixed(8),
        bnbAmount: finalBnbAmount.toFixed(8),
        lpTokensToReceive: lpTokensToReceive.toFixed(8),
        priceImpact,
        shareOfPool,
      });
    } catch (error) {
      console.error('Error calculating liquidity:', error);
    }
  };

  const checkApprovals = async () => {
    if (!account || !vcContract || !pancakeRouterContract) return;

    try {
      const vcAllowance = await vcContract.allowance(account, CONTRACTS.PANCAKE_ROUTER);
      const vcApprovalNeeded = ethers.parseEther(vcInput || '0');
      setVcApproved(vcAllowance >= vcApprovalNeeded);

      // BNB doesn't need approval, but we track it for UI consistency
      setBnbApproved(true);

      if (activeTab === 'remove' && lpContract) {
        const lpAllowance = await lpContract.allowance(account, CONTRACTS.PANCAKE_ROUTER);
        const lpApprovalNeeded = ethers.parseEther(lpTokensInput || '0');
        setLpApproved(lpAllowance >= lpApprovalNeeded);
      }
    } catch (error) {
      console.error('Error checking approvals:', error);
    }
  };

  const approveVC = async () => {
    if (!vcContract || !vcInput) return;

    try {
      const amount = ethers.parseEther(vcInput);
      const tx = await vcContract.approve(CONTRACTS.PANCAKE_ROUTER, amount);
      toast.loading('Подтверждение разрешения VC...', { id: 'approve-vc' });
      await tx.wait();
      toast.success('VC токены разрешены!', { id: 'approve-vc' });
      setVcApproved(true);
    } catch (error: any) {
      console.error('Error approving VC:', error);
      toast.error('Ошибка разрешения VC токенов', { id: 'approve-vc' });
    }
  };

  const approveLP = async () => {
    if (!lpContract || !lpTokensInput) return;

    try {
      const amount = ethers.parseEther(lpTokensInput);
      const tx = await lpContract.approve(CONTRACTS.PANCAKE_ROUTER, amount);
      toast.loading('Подтверждение разрешения LP...', { id: 'approve-lp' });
      await tx.wait();
      toast.success('LP токены разрешены!', { id: 'approve-lp' });
      setLpApproved(true);
    } catch (error: any) {
      console.error('Error approving LP:', error);
      toast.error('Ошибка разрешения LP токенов', { id: 'approve-lp' });
    }
  };

  const addLiquidity = async () => {
    if (!pancakeRouterContract || !calculation || !account) return;

    try {
      const vcAmount = ethers.parseEther(calculation.vcAmount);
      const bnbAmount = ethers.parseEther(calculation.bnbAmount);
      
      // Calculate minimum amounts with slippage
      const vcMin = vcAmount * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      const bnbMin = bnbAmount * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      
      // Deadline (20 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + (LP_POOL_CONFIG.DEADLINE_MINUTES * 60);

      const tx = await pancakeRouterContract.addLiquidityETH(
        CONTRACTS.VC_TOKEN,
        vcAmount,
        vcMin,
        bnbMin,
        account,
        deadline,
        { value: bnbAmount }
      );

      toast.loading('Добавление ликвидности...', { id: 'add-liquidity' });
      await tx.wait();
      toast.success('Ликвидность добавлена!', { id: 'add-liquidity' });
      
      // Reset form and refresh data
      setVcInput('');
      setBnbInput('');
      setCalculation(null);
      fetchPoolInfo();
    } catch (error: any) {
      console.error('Error adding liquidity:', error);
      toast.error('Ошибка добавления ликвидности', { id: 'add-liquidity' });
    }
  };

  const removeLiquidity = async () => {
    if (!pancakeRouterContract || !lpTokensInput || !account || !poolInfo) return;

    try {
      const lpAmount = ethers.parseEther(lpTokensInput);
      
      // Calculate expected amounts
      const lpShare = parseFloat(lpTokensInput) / parseFloat(poolInfo.totalSupply);
      const vcExpected = lpShare * parseFloat(poolInfo.reserve0);
      const bnbExpected = lpShare * parseFloat(poolInfo.reserve1);
      
      // Apply slippage
      const vcMin = ethers.parseEther((vcExpected * (100 - slippage) / 100).toFixed(18));
      const bnbMin = ethers.parseEther((bnbExpected * (100 - slippage) / 100).toFixed(18));
      
      const deadline = Math.floor(Date.now() / 1000) + (LP_POOL_CONFIG.DEADLINE_MINUTES * 60);

      const tx = await pancakeRouterContract.removeLiquidityETH(
        CONTRACTS.VC_TOKEN,
        lpAmount,
        vcMin,
        bnbMin,
        account,
        deadline
      );

      toast.loading('Удаление ликвидности...', { id: 'remove-liquidity' });
      await tx.wait();
      toast.success('Ликвидность удалена!', { id: 'remove-liquidity' });
      
      // Reset form and refresh data
      setLpTokensInput('');
      setRemovePercentage(25);
      fetchPoolInfo();
    } catch (error: any) {
      console.error('Error removing liquidity:', error);
      toast.error('Ошибка удаления ликвидности', { id: 'remove-liquidity' });
    }
  };

  const setMaxVC = () => {
    if (poolInfo) {
      setVcInput(poolInfo.userVCBalance);
    }
  };

  const setMaxBNB = () => {
    if (poolInfo) {
      // Leave some BNB for gas
      const maxBNB = Math.max(0, parseFloat(poolInfo.userBNBBalance) - 0.01);
      setBnbInput(maxBNB.toFixed(6));
    }
  };

  const setRemovePercentageAmount = (percentage: number) => {
    if (poolInfo) {
      const amount = (parseFloat(poolInfo.userLPBalance) * percentage / 100).toFixed(6);
      setLpTokensInput(amount);
      setRemovePercentage(percentage);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchPoolInfo();
    }
  }, [account, isConnected, isCorrectNetwork]);

  useEffect(() => {
    calculateLiquidity();
    checkApprovals();
  }, [vcInput, bnbInput, poolInfo]);

  useEffect(() => {
    checkApprovals();
  }, [lpTokensInput, activeTab]);

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">LP Pool Management</h3>
        <p className="text-gray-400">Подключите кошелёк для управления LP позициями</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center">
            <Calculator className="mr-3 text-blue-400" />
            LP Pool Management
          </h3>
          <button
            onClick={fetchPoolInfo}
            disabled={loading}
            className="btn-secondary text-sm flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
        </div>

        {/* Pool Information */}
        <div className="mb-8">
          {loading && !poolInfo ? (
            <PoolInfoSkeleton />
          ) : poolInfo ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Информация о пуле</h3>
                <button
                  onClick={fetchPoolInfo}
                  className="btn-secondary p-2"
                  disabled={loading}
                >
                  <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">VC Резерв:</span>
                    <span className="font-mono">{parseFloat(poolInfo.reserve0).toLocaleString()} VC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BNB Резерв:</span>
                    <span className="font-mono">{parseFloat(poolInfo.reserve1).toLocaleString()} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Общее предложение LP:</span>
                    <span className="font-mono">{parseFloat(poolInfo.totalSupply).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Цена VC:</span>
                    <span className="font-mono">{poolInfo.vcPrice} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Цена BNB:</span>
                    <span className="font-mono">{poolInfo.bnbPrice} VC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ваши LP токены:</span>
                    <span className="font-mono">{parseFloat(poolInfo.userLPBalance).toFixed(6)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <span className="text-blue-400 font-semibold">Ваш VC баланс:</span>
                  <div className="font-mono">{parseFloat(poolInfo.userVCBalance).toLocaleString()} VC</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <span className="text-green-400 font-semibold">Ваш BNB баланс:</span>
                  <div className="font-mono">{parseFloat(poolInfo.userBNBBalance).toFixed(6)} BNB</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center text-gray-400">
              <AlertTriangle className="mx-auto mb-2" size={48} />
              <p>Не удалось загрузить информацию о пуле</p>
              <button onClick={fetchPoolInfo} className="btn-primary mt-4">
                Попробовать снова
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'add'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus size={16} />
            <span>Добавить ликвидность</span>
          </button>
          <button
            onClick={() => setActiveTab('remove')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'remove'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Minus size={16} />
            <span>Удалить ликвидность</span>
          </button>
        </div>

        {/* Add Liquidity Tab */}
        {activeTab === 'add' && (
          <div className="space-y-4">
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">VC Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={vcInput}
                    onChange={(e) => setVcInput(e.target.value)}
                    placeholder="0.0"
                    className="input-field pr-16"
                  />
                  <button
                    onClick={setMaxVC}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm hover:text-blue-300"
                  >
                    MAX
                  </button>
                </div>
                {poolInfo && (
                  <div className="text-xs text-gray-400 mt-1">
                    Balance: {parseFloat(poolInfo.userVCBalance).toFixed(4)} VC
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">BNB Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={bnbInput}
                    onChange={(e) => setBnbInput(e.target.value)}
                    placeholder="0.0"
                    className="input-field pr-16"
                  />
                  <button
                    onClick={setMaxBNB}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm hover:text-blue-300"
                  >
                    MAX
                  </button>
                </div>
                {poolInfo && (
                  <div className="text-xs text-gray-400 mt-1">
                    Balance: {parseFloat(poolInfo.userBNBBalance).toFixed(4)} BNB
                  </div>
                )}
              </div>
            </div>

            {/* Slippage Settings */}
            <div>
              <label className="block text-sm font-medium mb-2">Slippage Tolerance</label>
              <div className="flex space-x-2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded text-sm ${
                      slippage === value
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  step="0.1"
                  min="0.1"
                  max="50"
                  className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                />
              </div>
            </div>

            {/* Calculation Preview */}
            {calculation && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h5 className="font-semibold mb-2 flex items-center">
                  <Info className="mr-2" size={16} />
                  Preview
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>LP Tokens to receive:</span>
                    <span className="font-semibold">{calculation.lpTokensToReceive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Share of pool:</span>
                    <span className="font-semibold">{calculation.shareOfPool.toFixed(4)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price impact:</span>
                    <span className={`font-semibold ${calculation.priceImpact > 2 ? 'text-red-400' : 'text-green-400'}`}>
                      {calculation.priceImpact.toFixed(2)}%
                    </span>
                  </div>
                </div>
                {calculation.priceImpact > 2 && (
                  <div className="flex items-center mt-2 text-red-400 text-xs">
                    <AlertTriangle size={12} className="mr-1" />
                    High price impact
                  </div>
                )}
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
                onClick={addLiquidity}
                disabled={!calculation || !vcApproved || parseFloat(vcInput) === 0 || parseFloat(bnbInput) === 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Liquidity</span>
              </button>
            </div>
          </div>
        )}

        {/* Remove Liquidity Tab */}
        {activeTab === 'remove' && (
          <div className="space-y-4">
            {/* Percentage Buttons */}
            <div>
              <label className="block text-sm font-medium mb-2">Remove Amount</label>
              <div className="flex space-x-2 mb-3">
                {[25, 50, 75, 100].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setRemovePercentageAmount(percentage)}
                    className={`px-3 py-1 rounded text-sm ${
                      removePercentage === percentage
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
              
              <input
                type="number"
                value={lpTokensInput}
                onChange={(e) => setLpTokensInput(e.target.value)}
                placeholder="0.0"
                className="input-field"
              />
              {poolInfo && (
                <div className="text-xs text-gray-400 mt-1">
                  Available: {parseFloat(poolInfo.userLPBalance).toFixed(4)} LP Tokens
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!lpApproved && lpTokensInput && parseFloat(lpTokensInput) > 0 && (
                <button onClick={approveLP} className="btn-secondary w-full">
                  Approve LP Tokens
                </button>
              )}
              
              <button
                onClick={removeLiquidity}
                disabled={!lpApproved || parseFloat(lpTokensInput) === 0}
                className="btn-danger w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Minus size={18} />
                <span>Remove Liquidity</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LPPoolManager; 