import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectionDebug: React.FC = () => {
  const { 
    provider, 
    signer, 
    account, 
    isConnected, 
    isCorrectNetwork,
    vcContract,
    vgContract,
    vgVotesContract,
    lpContract
  } = useWeb3();

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-sm font-mono">
      <h3 className="text-white font-bold mb-2">🔍 Web3 Debug Info:</h3>
      <div className="space-y-1 text-gray-300">
        <div>Provider: {provider ? '✅ Connected' : '❌ Not connected'}</div>
        <div>Signer: {signer ? '✅ Available' : '❌ Not available'}</div>
        <div>Account: {account || '❌ No account'}</div>
        <div>Connected: {isConnected ? '✅ Yes' : '❌ No'}</div>
        <div>Correct Network: {isCorrectNetwork ? '✅ BSC Testnet' : '❌ Wrong network'}</div>
        <div>VC Contract: {vcContract ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div>VG Contract: {vgContract ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div>VGVotes Contract: {vgVotesContract ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div>LP Contract: {lpContract ? '✅ Loaded' : '❌ Not loaded'}</div>
      </div>
    </div>
  );
};

export default ConnectionDebug; 