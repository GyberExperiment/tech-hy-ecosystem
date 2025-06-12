import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS, LP_POOL_CONFIG, TOKEN_INFO, BSC_TESTNET } from '../constants/contracts';
import { Calculator, Plus, Minus, AlertTriangle, Info, RefreshCw, Zap, BarChart3, TrendingUp, DollarSign, Droplets, ExternalLink, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { PoolInfoSkeleton, InputFormSkeleton } from './LoadingSkeleton';
import { ContractStatus } from './ContractStatus';

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
    pancakeFactoryContract,
    connectWallet,
    switchToTestnet
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
      
      // Get LP pair address from PancakeSwap factory with enhanced error handling
      let pairAddress: string;
      try {
        console.log('Fetching pair address for:', CONTRACTS.VC_TOKEN, 'and', CONTRACTS.WBNB);
        console.log('Using factory:', CONTRACTS.PANCAKE_FACTORY);
        
        // First verify factory contract exists
        const factoryCode = await provider.getCode(CONTRACTS.PANCAKE_FACTORY);
        if (factoryCode === '0x') {
          throw new Error('PancakeSwap Factory контракт не найден по адресу: ' + CONTRACTS.PANCAKE_FACTORY);
        }
        
        pairAddress = await pancakeFactoryContract.getPair(CONTRACTS.VC_TOKEN, CONTRACTS.WBNB);
        
        if (!pairAddress || pairAddress === ethers.ZeroAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
          console.warn('LP пул не найден или не создан');
          toast.error('LP пул не найден. Возможно, ликвидность ещё не добавлена.');
          
          // Set minimal fallback data
          setPoolInfo({
            reserve0: '0',
            reserve1: '0',
            token0: CONTRACTS.VC_TOKEN,
            token1: CONTRACTS.WBNB,
            totalSupply: '0',
            userLPBalance: '0',
            userVCBalance: '0',
            userBNBBalance: '0',
            vcPrice: '0',
            bnbPrice: '0',
          });
          return;
        }
        
        console.log('Found LP pair at:', pairAddress);
      } catch (error: any) {
        console.error('Error getting pair address:', error);
        
        // Enhanced error handling based on error type
        if (error.message.includes('could not decode result data')) {
          toast.error('Ошибка декодирования данных Factory. Возможно неправильный адрес контракта.');
        } else if (error.message.includes('contract not found')) {
          toast.error('Factory контракт не найден. Проверьте адрес.');
        } else {
          toast.error('Ошибка получения адреса LP пула. Проверьте подключение к сети.');
        }
        
        // Set fallback data and exit
        setPoolInfo({
          reserve0: '0',
          reserve1: '0',
          token0: CONTRACTS.VC_TOKEN,
          token1: CONTRACTS.WBNB,
          totalSupply: '0',
          userLPBalance: '0',
          userVCBalance: '0',
          userBNBBalance: '0',
          vcPrice: '0',
          bnbPrice: '0',
        });
        return;
      }
      
      // Create LP pair contract for getReserves calls
      const PANCAKE_PAIR_ABI = [
        "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
        "function token0() external view returns (address)",
        "function token1() external view returns (address)",
        "function totalSupply() external view returns (uint256)",
      ];
      const lpPairContract = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, provider);
      
      // Get pool data with enhanced error handling and retries
      let reserves, token0, token1, totalSupply;
      let userLPBalance, userVCBalance, userBNBBalance;

      try {
        console.log('Fetching pool reserves...');
        // Get pool reserves from pair contract with timeout
        const poolDataPromise = Promise.all([
          lpPairContract.getReserves(),
          lpPairContract.token0(),
          lpPairContract.token1(),
          lpPairContract.totalSupply()
        ]);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout fetching pool data')), 10000)
        );
        
        [reserves, token0, token1, totalSupply] = await Promise.race([poolDataPromise, timeoutPromise]) as any;
        
        console.log('Pool data fetched successfully:', { reserves, token0, token1, totalSupply: totalSupply.toString() });
      } catch (error: any) {
        console.error('Error fetching pool data:', error);
        toast.error('Ошибка получения данных пула. Попробуйте обновить страницу.');
        
        // Use fallback values but continue to get user balances
        reserves = [0n, 0n, 0];
        token0 = CONTRACTS.VC_TOKEN;
        token1 = CONTRACTS.WBNB;
        totalSupply = 0n;
      }

      try {
        console.log('Fetching user balances...');
        // Get user balances with enhanced error handling
        const balanceResults = await Promise.allSettled([
          lpContract.balanceOf(account),
          vcContract.balanceOf(account),
          provider.getBalance(account)
        ]);

        userLPBalance = balanceResults[0].status === 'fulfilled' ? balanceResults[0].value : 0n;
        userVCBalance = balanceResults[1].status === 'fulfilled' ? balanceResults[1].value : 0n;
        userBNBBalance = balanceResults[2].status === 'fulfilled' ? balanceResults[2].value : 0n;
        
        console.log('User balances fetched:', { 
          userLPBalance: ethers.formatEther(userLPBalance),
          userVCBalance: ethers.formatEther(userVCBalance),
          userBNBBalance: ethers.formatEther(userBNBBalance)
        });
      } catch (error: any) {
        console.error('Error fetching user balances:', error);
        // Use fallback values
        userLPBalance = 0n;
        userVCBalance = 0n;
        userBNBBalance = 0n;
      }

      // Calculate accurate prices accounting for token order
      const reserve0 = ethers.formatEther(reserves[0] || 0n);
      const reserve1 = ethers.formatEther(reserves[1] || 0n);
      
      // Determine which token is which based on contract addresses
      const isVC0 = token0?.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase();
      const vcReserve = parseFloat(isVC0 ? reserve0 : reserve1);
      const bnbReserve = parseFloat(isVC0 ? reserve1 : reserve0);
      
      // Calculate exact prices with safety checks: VC price = BNB_reserve / VC_reserve, BNB price = VC_reserve / BNB_reserve
      let vcPriceInBNB = 0;
      let bnbPriceInVC = 0;
      
      if (vcReserve > 0 && bnbReserve > 0) {
        vcPriceInBNB = bnbReserve / vcReserve;
        bnbPriceInVC = vcReserve / bnbReserve;
      }

      setPoolInfo({
        reserve0,
        reserve1,
        token0: token0 || CONTRACTS.VC_TOKEN,
        token1: token1 || CONTRACTS.WBNB,
        totalSupply: ethers.formatEther(totalSupply || 0n),
        userLPBalance: ethers.formatEther(userLPBalance),
        userVCBalance: ethers.formatEther(userVCBalance),
        userBNBBalance: ethers.formatEther(userBNBBalance),
        vcPrice: vcPriceInBNB.toFixed(8),
        bnbPrice: bnbPriceInVC.toFixed(8),
      });
    } catch (error) {
      console.error('Error fetching pool info:', error);
      toast.error('Ошибка загрузки информации о пуле');
      
      // Set fallback pool info
      setPoolInfo({
        reserve0: '0',
        reserve1: '0',
        token0: CONTRACTS.VC_TOKEN,
        token1: CONTRACTS.WBNB,
        totalSupply: '0',
        userLPBalance: '0',
        userVCBalance: '0',
        userBNBBalance: '0',
        vcPrice: '0',
        bnbPrice: '0',
      });
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
      // Check VC approval with error handling
      try {
        const vcAllowance = await vcContract.allowance(account, CONTRACTS.PANCAKE_ROUTER);
        const vcApprovalNeeded = ethers.parseEther(vcInput || '0');
        setVcApproved(vcAllowance >= vcApprovalNeeded);
      } catch (error: any) {
        console.warn('Error checking VC allowance:', error);
        // Fallback: assume not approved
        setVcApproved(false);
      }

      // BNB doesn't need approval, but we track it for UI consistency
      setBnbApproved(true);

      // Check LP approval only if in remove tab and lpContract exists
      if (activeTab === 'remove' && lpContract && lpTokensInput) {
        try {
          const lpAllowance = await lpContract.allowance(account, CONTRACTS.PANCAKE_ROUTER);
          const lpApprovalNeeded = ethers.parseEther(lpTokensInput);
          setLpApproved(lpAllowance >= lpApprovalNeeded);
        } catch (error: any) {
          console.warn('Error checking LP allowance:', error);
          // Fallback: assume not approved
          setLpApproved(false);
        }
      } else {
        // Not in remove mode or no LP input
        setLpApproved(true);
      }
    } catch (error: any) {
      console.error('Error checking approvals:', error);
      // Set safe defaults
      setVcApproved(false);
      setBnbApproved(true);
      setLpApproved(false);
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
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💧</div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            LP Pool Manager
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Подключите кошелек для управления ликвидностью
          </p>
          <button
            onClick={connectWallet}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Подключить кошелек
          </button>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
  return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-3xl font-bold mb-4 text-orange-400">
            Неправильная сеть
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Переключитесь на BSC Testnet для управления ликвидностью
          </p>
          <button
            onClick={switchToTestnet}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Переключиться на BSC Testnet
          </button>
        </div>
      </div>
    );
  }

  // Debug panel для диагностики проблем
  const DebugPanel = () => (
            <div className="card">
      <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center">
        <Settings className="mr-2" size={20} />
        🔧 Debug Info
      </h3>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-gray-300">Factory</span>
            <a
              href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.PANCAKE_FACTORY}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
            >
              <span>{`${CONTRACTS.PANCAKE_FACTORY.slice(0, 6)}...${CONTRACTS.PANCAKE_FACTORY.slice(-4)}`}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
              </div>

          <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-gray-300">Router</span>
            <a
              href={`${BSC_TESTNET.blockExplorer}/address/${CONTRACTS.PANCAKE_ROUTER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
            >
              <span>{`${CONTRACTS.PANCAKE_ROUTER.slice(0, 6)}...${CONTRACTS.PANCAKE_ROUTER.slice(-4)}`}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
                  </div>
          
          <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-gray-300">VC Token</span>
            <a
              href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.VC_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
            >
              <span>{`${CONTRACTS.VC_TOKEN.slice(0, 6)}...${CONTRACTS.VC_TOKEN.slice(-4)}`}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
                  </div>
          
          <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-gray-300">WBNB</span>
            <a
              href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.WBNB}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
            >
              <span>{`${CONTRACTS.WBNB.slice(0, 6)}...${CONTRACTS.WBNB.slice(-4)}`}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded bg-white/5">
            <span className="font-medium text-gray-300">LP Token</span>
            <a
              href={`${BSC_TESTNET.blockExplorer}/token/${CONTRACTS.LP_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
            >
              <span>{`${CONTRACTS.LP_TOKEN.slice(0, 6)}...${CONTRACTS.LP_TOKEN.slice(-4)}`}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
                  </div>
                </div>

        <div className="pt-3 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Network:</span>
              <span className="text-green-400 ml-2">BSC Testnet (97)</span>
                  </div>
            <div>
              <span className="text-gray-400">Account:</span>
              <span className="text-purple-400 ml-2">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
                  </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 ${loading ? "text-yellow-400" : "text-green-400"}`}>
                {loading ? "Loading..." : "Ready"}
              </span>
                  </div>
            <div>
              <span className="text-gray-400">Explorer:</span>
              <a 
                href={BSC_TESTNET.blockExplorer} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 ml-2 text-xs"
              >
                BSCScan
              </a>
                </div>
              </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ContractStatus />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pool Information */}
        <div className="glass-panel p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold">Pool Information</h3>
                </div>
          {loading ? (
            <PoolInfoSkeleton />
          ) : poolInfo ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">VC Reserve</p>
                  <p className="font-bold">{poolInfo.reserve0} VC</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">BNB Reserve</p>
                  <p className="font-bold">{poolInfo.reserve1} BNB</p>
              </div>
                <div>
                  <p className="text-sm text-gray-400">VC Price</p>
                  <p className="font-bold">{poolInfo.vcPrice} BNB</p>
            </div>
                <div>
                  <p className="text-sm text-gray-400">BNB Price</p>
                  <p className="font-bold">{poolInfo.bnbPrice} VC</p>
            </div>
                <div>
                  <p className="text-sm text-gray-400">Your LP Balance</p>
                  <p className="font-bold">{parseFloat(poolInfo.userLPBalance).toFixed(6)} LP</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total LP Supply</p>
                  <p className="font-bold">{parseFloat(poolInfo.totalSupply).toFixed(2)} LP</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Your VC Balance</p>
                    <p className="font-bold text-green-400">{parseFloat(poolInfo.userVCBalance).toFixed(6)} VC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Your BNB Balance</p>
                    <p className="font-bold text-blue-400">{parseFloat(poolInfo.userBNBBalance).toFixed(6)} BNB</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Loading pool information...</p>
          )}
        </div>

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

        <DebugPanel />
      </div>
    </div>
  );
};

export default LPPoolManager; 