import { useEffect } from 'react';
import { useChainId } from 'wagmi';
import { rpcService } from '../api/rpcService';
import { getRpcEndpointsByChainId } from '../config/rpcEndpoints';
import { log } from '../lib/logger';

/**
 * Hook для динамического переключения RPC эндпоинтов в зависимости от сети
 * Автоматически обновляет rpcService при смене chainId в MetaMask
 */
export const useRpcService = () => {
  const chainId = useChainId();
  
  useEffect(() => {
    if (!chainId) return;
    
    try {
      const newEndpoints = getRpcEndpointsByChainId(chainId);
      
      log.info('RpcService: Switching networks', {
        component: 'useRpcService',
        previousChain: 'unknown',
        newChain: chainId,
        newEndpoints: newEndpoints.length,
        firstEndpoint: newEndpoints[0]
      });
      
      // Reinitialize rpcService with new endpoints
      rpcService.updateEndpoints(newEndpoints);
      
    } catch (error) {
      log.error('RpcService: Failed to switch networks', {
        component: 'useRpcService',
        chainId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [chainId]);
  
  return {
    chainId,
    isMainnet: chainId === 56,
    isTestnet: chainId === 97,
    isSupported: chainId === 56 || chainId === 97
  };
};

export default useRpcService; 