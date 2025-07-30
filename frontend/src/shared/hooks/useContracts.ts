import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getContractsByChainId } from '../config/contracts';

/**
 * Hook для получения актуальных контрактов в зависимости от текущей сети
 * Автоматически переключается между mainnet и testnet контрактами
 */
export const useContracts = () => {
  const chainId = useChainId();
  
  const contracts = useMemo(() => {
    return getContractsByChainId(chainId);
  }, [chainId]);
  
  const networkInfo = useMemo(() => {
    return {
      chainId,
      isMainnet: chainId === 56,
      isTestnet: chainId === 97,
      isSupported: chainId === 56 || chainId === 97,
      networkName: chainId === 56 ? 'BSC Mainnet' : chainId === 97 ? 'BSC Testnet' : 'Unknown Network'
    };
  }, [chainId]);
  
  return {
    contracts,
    networkInfo,
    chainId
  };
};

export default useContracts; 