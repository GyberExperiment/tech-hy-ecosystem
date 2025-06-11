import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS } from '../constants/contracts';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Coins, Zap, TrendingUp, Wallet } from 'lucide-react';
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
      
      // Получаем конфигурацию контракта для проверки максимального slippage
      try {
        const config = await lpLockerWithSigner.config();
        maxAllowedSlippage = config[11]; // maxSlippageBps
        console.log('Contract Max Slippage BPS:', maxAllowedSlippage);

        // Адаптируем slippage если превышает максимум
        if (finalSlippage > maxAllowedSlippage) {
          finalSlippage = maxAllowedSlippage;
          console.log(`Slippage adapted from 15% to ${finalSlippage / 100}%`);
        }
      } catch (configError) {
        console.warn('Could not fetch contract config, using default slippage');
      }

      console.log('Transaction Parameters:', {
        vcAmount: ethers.formatEther(vcAmountWei),
        bnbAmount: ethers.formatEther(bnbAmountWei),
        slippageBps: finalSlippage,
        maxSlippageBps: maxAllowedSlippage,
        gasLimit: 500000,
      });

      const tx = await lpLockerWithSigner.earnVG(vcAmountWei, bnbAmountWei, finalSlippage, {
        value: bnbAmountWei,
        gasLimit: 500000,
      });
      
      toast.loading('Ожидание подтверждения транзакции...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success('VG токены успешно получены!');
        console.log('Transaction successful:', receipt.hash);

        // Обновляем балансы
        await loadUserData();

        // Очищаем поля
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
    if (!vcAmount || !bnbAmount) return '0';
    try {
      const vcValue = parseFloat(vcAmount);
      const bnbValue = parseFloat(bnbAmount);
      const lpAmount = Math.sqrt(vcValue * bnbValue); // Приблизительный расчёт LP
      const vgReward = lpAmount * 15; // 15 VG за 1 LP
      return vgReward.toFixed(2);
    } catch {
      return '0';
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
          Создайте LP позицию и получите VG токены в награду (15:1 ratio). LP токены блокируются навсегда.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Балансы пользователя */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">VC Balance</p>
            <p className="text-lg font-semibold">{formatBalance(balances.vc)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">BNB Balance</p>
            <p className="text-lg font-semibold">{formatBalance(balances.bnb)}</p>
          </div>
        </div>

        {/* Pool Information */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Pool Information</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">VC Reserve</p>
              <p className="font-medium">{formatBalance(poolInfo.vcReserve)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">BNB Reserve</p>
              <p className="font-medium">{formatBalance(poolInfo.bnbReserve)}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-muted-foreground text-sm">Price: 1 VC = {poolInfo.price} BNB</p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
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
        </div>

        {/* Reward Preview */}
        {vcAmount && bnbAmount && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expected VG Reward:</span>
              <span className="text-lg font-semibold text-primary">
                {calculateVGReward()} VG
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleEarnVG}
          disabled={loading || !vcAmount || !bnbAmount}
          loading={loading}
          variant="gradient"
          size="lg"
          className="w-full"
          leftIcon={!loading ? <Zap className="h-4 w-4" /> : undefined}
        >
          {loading ? 'Processing...' : 'Create LP + Earn VG (One Click)'}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• LP токены блокируются навсегда (permanent lock)</p>
          <p>• Получаете 15 VG за каждый 1 LP токен (мгновенно)</p>
          <p>• VG токены можно использовать для governance</p>
          <p>• Это НЕ стейкинг - LP нельзя забрать обратно</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarnVGWidget; 