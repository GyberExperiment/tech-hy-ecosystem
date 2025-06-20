import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS } from '../constants/contracts';
import { toast } from 'react-hot-toast';
import { Coins, Zap, TrendingUp, Wallet, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTokenData } from '../hooks/useTokenData';
import { usePoolInfo } from '../hooks/usePoolInfo';
import { log } from '../utils/logger';
import { getAllRpcEndpoints } from '../constants/rpcEndpoints';

interface EarnVGWidgetProps {
  className?: string;
}

const EarnVGWidget: React.FC<EarnVGWidgetProps> = ({ className = '' }) => {
  const { account, signer, isConnected, vcContract, lpLockerContract, vgContract, updateBSCTestnetRPC } = useWeb3();
  
  // Use centralized hooks
  const { balances, loading: balancesLoading, fetchTokenData } = useTokenData();
  const { poolInfo, loading: poolLoading, refreshPoolInfo } = usePoolInfo();
  
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
      
      if (process.env.NODE_ENV === 'development') {
        log.debug('Auto-calculated BNB amount from VC', {
          component: 'EarnVGWidget',
          vcAmount,
          bnbAmount: calculatedBnb,
          ratio: ratio.toFixed(8)
        });
      }
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
  }, [vcAmount, poolInfo]);

  // Auto-update BNB amount when VC changes
  useEffect(() => {
    if (calculatedBnbAmount && calculatedBnbAmount !== bnbAmount) {
      setBnbAmount(calculatedBnbAmount);
    }
  }, [calculatedBnbAmount, bnbAmount]);

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
      
      const readOnlyProvider = new ethers.JsonRpcProvider(getAllRpcEndpoints()[0]);
      const readOnlyVCContract = new ethers.Contract(CONTRACTS.VC_TOKEN, [
        "function allowance(address owner, address spender) view returns (uint256)"
      ], readOnlyProvider);
      
      const allowance = await (readOnlyVCContract as any).allowance(account, CONTRACTS.LP_LOCKER);
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
        // Создаем read-only VG контракт для проверки баланса
        const readOnlyProvider = new ethers.JsonRpcProvider(getAllRpcEndpoints()[0]);
        const readOnlyVGContract = new ethers.Contract(CONTRACTS.VG_TOKEN, [
          "function balanceOf(address) view returns (uint256)"
        ], readOnlyProvider);
        
        vaultVGBalance = await (readOnlyVGContract as any).balanceOf(stakingVault);
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
        const readOnlyProvider = new ethers.JsonRpcProvider(getAllRpcEndpoints()[0]);
        const readOnlyVCContract = new ethers.Contract(CONTRACTS.VC_TOKEN, [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)"
        ], readOnlyProvider);
        
        allowance = await (readOnlyVCContract as any).allowance(account, CONTRACTS.LP_LOCKER);
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
          
          // Refresh data
          setTimeout(() => {
            fetchTokenData(true);
            refreshPoolInfo();
          }, 2000);

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
          fetchTokenData(true);
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
    } else {
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
  };

  const refreshAllData = async () => {
    if (process.env.NODE_ENV === 'development') {
      log.info('Manual refresh triggered', {
        component: 'EarnVGWidget',
        function: 'refreshAllData'
      });
    }
    await fetchTokenData(true);
    await refreshPoolInfo();
  };

  if (!isConnected) {
    return (
      <div className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl ${className}`}>
        <div className="text-center">
          <Wallet className="h-16 w-16 text-blue-400 mb-6 mx-auto" />
          <h3 className="text-xl font-bold text-white mb-3">Подключите кошелёк</h3>
          <p className="text-gray-300">
            Для использования LP Staking необходимо подключить MetaMask
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("widget-mobile", className)}>
      <div className="widget-header-mobile">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30">
            <Zap className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-responsive-lg font-bold text-white">⚡ Получить VG токены</h3>
            <p className="text-gray-300 text-responsive-sm">
              {mode === 'create' 
                ? 'Создайте LP позицию и получите VG (10:1)'
                : 'Заблокируйте LP токены и получите VG (10:1)'
              }
            </p>
          </div>
        </div>
        <div className="mobile-stack">
          {/* Fix RPC Button */}
          <button
            onClick={updateBSCTestnetRPC}
            className="touch-target px-3 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-colors mobile-full-width"
            title="Исправить RPC endpoints если есть timeout ошибки"
          >
            Fix RPC
          </button>
          {/* Refresh Button */}
          <button
            onClick={refreshAllData}
            disabled={poolLoading}
            className="touch-target p-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw className={cn("h-5 w-5", poolLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-black/40 p-1 border border-gray-600/50 mb-4 sm:mb-6">
        <button
          onClick={() => setMode('create')}
          className={cn(
            'flex-1 px-3 py-3 text-responsive-sm font-medium rounded-lg transition-all duration-200 touch-target',
            mode === 'create'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          )}
        >
          Create LP
        </button>
        <button
          onClick={() => setMode('lock')}
          className={cn(
            'flex-1 px-3 py-3 text-responsive-sm font-medium rounded-lg transition-all duration-200 touch-target',
            mode === 'lock'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          )}
        >
          Lock LP Tokens
        </button>
      </div>

      {/* Balances */}
      <div className="grid-responsive-1-2 mb-4 sm:mb-6">
        {mode === 'create' ? (
          <>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-responsive-xs text-gray-400 mb-1">VC Balance</div>
              <div className="text-responsive-lg font-bold text-blue-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                ) : (
                  formatBalance(balances.VC || '0')
                )}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-responsive-xs text-gray-400 mb-1">BNB Balance</div>
              <div className="text-responsive-lg font-bold text-amber-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                ) : (
                  formatBalance(balances.BNB || '0')
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-responsive-xs text-gray-400 mb-1">LP Balance</div>
              <div className="text-responsive-lg font-bold text-purple-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
                ) : (
                  formatBalance(balances.LP || '0')
                )}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-black/30 border border-gray-600/50">
              <div className="text-responsive-xs text-gray-400 mb-1">VG Balance</div>
              <div className="text-responsive-lg font-bold text-green-400">
                {balancesLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded mx-auto"></div>
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
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-3 sm:p-4 border border-blue-500/30 mb-4 sm:mb-6">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between mb-3">
            <span className="text-responsive-sm font-medium text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Pool Information
            </span>
            {!poolInfo.isLoaded && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Fallback
              </div>
            )}
          </div>
          <div className="grid-responsive-1-2 text-responsive-sm">
            <div>
              <div className="text-gray-400 mb-1">VC Reserve</div>
              <div className="font-medium text-white">
                {poolLoading ? (
                  <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
                ) : (
                  formatBalance(poolInfo.vcReserve)
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">BNB Reserve</div>
              <div className="font-medium text-white">
                {poolLoading ? (
                  <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
                ) : (
                  formatBalance(poolInfo.bnbReserve)
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-500/30">
            <div className="text-xs text-gray-400">Current Price</div>
            <div className="text-responsive-sm font-medium text-green-400">
              {poolLoading ? (
                <div className="animate-pulse bg-gray-600 h-4 w-24 rounded"></div>
              ) : (
                `1 VC = ${poolInfo.price} BNB`
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {mode === 'create' ? (
          <>
            <div>
              <label className="block text-responsive-sm font-medium text-white mb-2">VC Amount</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Coins className="h-4 w-4 text-blue-400" />
                </div>
                <input
                  type="number"
                  placeholder="Enter VC amount"
                  value={vcAmount}
                  onChange={(e) => setVcAmount(e.target.value)}
                  disabled={loading}
                  className="mobile-input w-full pl-10 pr-4 bg-black/40 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors touch-manipulation"
                />
              </div>
            </div>

            <div>
              <label className="block text-responsive-sm font-medium text-white mb-2">BNB Amount (Auto-calculated)</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Coins className="h-4 w-4 text-amber-400" />
                </div>
                <input
                  type="number"
                  placeholder={poolInfo.isLoaded ? "Auto-calculated from VC" : "Using fallback ratio"}
                  value={bnbAmount}
                  onChange={(e) => setBnbAmount(e.target.value)}
                  disabled={loading}
                  className="mobile-input w-full pl-10 pr-4 bg-black/40 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors touch-manipulation"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-responsive-sm font-medium text-white mb-2">LP Token Amount</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Coins className="h-4 w-4 text-purple-400" />
              </div>
              <input
                type="number"
                placeholder="Enter LP token amount"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
                disabled={loading}
                className="mobile-input w-full pl-10 pr-4 bg-black/40 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors touch-manipulation"
              />
            </div>
          </div>
        )}
      </div>

      {/* VG Reward Preview */}
      {((mode === 'create' && vcAmount && bnbAmount) || (mode === 'lock' && lpAmount)) && (
        <div className="rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/40 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
            <span className="text-responsive-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Expected VG Reward:
            </span>
            <span className="text-responsive-lg font-bold text-green-400">
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
            className="touch-target w-full h-12 text-responsive-sm font-medium rounded-lg transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
          >
            {checkingAllowance ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Проверяем allowance...
              </>
            ) : (
              <>
                <Info className="h-4 w-4" />
                Проверить VC Allowance ({formatBalance(currentAllowance)} VC)
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
        className={cn(
          "touch-target w-full h-12 sm:h-14 text-responsive-base font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation",
          "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        )}
      >
        {loading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" />
            {mode === 'create' ? 'Create LP + Earn VG' : 'Lock LP + Earn VG'}
          </>
        )}
      </button>

      {/* Information */}
      <div className="mt-4 sm:mt-6 space-y-2 bg-black/20 rounded-lg p-3 sm:p-4 border border-gray-600/30">
        <div className="font-medium text-white mb-3 text-responsive-sm">Important Information:</div>
        <div className="text-responsive-xs text-gray-300 space-y-1">
          <div>• LP токены блокируются навсегда (permanent lock)</div>
          <div>• Получаете 10 VG за каждый 1 LP токен (мгновенно)</div>
          <div>• VG токены можно использовать для governance</div>
          <div>• Это НЕ стейкинг - LP нельзя забрать обратно</div>
          {mode === 'lock' && (
            <div>• Убедитесь, что у вас есть готовые LP токены VC/BNB</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarnVGWidget; 