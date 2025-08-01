import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { useContracts } from '../../../shared/hooks/useContracts';
import { toast } from 'react-hot-toast';
import { Coins, Zap, TrendingUp, Wallet, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { useTokenData } from '../../../entities/Token/model/useTokenData';
import { usePoolInfo } from '../../../entities/Staking/model/usePoolInfo';
import { log } from '../../../shared/lib/logger';
import { rpcService } from '../../../shared/api/rpcService';

interface EarnVGWidgetProps {
  className?: string;
}

const EarnVGWidget: React.FC<EarnVGWidgetProps> = ({ className = '' }) => {
  const { account, signer, isConnected, vcContract, lpLockerContract, vgContract } = useWeb3();
  
  // Use centralized hooks
  const { balances, loading: balancesLoading, triggerGlobalRefresh } = useTokenData();
  const { poolInfo, loading: poolLoading, refreshPoolInfo } = usePoolInfo();
  
  // ✅ Dynamic contracts based on current network
  const { contracts } = useContracts();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'lock'>('create');
  const [vcAmount, setVcAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [currentAllowance, setCurrentAllowance] = useState<string>('0');
  const [checkingAllowance, setCheckingAllowance] = useState(false);
  
  // Memoized calculations
  const calculatedBnbAmount = useMemo(() => {
    if (!vcAmount || !poolInfo || parseFloat(vcAmount) <= 0) return '';
    
    try {
      const vcValue = parseFloat(vcAmount);
      if (isNaN(vcValue) || vcValue <= 0) return '';
      
      const ratio = parseFloat(poolInfo.bnbReserve) / parseFloat(poolInfo.vcReserve);
      const calculatedBnb = (vcValue * ratio).toFixed(6);
      
      return calculatedBnb;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Failed to calculate BNB amount', {
          component: 'EarnVGWidget',
          function: 'calculatedBnbAmount',
          vcAmount
        }, error as Error);
      }
      return '';
    }
  }, [vcAmount, poolInfo?.bnbReserve, poolInfo?.vcReserve]);

  // Auto-update BNB amount when VC changes - с debounce для уменьшения частоты логов
  useEffect(() => {
    if (calculatedBnbAmount && calculatedBnbAmount !== bnbAmount) {
      // ✅ Добавляем небольшую задержку для уменьшения частоты обновлений
      const timeoutId = setTimeout(() => {
        setBnbAmount(calculatedBnbAmount);
        if (process.env.NODE_ENV === 'development') {
          log.debug('Auto-calculated BNB amount from VC', {
            component: 'EarnVGWidget',
            vcAmount,
            bnbAmount: calculatedBnbAmount,
            ratio: poolInfo?.bnbReserve && poolInfo?.vcReserve ? 
              (parseFloat(poolInfo.bnbReserve) / parseFloat(poolInfo.vcReserve)).toFixed(8) : 'N/A'
          });
        }
      }, 100); // ✅ 100ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [calculatedBnbAmount, bnbAmount, vcAmount, poolInfo?.bnbReserve, poolInfo?.vcReserve]); // ✅ Оптимизированные dependencies

  // Auto-check allowance when wallet connects
  /* useEffect(() => {
    if (account && vcContract && vcAmount && parseFloat(vcAmount) > 0) {
      if (process.env.NODE_ENV === 'development') {
        log.debug('Auto-checking VC allowance on wallet connect', {
          component: 'EarnVGWidget',
          account,
          vcAmount
        });
      }
      checkCurrentAllowance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, vcContract, vcAmount]); */

  // Check current allowance function
  const checkCurrentAllowance = async () => {
    if (!account || !vcContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    setCheckingAllowance(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        log.info('Checking current VC allowance', {
          component: 'EarnVGWidget',
          function: 'checkCurrentAllowance',
          address: account
        });
      }
      
      const allowance = await rpcService.withFallback(async (provider) => {
        const readOnlyVCContract = new ethers.Contract(contracts.VC_TOKEN, [
          "function allowance(address owner, address spender) view returns (uint256)"
        ], provider);
        
        return await (readOnlyVCContract as any).allowance(account, contracts.LP_LOCKER);
      });
      
      const allowanceFormatted = ethers.formatEther(allowance);
      
      setCurrentAllowance(allowanceFormatted);
      if (process.env.NODE_ENV === 'development') {
        log.info('Current VC allowance retrieved', {
          component: 'EarnVGWidget',
          function: 'checkCurrentAllowance',
          address: account,
          allowance: allowanceFormatted
        });
      }
      
      if (parseFloat(allowanceFormatted) > 0) {
        toast.success(`Approve уже выполнен! Allowance: ${parseFloat(allowanceFormatted).toFixed(2)} VC`);
      } else {
        toast.success('Approve не выполнен. Allowance: 0 VC');
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Failed to check VC allowance', {
          component: 'EarnVGWidget',
          function: 'checkCurrentAllowance',
          address: account
        }, error);
      }
      toast.error('Ошибка проверки allowance');
    } finally {
      setCheckingAllowance(false);
    }
  };

  // Transaction handlers
  const handleEarnVG = async () => {
    if (process.env.NODE_ENV === 'development') {
      log.info('Starting EarnVG operation', {
        component: 'EarnVGWidget',
        function: 'handleEarnVG',
        address: account,
        vcAmount,
        bnbAmount,
        mode
      });
    }
    
    if (!signer || !account || !vcContract || !lpLockerContract) {
      const missingItems = [];
      if (!signer) missingItems.push('signer');
      if (!account) missingItems.push('account');
      if (!vcContract) missingItems.push('vcContract');
      if (!lpLockerContract) missingItems.push('lpLockerContract');
      
      if (process.env.NODE_ENV === 'development') {
        log.error('Missing required components for EarnVG', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          missingComponents: missingItems
        });
      }
      toast.error('Подключите кошелёк');
      return;
    }

    if (!vcAmount || !bnbAmount) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Missing VC or BNB amounts', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          vcAmount,
          bnbAmount
        });
      }
      toast.error('Введите количество VC и BNB');
      return;
    }

    const vcAmountWei = ethers.parseEther(vcAmount);
    const bnbAmountWei = ethers.parseEther(bnbAmount);

    if (process.env.NODE_ENV === 'development') {
      log.info('Checking user balances', {
        component: 'EarnVGWidget',
        function: 'handleEarnVG',
        required: { vc: vcAmount, bnb: bnbAmount },
        available: { vc: balances.VC || '0', bnb: balances.BNB || '0' }
      });
    }

    if (parseFloat(balances.VC || '0') < parseFloat(vcAmount)) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Insufficient VC tokens', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          required: vcAmount,
          available: balances.VC || '0'
        });
      }
      toast.error('Недостаточно VC токенов');
      return;
    }

    if (parseFloat(balances.BNB || '0') < parseFloat(bnbAmount)) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Insufficient BNB', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          required: bnbAmount,
          available: balances.BNB || '0'
        });
      }
      toast.error('Недостаточно BNB');
      return;
    }

    setLoading(true);
    
    try {
      if (process.env.NODE_ENV === 'development') {
        log.info('Loading configuration from static values', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG'
        });
      }
      
      // Статические значения конфигурации (проверены Node.js скриптами)
      // Заменяет config() вызов который зависал на 10+ секунд в browser
      const stakingVault = CONTRACTS.LP_LOCKER; // 0x9269baba99cE0388Daf814E351b4d556fA728D32
      const maxSlippageBps = 1000; // 10.0%
      const mevEnabled = false;
      const lpDivisor = ethers.parseEther('1000'); // 1e21
      const lpToVgRatio = 10;
      
      if (process.env.NODE_ENV === 'development') {
        log.info('Configuration loaded from static values', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          config: {
            stakingVault,
            maxSlippageBps,
            mevEnabled,
            lpDivisor: lpDivisor.toString(),
            lpToVgRatio
          }
        });
      }
      
      // Проверяем VG баланс vault'а с read-only контрактом
      if (!vgContract) {
        if (process.env.NODE_ENV === 'development') {
          log.error('VG contract unavailable', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        toast.error('VG контракт недоступен');
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        log.info('Checking VG vault balance', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          vault: stakingVault
        });
      }
      
      let vaultVGBalance: bigint;
      try {
        // ✅ Используем rpcService вместо создания собственного provider
        vaultVGBalance = await rpcService.withFallback(async (provider) => {
          const readOnlyVGContract = new ethers.Contract(CONTRACTS.VG_TOKEN, [
            "function balanceOf(address) view returns (uint256)"
          ], provider);
          
          return await (readOnlyVGContract as any).balanceOf(stakingVault);
        });
        
        if (process.env.NODE_ENV === 'development') {
          log.info('VG vault balance retrieved', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            vault: stakingVault,
            balance: ethers.formatEther(vaultVGBalance)
          });
        }
      } catch (balanceError) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Failed to get VG vault balance', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            vault: stakingVault
          }, balanceError as Error);
        }
        toast.error('Не удалось проверить VG баланс vault');
        return;
      }
      
      if (vaultVGBalance === 0n) {
        if (process.env.NODE_ENV === 'development') {
          log.error('VG vault empty - no tokens for reward', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        toast.error('VG vault пустой - обратитесь к администратору');
        return;
      }
      
      // Рассчитываем ожидаемую награду
      if (process.env.NODE_ENV === 'development') {
        log.info('Calculating expected reward', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG'
        });
      }
      
      const expectedLp = (vcAmountWei * bnbAmountWei) / lpDivisor;
      const expectedVGReward = expectedLp * BigInt(lpToVgRatio);
      
      if (process.env.NODE_ENV === 'development') {
        log.info('Expected LP', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          expectedLp: ethers.formatEther(expectedLp)
        });
        log.info('Expected VG reward', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          expectedVGReward: ethers.formatEther(expectedVGReward)
        });
      }
      
      if (vaultVGBalance < expectedVGReward) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Insufficient VG in vault for reward', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            required: ethers.formatEther(expectedVGReward),
            available: ethers.formatEther(vaultVGBalance)
          });
        }
        toast.error(`Недостаточно VG в vault. Нужно: ${ethers.formatEther(expectedVGReward)}, доступно: ${ethers.formatEther(vaultVGBalance)}`);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        log.info('Checking and approving VC tokens', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG'
        });
      }
      
      // Check allowance with read-only contract
      let allowance: bigint;
      try {
        allowance = await rpcService.withFallback(async (provider) => {
          const readOnlyVCContract = new ethers.Contract(CONTRACTS.VC_TOKEN, [
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)"
          ], provider);
          
          return await (readOnlyVCContract as any).allowance(account, CONTRACTS.LP_LOCKER);
        });
        

        if (process.env.NODE_ENV === 'development') {
          log.info('Current VC allowance', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            allowance: ethers.formatEther(allowance)
          });
        }
      } catch (allowanceError) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Failed to get allowance', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            allowanceError
          }, allowanceError as Error);
        }
        toast.error('Не удалось проверить allowance');
        return;
      }

      // Separate try-catch for approve operations
      try {
        if (process.env.NODE_ENV === 'development') {
          log.info('Starting approve operation', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        
        // ✅ ДОБАВЛЯЕМ ПРОВЕРКУ ПОДКЛЮЧЕНИЯ вместо повторного запроса
        if (!account || !signer) {
          throw new Error('Кошелёк не подключён. Переподключите MetaMask.');
        }
        if (process.env.NODE_ENV === 'development') {
          log.info('Connection confirmed', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            address: account.slice(0, 6) + '...'
          });
        }

        if (process.env.NODE_ENV === 'development') {
          log.info('Creating VC contract with signer', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        const vcContractWithSigner = vcContract.connect(signer);
        if (process.env.NODE_ENV === 'development') {
          log.info('VC contract with signer created', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            created: !!vcContractWithSigner
          });
        }
        
        // Дополнительная диагностика контракта
        if (process.env.NODE_ENV === 'development') {
          log.info('VC contract diagnostics', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            contractAddress: CONTRACTS.VC_TOKEN,
            signerAddress: await signer.getAddress(),
            signerProvider: !!signer.provider,
            contractTarget: (vcContractWithSigner as any).target,
            contractInterface: !!(vcContractWithSigner as any).interface
          });
        }
        
        // Проверяем что approve функция существует
        try {
          const approveFn = (vcContractWithSigner as any).approve;
          if (process.env.NODE_ENV === 'development') {
            log.info('Approve function exists', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              exists: !!approveFn
            });
            log.info('Approve function type', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              type: typeof approveFn
            });
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            log.error('Failed to check approve function', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              error: e
            }, e as Error);
          }
        }
        
        const MAX_UINT256 = (2n ** 256n - 1n).toString();
        if (process.env.NODE_ENV === 'development') {
          log.info('MAX_UINT256', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            value: MAX_UINT256
          });
        }

        if (process.env.NODE_ENV === 'development') {
          log.info('Estimating gas for approve', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        let gasLimitOverride: bigint | undefined;
        try {
          const gasFn = (vcContractWithSigner as any).estimateGas?.approve;
          if (process.env.NODE_ENV === 'development') {
            log.info('Gas estimation function exists', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              exists: !!gasFn
            });
          }
          if (gasFn) {
            if (process.env.NODE_ENV === 'development') {
              log.info('Calling estimateGas.approve', {
                component: 'EarnVGWidget',
                function: 'handleEarnVG'
              });
            }
            const est: bigint = await gasFn(CONTRACTS.LP_LOCKER, MAX_UINT256);
            gasLimitOverride = (est * 120n) / 100n; // +20 %
            if (process.env.NODE_ENV === 'development') {
              log.info('Gas estimated', {
                component: 'EarnVGWidget',
                function: 'handleEarnVG',
                estimatedGas: est.toString(),
                withOverride: gasLimitOverride?.toString()
              });
            }
          }
        } catch (gasError) {
          if (process.env.NODE_ENV === 'development') {
            log.warn('Gas estimation failed, will use default', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              error: gasError
            }, gasError as Error);
          }
        }

        if (process.env.NODE_ENV === 'development') {
          log.info('Calling approve transaction', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
          log.info('Approve parameters', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            spender: CONTRACTS.LP_LOCKER,
            amount: MAX_UINT256,
            gasLimit: gasLimitOverride ? gasLimitOverride.toString() : 'default'
          });
        }
        
        // Уведомление для Arc browser пользователей
        toast.loading('Approve отправлен в MetaMask. Если не видите окно - кликните на иконку MetaMask в панели расширений!', {
          duration: 10000,
          id: 'arc-browser-help'
        });
        
        // Добавляем timeout для approve операции
        const approvePromise = (vcContractWithSigner as any).approve(
          CONTRACTS.LP_LOCKER,
          MAX_UINT256,
          gasLimitOverride ? { gasLimit: gasLimitOverride } : {}
        );

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Approve transaction timeout after 60 seconds')), 60000)
        );

        if (process.env.NODE_ENV === 'development') {
          log.info('Waiting for approve transaction (timeout 60s)', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        const approveTx = await Promise.race([approvePromise, timeoutPromise]);

        if (process.env.NODE_ENV === 'development') {
          log.info('Approve TX hash', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            hash: (approveTx as any).hash
          });
          log.info('Waiting for approve transaction confirmation', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }

        const receiptPromise = (approveTx as any).wait();
        const receiptTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Approve receipt timeout after 60 seconds')), 60000)
        );

        const approveReceipt = await Promise.race([receiptPromise, receiptTimeoutPromise]);

        if (process.env.NODE_ENV === 'development') {
          log.info('Approve receipt received', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            receipt: !!approveReceipt
          });
        }
        if ((approveReceipt as any).status !== 1) throw new Error('Approve transaction failed');

        if (process.env.NODE_ENV === 'development') {
          log.info('VC tokens approved', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
      } catch (approveError: any) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Approve failed', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            error: approveError
          }, approveError as Error);
          log.error('Approve error details', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            message: approveError.message,
            code: approveError.code,
            data: approveError.data,
            stack: approveError.stack
          });
        }
        
        if (approveError.message?.includes('user rejected')) {
          toast.error('Транзакция отклонена пользователем');
        } else if (approveError.message?.includes('insufficient funds')) {
          toast.error('Недостаточно средств для approve');
        } else if (approveError.message?.includes('timeout')) {
          toast.error('Approve не подтверждён в течение 60 с - проверьте MetaMask');
        } else if (approveError.message?.includes('execution reverted')) {
          toast.error('Approve отклонён контрактом - проверьте параметры');
        } else {
          toast.error(`Ошибка approve: ${approveError.message || 'Неизвестная ошибка'}`);
        }
        return;
      }

      const lpLockerWithSigner = lpLockerContract.connect(signer);

      toast.loading('Создание LP позиции и получение VG токенов...');
      
      let finalSlippage = 1500; // 15%
      try {
        if (finalSlippage > maxSlippageBps) {
          finalSlippage = Number(maxSlippageBps);
          if (process.env.NODE_ENV === 'development') {
            log.warn('Slippage reduced to maximum', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              finalSlippage: finalSlippage
            });
          }
        }
      } catch {
        if (process.env.NODE_ENV === 'development') {
          log.warn('Using default slippage', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
      }

      if (process.env.NODE_ENV === 'development') {
        log.info('Executing earnVG transaction', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          parameters: {
            vc: ethers.formatEther(vcAmountWei),
            bnb: ethers.formatEther(bnbAmountWei),
            slippage: finalSlippage
          }
        });
        log.info('Transaction parameters', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG',
          vc: ethers.formatEther(vcAmountWei),
          bnb: ethers.formatEther(bnbAmountWei),
          slippage: finalSlippage
        });
      }

      // Separate try-catch for transaction execution
      try {
        const tx = await (lpLockerWithSigner as any).earnVG(vcAmountWei, bnbAmountWei, finalSlippage, {
          value: bnbAmountWei,
          gasLimit: 500000,
        });
        
        if (process.env.NODE_ENV === 'development') {
          log.info('Transaction hash', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            hash: tx.hash
          });
        }
        toast.loading('Ожидание подтверждения транзакции...');
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          if (process.env.NODE_ENV === 'development') {
            log.info('Transaction successful', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG'
            });
            log.info('Gas used', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              gasUsed: receipt.gasUsed.toString()
            });
          }
          
          // Парсим события для получения деталей
          try {
            const events = receipt.logs;
            if (process.env.NODE_ENV === 'development') {
              log.info('Transaction events', {
                component: 'EarnVGWidget',
                function: 'handleEarnVG',
                events: events.length
              });
            }
            
            // Ищем событие VGEarned
            for (const event of events) {
              try {
                const decoded = lpLockerWithSigner.interface.parseLog(event);
                if (decoded && decoded.name === 'VGEarned') {
                  if (process.env.NODE_ENV === 'development') {
                    log.info('VG Earned event', {
                      component: 'EarnVGWidget',
                      function: 'handleEarnVG',
                      user: decoded.args.user,
                      vgAmount: ethers.formatEther(decoded.args.vgAmount)
                    });
                  }
                }
              } catch (e) {
                // Игнорируем события других контрактов
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              log.warn('Failed to parse events', {
                component: 'EarnVGWidget',
                function: 'handleEarnVG'
              }, e);
            }
          }
          
          toast.success('VG токены успешно получены!');
          
          // ✅ Глобальное обновление всех компонентов
          triggerGlobalRefresh();

          setVcAmount('');
          setBnbAmount('');
        } else {
          throw new Error('Transaction failed');
        }
      } catch (txError: any) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Transaction error', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            error: txError
          }, txError as Error);
        }
        
        // Детальное логирование ошибок транзакции
        if (txError.code) {
          if (process.env.NODE_ENV === 'development') {
            log.error('Error Code', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              code: txError.code
            });
          }
        }
        if (txError.data) {
          if (process.env.NODE_ENV === 'development') {
            log.error('Error Data', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              data: txError.data
            });
          }
        }
        if (txError.transaction) {
          if (process.env.NODE_ENV === 'development') {
            log.error('Transaction', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              transaction: txError.transaction
            });
          }
        }
        
        if (txError.message?.includes('Too frequent transactions')) {
          if (process.env.NODE_ENV === 'development') {
            log.info('MEV Protection active', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG'
            });
          }
          toast.error('MEV Protection: Подождите 5 минут между транзакциями');
        } else if (txError.message?.includes('Slippage exceeded')) {
          if (process.env.NODE_ENV === 'development') {
            log.warn('Slippage exceeded', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG'
            });
          }
          toast.error('Slippage превышен. Попробуйте позже');
        } else if (txError.message?.includes('insufficient funds')) {
          if (process.env.NODE_ENV === 'development') {
            log.error('Insufficient funds', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG'
            });
          }
          toast.error('Недостаточно средств');
        } else if (txError.message?.includes('user rejected')) {
          if (process.env.NODE_ENV === 'development') {
            log.error('User rejected transaction', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG'
            });
          }
          toast.error('Транзакция отклонена пользователем');
        } else if (txError.message?.includes('VG vault empty') || txError.message?.includes('Insufficient VG')) {
          if (process.env.NODE_ENV === 'development') {
            log.error('VG vault problem', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG'
            });
          }
          toast.error('VG vault пустой или недостаточно токенов для награды');
        } else {
          if (process.env.NODE_ENV === 'development') {
            log.error('Unknown transaction error', {
              component: 'EarnVGWidget',
              function: 'handleEarnVG',
              error: txError.message
            });
          }
          toast.error(`Ошибка транзакции: ${txError.message || 'Неизвестная ошибка'}`);
        }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Config error', {
          component: 'EarnVGWidget',
          function: 'handleEarnVG'
        }, error);
      }
      
      // Детальное логирование ошибок конфигурации
      if (error.code) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Config Error Code', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            code: error.code
          });
        }
      }
      if (error.data) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Config Error Data', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            data: error.data
          });
        }
      }
      
      if (error.message?.includes('Config timeout') || error.message?.includes('Fallback timeout')) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Config timeout occurred', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        toast.error('Timeout при получении конфигурации контракта. Попробуйте позже.');
      } else if (error.message?.includes('network')) {
        if (process.env.NODE_ENV === 'development') {
          log.error('Network problem', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG'
          });
        }
        toast.error('Проблема с подключением к сети BSC');
      } else {
        if (process.env.NODE_ENV === 'development') {
          log.error('Unknown config error', {
            component: 'EarnVGWidget',
            function: 'handleEarnVG',
            error: error.message
          });
        }
        toast.error(`Ошибка конфигурации: ${error.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLockLP = async () => {
    if (process.env.NODE_ENV === 'development') {
      log.info('Starting LockLP operation', {
        component: 'EarnVGWidget',
        function: 'handleLockLP',
        address: account,
        lpAmount
      });
    }
    
    if (!signer || !account || !lpLockerContract) {
      toast.error('Подключите кошелёк');
      return;
    }

    if (!lpAmount) {
      toast.error('Введите количество LP токенов');
      return;
    }

    const lpAmountWei = ethers.parseEther(lpAmount);

    if (parseFloat(balances.LP || '0') < parseFloat(lpAmount)) {
      toast.error('Недостаточно LP токенов');
      return;
    }

    setLoading(true);

    try {
      const lpLockerWithSigner = lpLockerContract.connect(signer);

      // Check if user has LP tokens for locking
      if (mode === 'lock') {
        // Получаем LP контракт для проверки баланса пользователя
        const lpTokenContract = new ethers.Contract(CONTRACTS.LP_TOKEN, [
          "function balanceOf(address) view returns (uint256)",
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)"
        ], signer);
        
        const userLPBalance = await (lpTokenContract as any).balanceOf(account);
        if (userLPBalance < lpAmountWei) {
          toast.error('Недостаточно LP токенов');
          return;
        }

        // Approve LP tokens to LP Locker contract
        const lpAllowance = await (lpTokenContract as any).allowance(account, CONTRACTS.LP_LOCKER);
        if (lpAllowance < lpAmountWei) {
          toast.loading('Подтверждение LP токенов...');
          const approveTx = await (lpTokenContract as any).approve(CONTRACTS.LP_LOCKER, lpAmountWei);
          await approveTx.wait();
        }

        // Lock LP tokens using LP Locker contract
        toast.loading('Блокировка LP токенов...');
        const tx = await (lpLockerWithSigner as any).lockLPTokens(lpAmountWei);
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success('LP токены заблокированы!');
          // ✅ Глобальное обновление всех компонентов
          triggerGlobalRefresh();
          setLpAmount('');
        }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        log.error('LockLP Error', {
          component: 'EarnVGWidget',
          function: 'handleLockLP',
          error: error
        }, error as Error);
      }
      
      if (error.message?.includes('Too frequent transactions')) {
        toast.error('MEV Protection: Подождите 5 минут между транзакциями');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Недостаточно средств для транзакции');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Транзакция отклонена пользователем');
      } else {
        toast.error(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
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
        
        // ✅ ПРАВИЛЬНАЯ ФОРМУЛА - оригинальная sqrt формула с исправленным коэффициентом
        // Math.sqrt для фронтенда правильная, контракт использует другую логику внутри
        const lpToVgRatio = 10; // ✅ Правильное значение из логов, не 15
        const lpAmount = Math.sqrt(vcValue * bnbValue);
        const vgReward = lpAmount * lpToVgRatio;
        
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    } else if (mode === 'lock') {
      if (!lpAmount) return '0';
      try {
        const lpValue = parseFloat(lpAmount);
        const lpToVgRatio = 10; // ✅ Правильное значение 
        const vgReward = lpValue * lpToVgRatio;
        return vgReward.toFixed(2);
      } catch {
        return '0';
      }
    }
    // Fallback return для всех остальных случаев
    return '0';
  };

  const refreshAllData = async () => {
    if (process.env.NODE_ENV === 'development') {
      log.info('Manual refresh triggered', {
        component: 'EarnVGWidget',
        function: 'refreshAllData'
      });
    }
    // ✅ Глобальное обновление всех компонентов
    triggerGlobalRefresh();
    await refreshPoolInfo();
  };

  if (!isConnected) {
    return (
      <div className={`card-ultra animate-enhanced-widget-chaos-1 ${className}`}>
        <div className="text-center">
          <Wallet className="h-16 w-16 text-blue-400 mb-6 mx-auto" />
          <h3 className="card-title text-xl font-bold text-white mb-3">Подключите кошелёк</h3>
          <p className="text-gray-300">
            Для использования LP Staking необходимо подключить MetaMask
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-ultra animate-enhanced-widget-chaos-1 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/80 to-orange-600/80 shadow-lg shadow-yellow-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Burn / Earn VG</h3>
            <p className="text-slate-300 text-sm">
              {mode === 'create' 
                ? 'Create and burn LP position to earn VG (10:1)'
                : 'Lock LP tokens and earn VG (10:1)'
              }
            </p>
          </div>
        </div>
          <button
            onClick={refreshAllData}
            disabled={poolLoading}
          className="p-3 backdrop-blur-xl bg-white/8 border border-orange-400/25 rounded-xl hover:bg-orange-500/15 transition-all duration-300 group"
          >
          <RefreshCw className={cn("h-5 w-5 text-orange-300/80 group-hover:text-white transition-colors duration-300", poolLoading && "animate-spin")} />
          </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-white/5 border border-yellow-400/15 p-1 mb-6">
        <button
          onClick={() => setMode('create')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
            mode === 'create'
              ? 'bg-gradient-to-r from-orange-500/80 to-red-600/80 text-white shadow-lg shadow-orange-500/25'
              : 'text-slate-200 hover:text-white hover:bg-orange-500/8'
          )}
        >
          Burn
        </button>
        <button
          onClick={() => setMode('lock')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
            mode === 'lock'
              ? 'bg-gradient-to-r from-purple-500/80 to-blue-600/80 text-white shadow-lg shadow-purple-500/25'
              : 'text-slate-200 hover:text-white hover:bg-purple-500/8'
          )}
        >
          LP Burn
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {mode === 'create' ? (
          <>
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/8 via-blue-400/5 to-cyan-400/4 border border-blue-400/20 rounded-xl p-4 hover:from-blue-500/12 hover:via-blue-400/8 hover:to-cyan-400/6 transition-all duration-300 shadow-lg shadow-blue-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/25 border border-blue-400/30 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-blue-300/90" />
                </div>
                <div className="text-sm text-blue-200/80">VC Balance</div>
              </div>
              <div className="text-2xl font-bold text-blue-300/90">
                {balancesLoading ? (
                  <div className="animate-pulse bg-blue-400/20 h-6 w-16 rounded"></div>
                ) : (
                  formatBalance(balances.VC || '0')
                )}
              </div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/8 via-yellow-400/5 to-orange-400/4 border border-yellow-400/20 rounded-xl p-4 hover:from-yellow-500/12 hover:via-yellow-400/8 hover:to-orange-400/6 transition-all duration-300 shadow-lg shadow-yellow-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/25 border border-yellow-400/30 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-yellow-300/90" />
                </div>
                <div className="text-sm text-yellow-200/80">BNB Balance</div>
              </div>
              <div className="text-2xl font-bold text-yellow-300/90">
                {balancesLoading ? (
                  <div className="animate-pulse bg-yellow-400/20 h-6 w-16 rounded"></div>
                ) : (
                  formatBalance(balances.BNB || '0')
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/8 via-purple-400/5 to-pink-400/4 border border-purple-400/20 rounded-xl p-4 hover:from-purple-500/12 hover:via-purple-400/8 hover:to-pink-400/6 transition-all duration-300 shadow-lg shadow-purple-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/25 border border-purple-400/30 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-purple-300/90" />
                </div>
                <div className="text-sm text-purple-200/80">LP Balance</div>
              </div>
              <div className="text-2xl font-bold text-purple-300/90">
                {balancesLoading ? (
                  <div className="animate-pulse bg-purple-400/20 h-6 w-16 rounded"></div>
                ) : (
                  formatBalance(balances.LP || '0')
                )}
              </div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/8 via-green-400/5 to-emerald-400/4 border border-green-400/20 rounded-xl p-4 hover:from-green-500/12 hover:via-green-400/8 hover:to-emerald-400/6 transition-all duration-300 shadow-lg shadow-green-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/25 border border-green-400/30 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-green-300/90" />
                </div>
                <div className="text-sm text-green-200/80">VG Balance</div>
              </div>
              <div className="text-2xl font-bold text-green-300/90">
                {balancesLoading ? (
                  <div className="animate-pulse bg-green-400/20 h-6 w-16 rounded"></div>
                ) : (
                  formatBalance(balances.VG || '0')
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pool Information */}
      {mode === 'create' && (
        <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/6 via-blue-500/4 to-indigo-500/3 border border-cyan-400/15 rounded-xl p-4 mb-6 hover:from-cyan-500/8 hover:via-blue-500/6 hover:to-indigo-500/4 transition-all duration-300 shadow-lg shadow-cyan-500/4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-cyan-200/80 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-300/80" />
              Pool Information
            </span>
            {!poolInfo.isLoaded && (
              <div className="flex items-center gap-1 text-xs text-yellow-300/80">
                <AlertCircle className="w-3 h-3" />
                Загрузка данных
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-cyan-300/80 mb-1">VC Reserve</div>
              <div className="font-medium text-white">
                {poolLoading ? (
                  <div className="animate-pulse bg-cyan-400/20 h-4 w-16 rounded"></div>
                ) : (
                  formatBalance(poolInfo.vcReserve)
                )}
              </div>
            </div>
            <div>
              <div className="text-cyan-300/80 mb-1">BNB Reserve</div>
              <div className="font-medium text-white">
                {poolLoading ? (
                  <div className="animate-pulse bg-cyan-400/20 h-4 w-16 rounded"></div>
                ) : (
                  formatBalance(poolInfo.bnbReserve)
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-cyan-400/15">
            <div className="text-xs text-cyan-300/80">Current Price</div>
            <div className="text-sm font-medium text-emerald-300/90">
              {poolLoading ? (
                <div className="animate-pulse bg-cyan-400/20 h-4 w-24 rounded"></div>
              ) : (
                `1 VC = ${poolInfo.price} BNB`
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-4 mb-6">
        {mode === 'create' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-white mb-2">VC Amount</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Coins className="h-4 w-4 text-blue-400/80" />
                </div>
                <input
                  type="number"
                  placeholder="Enter VC amount"
                  value={vcAmount}
                  onChange={(e) => setVcAmount(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl text-white placeholder-slate-400 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">BNB Amount (Auto-calculated)</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Coins className="h-4 w-4 text-yellow-400/80" />
                </div>
                <input
                  type="number"
                  placeholder={poolInfo.isLoaded ? "Auto-calculated from VC" : "Стандартное соотношение"}
                  value={bnbAmount}
                  onChange={(e) => setBnbAmount(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl text-white placeholder-slate-400 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/15 transition-all duration-300"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-white mb-2">LP Token Amount</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Coins className="h-4 w-4 text-purple-400/80" />
              </div>
              <input
                type="number"
                placeholder="Enter LP token amount"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl text-white placeholder-slate-400 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* VG Reward Preview */}
      {((mode === 'create' && vcAmount && bnbAmount) || (mode === 'lock' && lpAmount)) && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/6 to-blue-500/6 border border-green-500/15 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400/80" />
              Expected VG Reward:
            </span>
            <span className="text-lg font-bold text-green-400/90">
              {calculateVGReward()} VG
            </span>
          </div>
        </div>
      )}

      {/* Allowance Check Button */}
      {mode === 'create' && (
        <div className="mb-4">
          <button
            onClick={checkCurrentAllowance}
            disabled={checkingAllowance}
            className="w-full py-3 backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl text-white hover:bg-white/6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {checkingAllowance ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking allowance...
              </>
            ) : (
              <>
                <Info className="h-4 w-4" />
                Check VC Allowance ({formatBalance(currentAllowance)} VC)
              </>
            )}
          </button>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={mode === 'create' ? handleEarnVG : handleLockLP}
        disabled={
          loading || 
          (mode === 'create' && (!vcAmount || !bnbAmount)) ||
          (mode === 'lock' && !lpAmount)
        }
        className="w-full py-4 bg-gradient-to-r from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 group"
      >
        {loading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            Burn / Earn VG
          </>
        )}
      </button>

      {/* Information */}
      <div className="mt-6 backdrop-blur-xl bg-gradient-to-br from-slate-600/8 via-slate-500/5 to-slate-400/4 border border-slate-400/20 rounded-xl p-4 shadow-lg shadow-slate-500/5">
        <div className="font-medium text-slate-200/90 mb-3 text-sm">Important Information:</div>
        <div className="text-xs text-slate-300/80 space-y-1">
          <div>• LP tokens are burned forever (permanent burn)</div>
          <div>• Get 10 VG for every 1 LP token (instantly)</div>
          <div>• VG tokens can be used for governance</div>
          <div>• This is NOT staking - LP cannot be retrieved</div>
          {mode === 'lock' && (
            <div>• Make sure you have ready LP tokens VC/BNB</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarnVGWidget; 