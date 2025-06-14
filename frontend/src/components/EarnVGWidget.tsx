import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS } from '../constants/contracts';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Coins, Zap, TrendingUp, Wallet, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

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
  "function lockLPTokens(uint256) external",
  "function getPoolInfo() view returns (uint256, uint256, uint256, uint256)",
  "function config() view returns (address, address, address, address, address, address, uint256, uint256, uint256, uint256, uint16, uint16, bool, uint256, uint8, uint256, uint256, uint256)"
];

// Fallback RPC providers для надёжности
const FALLBACK_RPC_URLS = [
  'https://bsc-testnet-rpc.publicnode.com',
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://bsc-testnet.public.blastapi.io',
  'https://endpoints.omniatech.io/v1/bsc/testnet/public'
];

const createFallbackProvider = () => {
  try {
    return new ethers.JsonRpcProvider(FALLBACK_RPC_URLS[0]);
  } catch (error) {
    console.error('Failed to create fallback provider:', error);
    return null;
  }
};

// Utility function для retry логики
const withRetry = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

// Utility function для timeout
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
};

const EarnVGWidget: React.FC<EarnVGWidgetProps> = ({ className = '' }) => {
  const { account, provider, signer, isConnected, isCorrectNetwork, getContract, vcContract, vgContract, lpLockerContract } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'lock'>('create');
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
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

  // Добавляем ref для предотвращения множественных вызовов
  const loadingRef = React.useRef(false);

  useEffect(() => {
    if (isConnected && account && isCorrectNetwork) {
      console.log('EarnVGWidget: Main useEffect triggered');
      loadUserData();
      // Загружаем информацию о пуле
      loadPoolInfo().then(setPoolInfo).catch((error) => {
        console.error('EarnVGWidget: Pool info error:', error);
        // Устанавливаем fallback значения при ошибке
        setPoolInfo({
          vcReserve: '0',
          bnbReserve: '0',
          price: '0'
        });
      });
    }
  }, [isConnected, account, isCorrectNetwork]);

  // Дополнительный useEffect для отслеживания готовности контрактов
  useEffect(() => {
    if (isConnected && account && isCorrectNetwork && vcContract && vgContract && lpLockerContract && !loadingRef.current) {
      console.log('EarnVGWidget: Contracts are now ready, loading user data...');
      loadUserData();
    }
  }, [vcContract, vgContract, lpLockerContract, isConnected, account, isCorrectNetwork]);

  const loadUserData = async () => {
    if (!account || !isCorrectNetwork) {
      console.log('EarnVGWidget: Skipping loadUserData - not connected or wrong network');
      return;
    }

    // Защита от множественных вызовов
    if (loadingRef.current) {
      console.log('EarnVGWidget: loadUserData already in progress, skipping...');
      return;
    }

    console.log('EarnVGWidget: Starting loadUserData...');
    loadingRef.current = true;
    setLoading(true);
    
    try {
      // Проверяем готовность контрактов
      if (!vcContract || !vgContract || !lpLockerContract) {
        console.log('EarnVGWidget: Contracts not ready yet, skipping...');
        return;
      }

      console.log('EarnVGWidget: Contracts ready, fetching balances...');
      
      const newBalances: UserBalances = {
        vc: '0',
        vg: '0',
        bnb: '0',
        lpTokens: '0'
      };

      // Используем Promise.allSettled для параллельного выполнения
      const balancePromises = [
        vcContract.balanceOf(account).then(balance => {
          newBalances.vc = ethers.formatEther(balance);
          console.log('EarnVGWidget: VC balance:', newBalances.vc);
        }).catch(error => {
          console.warn('EarnVGWidget: Error fetching VC balance:', error);
        }),

        vgContract.balanceOf(account).then(balance => {
          newBalances.vg = ethers.formatEther(balance);
          console.log('EarnVGWidget: VG balance:', newBalances.vg);
        }).catch(error => {
          console.warn('EarnVGWidget: Error fetching VG balance:', error);
        }),

        provider.getBalance(account).then(balance => {
          newBalances.bnb = ethers.formatEther(balance);
          console.log('EarnVGWidget: BNB balance:', newBalances.bnb);
        }).catch(error => {
          console.warn('EarnVGWidget: Error fetching BNB balance:', error);
        })
      ];

      // Добавляем получение LP токенов
      const lpContract = getContract(CONTRACTS.LP_TOKEN, ERC20_ABI);
      if (lpContract) {
        balancePromises.push(
          lpContract.balanceOf(account).then(balance => {
            newBalances.lpTokens = ethers.formatEther(balance);
            console.log('EarnVGWidget: LP balance:', newBalances.lpTokens);
          }).catch(error => {
            console.warn('EarnVGWidget: Error fetching LP balance:', error);
          })
        );
      }

      // Ждем завершения всех запросов
      await Promise.allSettled(balancePromises);

      setBalances(newBalances);
      console.log('EarnVGWidget: Balances updated successfully');
    } catch (error) {
      console.error('EarnVGWidget: Error loading user data:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      console.log('EarnVGWidget: loadUserData completed');
    }
  };

  const loadPoolInfo = async (): Promise<PoolInfo> => {
    console.log('EarnVGWidget: Starting loadPoolInfo...');
    
    // Используем fallback provider если основной недоступен
    let currentProvider = provider;
    if (!currentProvider) {
      console.warn('EarnVGWidget: Main provider not available, using fallback');
      currentProvider = createFallbackProvider();
      if (!currentProvider) {
        console.error('EarnVGWidget: No provider available for pool info');
        throw new Error('No provider available');
      }
    }

    try {
      return await withTimeout(
        withRetry(async () => {
          console.log('EarnVGWidget: Creating LP pair contract...');
          const lpPairContract = new ethers.Contract(
            CONTRACTS.LP_TOKEN, 
            PAIR_ABI, 
            currentProvider
          );

          console.log('EarnVGWidget: Fetching pool data...');
          const [reserves, token0, token1] = await Promise.all([
            lpPairContract.getReserves(),
            lpPairContract.token0(),
            lpPairContract.token1()
          ]);

          const isVCToken0 = token0.toLowerCase() === CONTRACTS.VC_TOKEN.toLowerCase();
          const vcReserve = isVCToken0 ? reserves[0] : reserves[1];
          const bnbReserve = isVCToken0 ? reserves[1] : reserves[0];

          const price = vcReserve > 0n ? (Number(bnbReserve) / Number(vcReserve)) : 0;

          const result = {
            vcReserve: ethers.formatEther(vcReserve),
            bnbReserve: ethers.formatEther(bnbReserve),
            price: price.toFixed(8)
          };

          console.log('EarnVGWidget: Pool info loaded successfully:', result);
          return result;
        }),
        5000 // Уменьшаем timeout до 5 секунд
      );
    } catch (error) {
      console.error('EarnVGWidget: Error loading pool info:', error);
      // Возвращаем fallback значения
      const fallbackResult = {
        vcReserve: '0',
        bnbReserve: '0',
        price: '0'
      };
      console.log('EarnVGWidget: Using fallback pool info:', fallbackResult);
      return fallbackResult;
    }
  };

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

    if (!vcAmount || !bnbAmount) {
      toast.error('Введите количество VC и BNB');
      return;
    }

    const vcAmountWei = ethers.parseEther(vcAmount);
    const bnbAmountWei = ethers.parseEther(bnbAmount);

    if (parseFloat(balances.vc) < parseFloat(vcAmount)) {
      toast.error('Недостаточно VC токенов');
      return;
    }

    if (parseFloat(balances.bnb) < parseFloat(bnbAmount)) {
      toast.error('Недостаточно BNB');
      return;
    }

    setLoading(true);
    
    let finalSlippage = 1500;
    let maxAllowedSlippage = 1500;

    try {
      const vcContract = getContract(CONTRACTS.VC_TOKEN, ERC20_ABI);
      if (!vcContract) throw new Error('Failed to create VC contract');

      const vcContractWithSigner = vcContract.connect(signer);

      toast.loading('Approving VC tokens...');
      const allowance = await vcContractWithSigner.allowance(account, CONTRACTS.LP_LOCKER);
      if (allowance < vcAmountWei) {
        const approveTx = await vcContractWithSigner.approve(CONTRACTS.LP_LOCKER, vcAmountWei);
        await approveTx.wait();
      }

      const lpLocker = getContract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI);
      if (!lpLocker) throw new Error('Failed to create LPLocker contract');

      const lpLockerWithSigner = lpLocker.connect(signer);

      toast.loading('Создание LP позиции и получение VG токенов...');
      
      try {
        const config = await lpLockerWithSigner.config();
        maxAllowedSlippage = config[11];

        if (finalSlippage > maxAllowedSlippage) {
          finalSlippage = maxAllowedSlippage;
        }
      } catch (configError) {
        // Используем дефолтный slippage если не можем получить из контракта
      }

      const tx = await lpLockerWithSigner.earnVG(vcAmountWei, bnbAmountWei, finalSlippage, {
        value: bnbAmountWei,
        gasLimit: 500000,
      });
      
      toast.loading('Ожидание подтверждения транзакции...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success('VG токены успешно получены!');

        // Принудительное обновление балансов с задержкой
        setTimeout(async () => {
          await loadUserData();
        }, 2000); // 2 секунды задержка для BSC

        await loadUserData();

        setVcAmount('');
        setBnbAmount('');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('EarnVG Error:', error);

      if (error.message?.includes('Too frequent transactions')) {
        toast.error('MEV Protection: Подождите 5 минут между транзакциями');
      } else if (error.message?.includes('Slippage exceeded')) {
        toast.error(`Slippage превышен. Попробуйте с ${finalSlippage / 100}% или меньше`);
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Недостаточно средств для транзакции');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Транзакция отклонена пользователем');
      } else if (error.message?.includes('Internal JSON-RPC error')) {
        toast.error('Ошибка сети BSC. Попробуйте позже');
      } else {
        toast.error(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const calculateVGReward = (): string => {
    if (mode === 'create') {
      if (!vcAmount || !bnbAmount) return '0';
      try {
        const vcValue = parseFloat(vcAmount);
        const bnbValue = parseFloat(bnbAmount);
        const lpAmount = Math.sqrt(vcValue * bnbValue);
        const vgReward = lpAmount * 15;
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    } else {
      if (!lpAmount) return '0';
      try {
        const lpValue = parseFloat(lpAmount);
        const vgReward = lpValue * 15;
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    }
  };

  const handleLockLP = async () => {
    if (!signer || !account || !getContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    if (!lpAmount) {
      toast.error('Введите количество LP токенов');
      return;
    }

    const lpAmountWei = ethers.parseEther(lpAmount);

    if (parseFloat(balances.lpTokens) < parseFloat(lpAmount)) {
      toast.error('Недостаточно LP токенов');
      return;
    }

    setLoading(true);

    try {
      const lpContract = getContract(CONTRACTS.LP_TOKEN, ERC20_ABI);
      if (!lpContract) throw new Error('Failed to create LP contract');

      const lpContractWithSigner = lpContract.connect(signer);

      toast.loading('Approving LP tokens...');
      const allowance = await lpContractWithSigner.allowance(account, CONTRACTS.LP_LOCKER);
      if (allowance < lpAmountWei) {
        const approveTx = await lpContractWithSigner.approve(CONTRACTS.LP_LOCKER, lpAmountWei);
        await approveTx.wait();
      }

      const lpLocker = getContract(CONTRACTS.LP_LOCKER, LPLOCKER_ABI);
      if (!lpLocker) throw new Error('Failed to create LPLocker contract');

      const lpLockerWithSigner = lpLocker.connect(signer);

      toast.loading('Блокировка LP токенов и получение VG наград...');
      
      const tx = await lpLockerWithSigner.lockLPTokens(lpAmountWei, {
        gasLimit: 300000,
      });
      
      toast.loading('Ожидание подтверждения транзакции...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success('LP токены заблокированы, VG награды получены!');

        // Принудительное обновление балансов с задержкой
        setTimeout(async () => {
          await loadUserData();
        }, 2000); // 2 секунды задержка для BSC

        await loadUserData();

        setLpAmount('');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('LockLP Error:', error);

      if (error.message?.includes('Too frequent transactions')) {
        toast.error('MEV Protection: Подождите 5 минут между транзакциями');
      } else if (error.message?.includes('Insufficient LP balance')) {
        toast.error('Недостаточно LP токенов');
      } else if (error.message?.includes('Insufficient LP allowance')) {
        toast.error('Недостаточно разрешений для LP токенов');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Транзакция отклонена пользователем');
      } else if (error.message?.includes('Internal JSON-RPC error')) {
        toast.error('Ошибка сети BSC. Попробуйте позже');
      } else {
        toast.error(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card variant="glass" className={cn('w-full max-w-md mx-auto', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-center mb-2">Подключите кошелёк</CardTitle>
          <CardDescription className="text-center">
            Для использования LP Staking необходимо подключить MetaMask
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Earn VG Tokens
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Создайте LP позицию из VC + BNB и получите VG токены (15:1 ratio)'
            : 'Заблокируйте готовые LP токены VC/BNB и получите VG награды (15:1 ratio)'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setMode('create')}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all text-slate-200',
              mode === 'create'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Create LP
          </button>
          <button
            onClick={() => setMode('lock')}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all text-slate-200',
              mode === 'lock'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Lock LP Tokens
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mode === 'create' ? (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="text-center">
                <p className="text-sm text-gray-400">VC Balance</p>
                <p className="text-lg font-semibold text-slate-100">{formatBalance(balances.vc)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">BNB Balance</p>
                <p className="text-lg font-semibold text-slate-100">{formatBalance(balances.bnb)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="text-center">
                <p className="text-sm text-gray-400">LP Balance</p>
                <p className="text-lg font-semibold text-slate-100">{formatBalance(balances.lpTokens)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">VG Balance</p>
                <p className="text-lg font-semibold text-slate-100">{formatBalance(balances.vg)}</p>
              </div>
            </div>
          )}
        </div>

        {mode === 'create' && (
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-200">Pool Information</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">VC Reserve</p>
                <p className="font-medium text-slate-100">{formatBalance(poolInfo.vcReserve)}</p>
              </div>
              <div>
                <p className="text-gray-400">BNB Reserve</p>
                <p className="font-medium text-slate-100">{formatBalance(poolInfo.bnbReserve)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {mode === 'create' ? (
            <>
              <Input
                label="VC Amount"
                type="number"
                placeholder="Enter VC amount"
                value={vcAmount}
                onChange={(e) => setVcAmount(e.target.value)}
                leftIcon={<Coins className="h-4 w-4" />}
                disabled={loading}
              />

              <Input
                label="BNB Amount (Auto-calculated)"
                type="number"
                placeholder="Auto-calculated from VC"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
                leftIcon={<Coins className="h-4 w-4" />}
                disabled={loading}
              />
            </>
          ) : (
            <Input
              label="LP Token Amount"
              type="number"
              placeholder="Enter LP token amount"
              value={lpAmount}
              onChange={(e) => setLpAmount(e.target.value)}
              leftIcon={<Coins className="h-4 w-4" />}
              disabled={loading}
            />
          )}
        </div>

        {((mode === 'create' && vcAmount && bnbAmount) || (mode === 'lock' && lpAmount)) && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expected VG Reward:</span>
              <span className="text-lg font-semibold text-primary">
                {calculateVGReward()} VG
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={mode === 'create' ? handleEarnVG : handleLockLP}
          disabled={
            loading || 
            (mode === 'create' && (!vcAmount || !bnbAmount)) ||
            (mode === 'lock' && !lpAmount)
          }
          loading={loading}
          variant="gradient"
          size="lg"
          className="w-full"
          leftIcon={!loading ? <Zap className="h-4 w-4" /> : undefined}
        >
          {loading 
            ? 'Processing...' 
            : mode === 'create' 
              ? 'Create LP + Earn VG (One Click)'
              : 'Lock LP Tokens + Earn VG'
          }
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• LP токены блокируются навсегда (permanent lock)</p>
          <p>• Получаете 15 VG за каждый 1 LP токен (мгновенно)</p>
          <p>• VG токены можно использовать для governance</p>
          <p>• Это НЕ стейкинг - LP нельзя забрать обратно</p>
          {mode === 'lock' && (
            <p>• Убедитесь, что у вас есть готовые LP токены VC/BNB</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EarnVGWidget; 