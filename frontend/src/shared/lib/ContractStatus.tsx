import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { CONTRACTS, BSC_TESTNET } from '../config/contracts';

interface ContractInfo {
  address: string;
  name: string;
  exists: boolean;
  loading: boolean;
  error?: string;
}

// Вынесено за пределы компонента для избежания ворнинга useCallback
const contractList = [
  { address: CONTRACTS.PANCAKE_FACTORY, name: 'PancakeSwap Factory' },
  { address: CONTRACTS.PANCAKE_ROUTER, name: 'PancakeSwap Router' },
  { address: CONTRACTS.VC_TOKEN, name: 'VC Token' },
  { address: CONTRACTS.VG_TOKEN, name: 'VG Token' },
  { address: CONTRACTS.LP_TOKEN, name: 'LP Token' },
  { address: CONTRACTS.LP_LOCKER, name: 'LP Locker' },
];

export const ContractStatus: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  
  const isConnected = !!address;
  const isCorrectNetwork = chainId === BSC_TESTNET.chainId;
  
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [checking, setChecking] = useState(false);

  const checkContracts = useCallback(async () => {
    if (!publicClient || !isConnected || !isCorrectNetwork) return;

    setChecking(true);
    const results: ContractInfo[] = [];

    for (const contract of contractList) {
      try {
        const code = await publicClient.getBytecode({ address: contract.address as `0x${string}` });
        results.push({
          address: contract.address,
          name: contract.name,
          exists: !!code && code !== '0x',
          loading: false,
        });
      } catch (error: unknown) {
        results.push({
          address: contract.address,
          name: contract.name,
          exists: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setContracts(results);
    setChecking(false);
  }, [publicClient, isConnected, isCorrectNetwork]);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      checkContracts();
    }
  }, [isConnected, isCorrectNetwork, checkContracts]);

  if (!isConnected || !isCorrectNetwork) {
    return null;
  }

  return (
    <div className="liquid-glass animate-glass-float mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title text-xl font-bold text-white">🔍 Contract Status</h3>
        <button
          onClick={checkContracts}
          disabled={checking}
          className="btn-glass-blue disabled:opacity-50 text-white px-4 py-2 text-sm animate-glass-pulse"
        >
          {checking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive">
        {contracts.map((contract, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border animate-glass-float ${
              contract.exists
                ? 'glass-ultra border-green-500/30 hover:border-green-400/50'
                : 'glass-accent border-red-500/30 hover:border-red-400/50'
            } transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">{contract.name}</h4>
              <span
                className={`text-xs px-2 py-1 rounded animate-glass-pulse ${
                  contract.exists
                    ? 'btn-glass-green text-white'
                    : 'btn-glass-fire text-white'
                }`}
              >
                {contract.exists ? 'OK' : 'ERROR'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono break-all">
              {contract.address}
            </p>
            {contract.error && (
              <p className="text-xs text-red-400 mt-2">{contract.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 glass-ultra rounded-lg animate-glass-float">
        <h4 className="text-sm font-semibold text-yellow-400 mb-2">
          💡 Troubleshooting Tips:
        </h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Убедитесь что подключены к BSC Testnet (Chain ID: 97)</li>
          <li>• Проверьте что MetaMask работает корректно</li>
          <li>• Попробуйте обновить страницу</li>
          <li>• Если Factory показывает ERROR - проверьте адрес в constants</li>
        </ul>
      </div>
    </div>
  );
}; 