import { useWeb3 } from '../contexts/Web3Context';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CONTRACTS } from '../constants/contracts';

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
  const { provider, isConnected, isCorrectNetwork } = useWeb3();
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [checking, setChecking] = useState(false);

  const checkContracts = useCallback(async () => {
    if (!provider || !isConnected || !isCorrectNetwork) return;

    setChecking(true);
    const results: ContractInfo[] = [];

    for (const contract of contractList) {
      try {
        const code = await provider.getCode(contract.address);
        results.push({
          address: contract.address,
          name: contract.name,
          exists: code !== '0x',
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
  }, [provider, isConnected, isCorrectNetwork]);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      checkContracts();
    }
  }, [isConnected, isCorrectNetwork, checkContracts]);

  if (!isConnected || !isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">🔍 Contract Status</h3>
        <button
          onClick={checkContracts}
          disabled={checking}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-all"
        >
          {checking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contracts.map((contract, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              contract.exists
                ? 'bg-green-900/20 border-green-700'
                : 'bg-red-900/20 border-red-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">{contract.name}</h4>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  contract.exists
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
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

      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
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