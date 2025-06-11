import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS } from '../constants/contracts';
import { toast } from 'react-hot-toast';

interface EarnVGWidgetProps {
  className?: string;
}

interface UserBalances {
  vc: string;
  bnb: string;
  lpTokens: string;
  vg: string;
}

interface PoolInfo {
  vcReserve: string;
  bnbReserve: string;
  price: string;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)"
];

const PAIR_ABI = [
  "function getReserves() view returns (uint112, uint112, uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)"
];

const ROUTER_ABI = [
  "function addLiquidityETH(address, uint256, uint256, uint256, address, uint256) payable returns (uint256, uint256, uint256)"
];

const LPLOCKER_ABI = [
  "function earnVG(uint256, uint256, uint256) returns (uint256)"
];

const EarnVGWidget: React.FC<EarnVGWidgetProps> = ({ className = '' }) => {
  const { account, provider, signer, isConnected, getContract } = useWeb3();
  const [balances, setBalances] = useState<UserBalances>({
    vc: '0',
    bnb: '0',
    lpTokens: '0',
    vg: '0'
  });
  const [poolInfo, setPoolInfo] = useState<PoolInfo>({
    vcReserve: '0',
    bnbReserve: '0',
    price: '0'
  });
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'earn' | 'create'>('earn'); // earn если есть LP, create если нет

  // Загружаем балансы и определяем режим
  useEffect(() => {
    if (isConnected && account) {
      loadUserData();
    }
  }, [isConnected, account]);

  const loadUserData = async () => {
    if (!provider || !account || !getContract) return;

    try {
      // Создаём контракты
      const vcContract = getContract(CONTRACTS.VC_TOKEN, ERC20_ABI);
      const vgContract = getContract(CONTRACTS.VG_TOKEN, ERC20_ABI);
      const lpContract = getContract(CONTRACTS.LP_TOKEN, ERC20_ABI);

      if (!vcContract || !vgContract || !lpContract) {
        console.error('Failed to create contracts');
        return;
      }

      const [vcBalance, bnbBalance, lpBalance, vgBalance, poolData] = await Promise.allSettled([
        vcContract.balanceOf(account),
        provider.getBalance(account),
        lpContract.balanceOf(account),
        vgContract.balanceOf(account),
        loadPoolInfo()
      ]);

      const newBalances: UserBalances = {
        vc: vcBalance.status === 'fulfilled' ? ethers.formatEther(vcBalance.value) : '0',
        bnb: bnbBalance.status === 'fulfilled' ? ethers.formatEther(bnbBalance.value) : '0',
        lpTokens: lpBalance.status === 'fulfilled' ? ethers.formatEther(lpBalance.value) : '0',
        vg: vgBalance.status === 'fulfilled' ? ethers.formatEther(vgBalance.value) : '0'
      };

      setBalances(newBalances);

      // Определяем режим: если есть LP токены -> earn, если нет -> create
      const hasLpTokens = parseFloat(newBalances.lpTokens) > 0.001;
      setMode(hasLpTokens ? 'earn' : 'create');

      if (poolData.status === 'fulfilled') {
        setPoolInfo(poolData.value as PoolInfo);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPoolInfo = async (): Promise<PoolInfo> => {
    if (!provider || !getContract) throw new Error('No provider');

    const lpPairContract = getContract(CONTRACTS.LP_TOKEN, PAIR_ABI);
    if (!lpPairContract) throw new Error('Failed to create LP pair contract');

    const [reserves, token0, token1] = await Promise.all([
      lpPairContract.getReserves(),
      lpPairContract.token0(),
      lpPairContract.token1()
    ]);

    // Определяем порядок токенов
    const isVCToken0 = token0.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase();
    const vcReserve = isVCToken0 ? reserves[0] : reserves[1];
    const bnbReserve = isVCToken0 ? reserves[1] : reserves[0];

    const price = vcReserve > 0n ? (Number(bnbReserve) / Number(vcReserve)) : 0;

    return {
      vcReserve: ethers.formatEther(vcReserve),
      bnbReserve: ethers.formatEther(bnbReserve),
      price: price.toFixed(8)
    };
  };

  // Автоматический расчёт BNB при вводе VC (для создания LP)
  useEffect(() => {
    if (vcAmount && poolInfo.vcReserve !== '0' && poolInfo.bnbReserve !== '0') {
      const vcValue = parseFloat(vcAmount);
      const ratio = parseFloat(poolInfo.bnbReserve) / parseFloat(poolInfo.vcReserve);
      const calculatedBnb = (vcValue * ratio).toFixed(6);
      setBnbAmount(calculatedBnb);
    }
  }, [vcAmount, poolInfo]);

  const handleCreateLPAndEarnVG = async () => {
    if (!signer || !account || !getContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    if (!vcAmount || !bnbAmount) {
      toast.error('Введите количество токенов');
      return;
    }

    setLoading(true);
    
    try {
      const vcAmountWei = ethers.parseEther(vcAmount);
      const bnbAmountWei = ethers.parseEther(bnbAmount);

      // Проверяем балансы
      if (parseFloat(balances.vc) < parseFloat(vcAmount)) {
        throw new Error(`Недостаточно VC токенов. Нужно: ${vcAmount}, есть: ${balances.vc}`);
      }
      if (parseFloat(balances.bnb) < parseFloat(bnbAmount) + 0.01) { // +0.01 на газ
        throw new Error(`Недостаточно BNB. Нужно: ${bnbAmount}, есть: ${balances.bnb}`);
      }

      // 1. Approve VC токены для router
      const vcContract = getContract(CONTRACTS.VC_TOKEN, ERC20_ABI);
      if (!vcContract) throw new Error('Failed to create VC contract');

      // Подключаем контракт к signer
      const vcContractWithSigner = vcContract.connect(signer);

      const allowance = await vcContractWithSigner.allowance(account, CONTRACTS.PANCAKE_ROUTER);
      if (allowance < vcAmountWei) {
        toast.loading('Approving VC tokens...');
        const approveTx = await vcContractWithSigner.approve(CONTRACTS.PANCAKE_ROUTER, vcAmountWei);
        await approveTx.wait();
      }

      // 2. Создаём LP через router
      const router = getContract(CONTRACTS.PANCAKE_ROUTER, ROUTER_ABI);
      if (!router) throw new Error('Failed to create router contract');

      const routerWithSigner = router.connect(signer);

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 минут
      const minVcAmount = (vcAmountWei * 95n) / 100n; // 5% slippage
      const minBnbAmount = (bnbAmountWei * 95n) / 100n;

      toast.loading('Создание LP позиции...');
      const lpTx = await routerWithSigner.addLiquidityETH(
        CONTRACTS.VC_TOKEN,
        vcAmountWei,
        minVcAmount,
        minBnbAmount,
        account,
        deadline,
        { value: bnbAmountWei }
      );
      await lpTx.wait();

      // 3. Сразу получаем LP токены и делаем earnVG
      await handleEarnVG();

      toast.success('🎉 LP создан и VG токены получены!');
      
    } catch (error: any) {
      console.error('Error in create LP + earn VG:', error);
      toast.error(error.message || 'Ошибка при создании LP и получении VG');
    } finally {
      setLoading(false);
      loadUserData(); // Обновляем данные
    }
  };

  const handleEarnVG = async () => {
    if (!signer || !account || !getContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    if (parseFloat(balances.lpTokens) <= 0.001) {
      toast.error('У вас нет LP токенов для обмена на VG');
      return;
    }

    setLoading(true);

    try {
      // Используем все LP токены для earnVG
      const lpAmountWei = ethers.parseEther(balances.lpTokens);

      // Approve LP токены для LPLocker
      const lpContract = getContract(CONTRACTS.LP_TOKEN, ERC20_ABI);
      if (!lpContract) throw new Error('Failed to create LP contract');

      const lpContractWithSigner = lpContract.connect(signer);

      const allowance = await lpContractWithSigner.allowance(account, CONTRACTS.LP_LOCKER);
      if (allowance < lpAmountWei) {
        toast.loading('Approving LP tokens...');
        const approveTx = await lpContractWithSigner.approve(CONTRACTS.LP_LOCKER, lpAmountWei);
        await approveTx.wait();
      }

      // EarnVG через LPLocker
      const lpLocker = getContract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI);
      if (!lpLocker) throw new Error('Failed to create LPLocker contract');

      const lpLockerWithSigner = lpLocker.connect(signer);

      toast.loading('Получение VG токенов...');
      
      // Рассчитываем приблизительные количества из LP токенов
      const lpTotalSupplyContract = getContract(CONTRACTS.LP_TOKEN, PAIR_ABI);
      if (!lpTotalSupplyContract) throw new Error('Failed to create LP total supply contract');

      const totalLpSupply = await lpTotalSupplyContract.totalSupply();

      const lpPercentage = Number(lpAmountWei) / Number(totalLpSupply);
      const vcFromLp = lpPercentage * parseFloat(poolInfo.vcReserve);
      const bnbFromLp = lpPercentage * parseFloat(poolInfo.bnbReserve);

      const earnTx = await lpLockerWithSigner.earnVG(
        ethers.parseEther(vcFromLp.toFixed(6)),
        ethers.parseEther(bnbFromLp.toFixed(6)),
        500 // 5% slippage
      );
      await earnTx.wait();

      toast.success('🎉 VG токены успешно получены!');

    } catch (error: any) {
      console.error('Error earning VG:', error);
      toast.error(error.message || 'Ошибка при получении VG токенов');
    } finally {
      setLoading(false);
      loadUserData();
    }
  };

  if (!isConnected) {
    return (
      <div className={`glass-panel p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">Earn VG Tokens</h3>
          <p className="text-gray-300 mb-4">Подключите кошелёк для получения VG токенов</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🎯 Earn VG Tokens</h3>
        <p className="text-gray-300">
          {mode === 'earn' 
            ? 'У вас есть LP токены — получите VG!' 
            : 'Создайте LP позицию и получите VG в один клик'
          }
        </p>
      </div>

      {/* Балансы */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-400">VC Balance</p>
          <p className="text-lg font-bold text-blue-400">{parseFloat(balances.vc).toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">BNB Balance</p>
          <p className="text-lg font-bold text-yellow-400">{parseFloat(balances.bnb).toFixed(4)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">LP Tokens</p>
          <p className="text-lg font-bold text-green-400">{parseFloat(balances.lpTokens).toFixed(6)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">VG Balance</p>
          <p className="text-lg font-bold text-purple-400">{parseFloat(balances.vg).toFixed(2)}</p>
        </div>
      </div>

      {/* Pool Info */}
      <div className="glass-panel-inner p-4 mb-6">
        <h4 className="text-lg font-bold text-white mb-3">📊 Pool Information</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400">VC Reserve</p>
            <p className="text-md font-bold text-blue-400">{parseFloat(poolInfo.vcReserve).toFixed(0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">BNB Reserve</p>
            <p className="text-md font-bold text-yellow-400">{parseFloat(poolInfo.bnbReserve).toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Price</p>
            <p className="text-md font-bold text-green-400">1 VC = {poolInfo.price} BNB</p>
          </div>
        </div>
      </div>

      {mode === 'create' ? (
        // Режим создания LP + Earn VG
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white">💧 Create LP Position</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">VC Amount</label>
              <input
                type="number"
                value={vcAmount}
                onChange={(e) => setVcAmount(e.target.value)}
                className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg text-white"
                placeholder="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">BNB Amount (автоматически)</label>
              <input
                type="number"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
                className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg text-white"
                placeholder="0.1"
              />
            </div>
          </div>

          <button
            onClick={handleCreateLPAndEarnVG}
            disabled={loading || !vcAmount || !bnbAmount}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
          >
            {loading ? '⏳ Processing...' : '🚀 Create LP + Earn VG (One Click)'}
          </button>
        </div>
      ) : (
        // Режим Earn VG (у пользователя есть LP)
        <div className="space-y-4">
          <div className="text-center p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 font-bold">✅ У вас есть {parseFloat(balances.lpTokens).toFixed(6)} LP токенов</p>
            <p className="text-sm text-gray-300">Обменяйте их на VG токены</p>
          </div>

          <button
            onClick={handleEarnVG}
            disabled={loading || parseFloat(balances.lpTokens) <= 0.001}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
          >
            {loading ? '⏳ Processing...' : '💎 Earn VG Tokens'}
          </button>

          <button
            onClick={() => setMode('create')}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
          >
            ➕ Create More LP
          </button>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-400">
        <p>💡 LP токены автоматически заперты в LPLocker</p>
        <p>🎯 VG токены можно обменять на VGVotes для голосования</p>
      </div>
    </div>
  );
};

export default EarnVGWidget; 