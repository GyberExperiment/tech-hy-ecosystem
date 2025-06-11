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
  "function earnVG(uint256, uint256, uint16) payable",
  "function getPoolInfo() view returns (uint256, uint256, uint256, uint256)",
  "function config() view returns (address, address, address, address, address, address, uint256, uint256, uint256, uint256, uint16, uint16, bool, uint256, uint8, uint256, uint256, uint256)"
];

const EarnVGWidget: React.FC<EarnVGWidgetProps> = ({ className = '' }) => {
  const { account, provider, signer, isConnected, getContract } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'earn'>('create'); // всегда create mode
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
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

  const handleEarnVG = async () => {
    if (!signer || !account || !getContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    // В режиме earn должны быть введены VC и BNB amount
    if (!vcAmount || !bnbAmount) {
      toast.error('Введите количество VC и BNB');
      return;
    }

    const vcAmountWei = ethers.parseEther(vcAmount);
    const bnbAmountWei = ethers.parseEther(bnbAmount);

    // Проверяем балансы
    if (parseFloat(balances.vc) < parseFloat(vcAmount)) {
      toast.error('Недостаточно VC токенов');
      return;
    }

    if (parseFloat(balances.bnb) < parseFloat(bnbAmount)) {
      toast.error('Недостаточно BNB');
      return;
    }

    setLoading(true);
    
    // Объявляем переменные для использования в catch блоке
    let finalSlippage = 1500;
    let maxAllowedSlippage = 1500;

    try {
      // Approve VC токенов для LPLocker
      const vcContract = getContract(CONTRACTS.VC_TOKEN, ERC20_ABI);
      if (!vcContract) throw new Error('Failed to create VC contract');

      const vcContractWithSigner = vcContract.connect(signer);

      toast.loading('Approving VC tokens...');
      const allowance = await vcContractWithSigner.allowance(account, CONTRACTS.LP_LOCKER);
      if (allowance < vcAmountWei) {
        const approveTx = await vcContractWithSigner.approve(CONTRACTS.LP_LOCKER, vcAmountWei);
        await approveTx.wait();
      }

      // EarnVG через LPLocker
      const lpLocker = getContract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI);
      if (!lpLocker) throw new Error('Failed to create LPLocker contract');

      const lpLockerWithSigner = lpLocker.connect(signer);

      toast.loading('Создание LP позиции и получение VG токенов...');
      
      // Логирование параметров для диагностики
      console.log('EarnVG parameters:', {
        vcAmount: vcAmount,
        bnbAmount: bnbAmount,
        vcAmountWei: vcAmountWei.toString(),
        bnbAmountWei: bnbAmountWei.toString(),
        account: account,
        contractAddress: CONTRACTS.LP_LOCKER
      });

      // Проверяем конфигурацию контракта
      const configData = await lpLockerWithSigner.config();
      console.log('Contract config:', {
        authority: configData[0],
        vgTokenAddress: configData[1], 
        vcTokenAddress: configData[2],
        minVcAmount: ethers.formatEther(configData[9]),
        minBnbAmount: ethers.formatEther(configData[8]),
        maxSlippageBps: configData[10].toString(),
        mevProtectionEnabled: configData[12]
      });

      console.log('CRITICAL DEBUG - slippage check:', {
        requestedSlippage: 1500,
        maxAllowedSlippage: configData[10].toString(),
        isSlippageValid: 1500 <= Number(configData[10])
      });

      console.log('CRITICAL DEBUG - BNB amount check:', {
        bnbAmountInput: bnbAmount,
        bnbAmountWei: bnbAmountWei.toString(),
        bnbAmountWeiFormatted: ethers.formatEther(bnbAmountWei),
        msgValueWillBe: bnbAmountWei.toString()
      });

      // Проверяем баланс VG токенов в стейкинг вольте
      const poolInfo = await lpLockerWithSigner.getPoolInfo();
      console.log('Pool info:', {
        totalLocked: poolInfo[0] ? ethers.formatEther(poolInfo[0]) : '0',
        totalIssued: poolInfo[1] ? ethers.formatEther(poolInfo[1]) : '0',
        totalDeposited: poolInfo[2] ? ethers.formatEther(poolInfo[2]) : '0',
        availableVG: poolInfo[3] ? ethers.formatEther(poolInfo[3]) : '0'
      });

      // Проверяем allowance VC токенов
      const vcAllowance = await vcContractWithSigner.allowance(account, CONTRACTS.LP_LOCKER);
      console.log('VC allowance:', vcAllowance ? ethers.formatEther(vcAllowance) : '0');

      // Проверяем MEV protection статус
      try {
        const currentBlock = await provider.getBlockNumber();
        const currentTimestamp = Math.floor(Date.now() / 1000);
        console.log('CRITICAL DEBUG - MEV protection check:', {
          mevEnabled: configData[12],
          minTimeBetweenTxs: configData[13]?.toString() || 'unknown',
          maxTxPerBlock: configData[14]?.toString() || 'unknown',
          currentBlock: currentBlock,
          currentTimestamp: currentTimestamp,
          userAccount: account
        });
      } catch (e) {
        console.log('MEV protection check failed:', e);
      }

      // КРИТИЧЕСКАЯ ПРОВЕРКА: MEV Protection может блокировать транзакции
      if (configData[12]) { // mevProtectionEnabled
        const minTimeBetweenTxs = Number(configData[13]);
        const maxTxPerBlock = Number(configData[14]);
        console.log('⚠️ MEV Protection ACTIVE:', {
          enabled: true,
          minTimeBetweenTxs: `${minTimeBetweenTxs} seconds`,
          maxTxPerBlock,
          recommendation: `Wait ${minTimeBetweenTxs} seconds between transactions`
        });
        
        // Предупреждаем пользователя о MEV protection
        if (minTimeBetweenTxs >= 300) {
          toast.loading(`MEV Protection: подождите ${Math.floor(minTimeBetweenTxs/60)} минут между транзакциями`);
        }
      }

      // CRITICAL FIX: Динамическая адаптация slippage под maxSlippageBps контракта
      // Контракт сам устанавливает deadline = block.timestamp + 300 (5 минут)
      maxAllowedSlippage = Number(configData[10]);
      const requestedSlippage = 1500; // 15%
      finalSlippage = Math.min(requestedSlippage, maxAllowedSlippage);
      
      console.log('CRITICAL DEBUG - Final slippage decision:', {
        requestedSlippage,
        maxAllowedSlippage,
        finalSlippage,
        willUseSlippage: finalSlippage
      });
      
      if (finalSlippage < requestedSlippage) {
        console.warn(`⚠️ Slippage reduced from ${requestedSlippage} to ${finalSlippage} due to contract limits`);
        toast.loading(`Adjusting slippage to ${(finalSlippage/100).toFixed(1)}% (contract limit)...`);
      }

      // КРИТИЧЕСКАЯ ДИАГНОСТИКА: расчет минимальных amounts для PancakeSwap
      // Используем BigInt арифметику для предотвращения overflow
      const slippageDeduction = BigInt(10000 - finalSlippage);
      const minVcAmountBig = (vcAmountWei * slippageDeduction) / 10000n;
      const minBnbAmountBig = (bnbAmountWei * slippageDeduction) / 10000n;
      const lpDivisorBig = BigInt(configData[6]);
      const expectedLpBig = (vcAmountWei * bnbAmountWei) / lpDivisorBig;
      const minLpAmountBig = (expectedLpBig * slippageDeduction) / 10000n;

      console.log('CRITICAL DEBUG - PancakeSwap amounts:', {
        vcAmount: ethers.formatEther(vcAmountWei),
        bnbAmount: ethers.formatEther(bnbAmountWei),
        slippageBps: finalSlippage,
        minVcAmount: ethers.formatEther(minVcAmountBig),
        minBnbAmount: ethers.formatEther(minBnbAmountBig),
        expectedLp: ethers.formatEther(expectedLpBig),
        minLpAmount: ethers.formatEther(minLpAmountBig),
        lpDivisor: configData[6].toString(),
        lpToVgRatio: configData[7].toString()
      });

      const earnTx = await lpLockerWithSigner.earnVG(
        vcAmountWei,
        bnbAmountWei,
        finalSlippage, // Используем адаптированный slippage
        {
          value: bnbAmountWei, // Отправляем BNB с транзакцией
          gasLimit: 500000, // Увеличиваем gas limit для сложных операций
        }
      );
      
      toast.loading('Транзакция отправлена, ожидаем подтверждения...');
      const receipt = await earnTx.wait();
      console.log('EarnVG transaction completed:', receipt.hash);

      toast.success('🎉 LP позиция создана и VG токены получены!');
      setVcAmount('');
      setBnbAmount('');

    } catch (error: any) {
      console.error('Error earning VG:', error);
      
      // Улучшенная обработка ошибок
      if (error.message?.includes('PancakeRouter: EXPIRED') || error.message?.includes('deadline')) {
        toast.error('⏰ Транзакция просрочена. Попробуйте снова быстрее или увеличьте deadline');
      } else if (error.message?.includes('slippage') || error.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT') || error.message?.includes('Slippage exceeded')) {
        toast.error('📊 Превышен допустимый slippage. Попробуйте увеличить slippage tolerance');
      } else if (error.message?.includes('Internal JSON-RPC error')) {
        toast.error('🔗 Ошибка RPC соединения. Проверьте подключение к сети или попробуйте позже');
      } else if (error.message?.includes('Too frequent transactions') || error.message?.includes('MEV protection')) {
        toast.error('🛡️ MEV защита активна. Подождите 30 секунд перед следующей транзакцией');
      } else if (error.message?.includes('Slippage too high')) {
        toast.error(`📊 Slippage ${(finalSlippage/100).toFixed(1)}% превышает максимальный лимит контракта`);
      } else if (error.message?.includes('transaction execution reverted') && error.code === 'CALL_EXCEPTION') {
        toast.error('❌ Транзакция отклонена контрактом. Проверьте параметры транзакции или попробуйте позже');
      } else if (error.message?.includes('VC amount too low')) {
        toast.error('Слишком малое количество VC токенов');
      } else if (error.message?.includes('BNB amount too low')) {
        toast.error('Слишком малое количество BNB');
      } else if (error.message?.includes('BNB amount mismatch')) {
        toast.error('Несоответствие количества BNB');
      } else if (error.message?.includes('Insufficient VG tokens')) {
        toast.error('Недостаточно VG токенов в vault');
      } else {
        toast.error(error.message || 'Ошибка при получении VG токенов');
      }
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
          Создайте LP позицию и получите VG токены
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

      {/* LP Position Creation & VG Earning */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-white">💧 Create LP Position & Earn VG</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">VC Amount</label>
            <div className="relative">
              <input
                type="number"
                value={vcAmount}
                onChange={(e) => setVcAmount(e.target.value)}
                className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg text-white pr-16"
                placeholder="1000"
              />
              <button
                onClick={() => setVcAmount(Math.floor(parseFloat(balances.vc) * 0.95).toString())}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Available: {parseFloat(balances.vc).toFixed(2)} VC</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">BNB Amount</label>
            <div className="relative">
              <input
                type="number"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
                className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg text-white pr-16"
                placeholder="0.1"
              />
              <button
                onClick={() => setBnbAmount((Math.floor(parseFloat(balances.bnb) * 0.95 * 10000) / 10000).toString())}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Available: {parseFloat(balances.bnb).toFixed(4)} BNB</p>
          </div>
          
          {/* Auto-calculate optimal ratio */}
          {poolInfo.price && vcAmount && (
            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">💡 Recommended BNB: {(parseFloat(vcAmount) * parseFloat(poolInfo.price)).toFixed(4)}</p>
              <button
                onClick={() => setBnbAmount((parseFloat(vcAmount) * parseFloat(poolInfo.price)).toFixed(4))}
                className="text-xs text-blue-300 hover:text-blue-200 underline mt-1"
              >
                Use optimal ratio
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleEarnVG}
          disabled={loading || !vcAmount || !bnbAmount}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
        >
          {loading ? '⏳ Processing...' : '💎 Create LP + Earn VG Tokens'}
        </button>

        {/* Show if user has existing LP tokens */}
        {parseFloat(balances.lpTokens) > 0.001 && (
          <div className="text-center p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm">✅ У вас уже есть {parseFloat(balances.lpTokens).toFixed(6)} LP токенов</p>
            <p className="text-xs text-gray-300">Создайте больше LP для дополнительных VG наград</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-400">
        <p>💡 LP токены автоматически заперты в LPLocker</p>
        <p>🎯 VG токены можно обменять на VGVotes для голосования</p>
      </div>
    </div>
  );
};

export default EarnVGWidget; 