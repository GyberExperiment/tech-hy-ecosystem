import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_INFO, BSC_TESTNET } from '../constants/contracts';
import { 
  Send, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  AlertTriangle, 
  Lock,
  CreditCard,
  Gift,
  Vote,
  Rocket,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TokenData {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  totalSupply: string;
  contract: any;
  icon: React.ReactNode;
  color: string;
}

const Tokens: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    vcContract, 
    vgContract, 
    vgVotesContract, 
    lpContract,
    provider 
  } = useWeb3();

  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveTo, setApproveTo] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'transfer' | 'approve'>('transfer');

  const tokenCards = [
    {
      symbol: 'VC',
      name: TOKEN_INFO.VC.name,
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      balance: balances.VC || '0',
      address: CONTRACTS.VC_TOKEN,
    },
    {
      symbol: 'VG',
      name: TOKEN_INFO.VG.name,
      icon: <Gift className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      balance: balances.VG || '0',
      address: CONTRACTS.VG_TOKEN,
    },
    {
      symbol: 'VGV',
      name: TOKEN_INFO.VG_VOTES.name,
      icon: <Vote className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      balance: balances.VGV || '0',
      address: CONTRACTS.VG_TOKEN_VOTES,
    },
    {
      symbol: 'LP',
      name: TOKEN_INFO.LP.name,
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      balance: balances.LP || '0',
      address: CONTRACTS.LP_TOKEN,
    },
  ];

  const fetchTokenData = async () => {
    if (!account || !isCorrectNetwork) return;
    
    setLoading(true);
    try {
      const tokenData: TokenData[] = [];

      for (const tokenInfo of tokenCards) {
        if (!tokenInfo.contract) continue;

        try {
          const [balance, decimals, totalSupply] = await Promise.all([
            tokenInfo.contract.balanceOf(account),
            tokenInfo.contract.decimals(),
            tokenInfo.contract.totalSupply(),
          ]);

          tokenData.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            balance: ethers.formatUnits(balance, decimals),
            decimals: Number(decimals),
            totalSupply: ethers.formatUnits(totalSupply, decimals),
            contract: tokenInfo.contract,
            icon: tokenInfo.icon,
            color: tokenInfo.color,
          });
        } catch (error) {
          console.error(`Error fetching ${tokenInfo.symbol} data:`, error);
        }
      }

      setTokens(tokenData);
    } catch (error) {
      console.error('Error fetching token data:', error);
      toast.error('Ошибка загрузки данных токенов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchTokenData();
    }
  }, [account, isConnected, isCorrectNetwork]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Адрес скопирован!');
  };

  const handleTransfer = async () => {
    if (!selectedToken || !transferTo || !transferAmount) {
      toast.error('Заполните все поля');
      return;
    }

    if (!ethers.isAddress(transferTo)) {
      toast.error('Некорректный адрес');
      return;
    }

    try {
      const amount = ethers.parseUnits(transferAmount, selectedToken.decimals);
      
      toast.loading('Отправка транзакции...', { id: 'transfer' });
      
      const tx = await selectedToken.contract.transfer(transferTo, amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'transfer' });
      
      await tx.wait();
      
      toast.success('Перевод выполнен успешно!', { id: 'transfer' });
      
      // Обновляем балансы
      fetchTokenData();
      
      // Очищаем форму
      setTransferTo('');
      setTransferAmount('');
      
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(`Ошибка перевода: ${error.message}`, { id: 'transfer' });
    }
  };

  const handleApprove = async () => {
    if (!selectedToken || !approveTo || !approveAmount) {
      toast.error('Заполните все поля');
      return;
    }

    if (!ethers.isAddress(approveTo)) {
      toast.error('Некорректный адрес');
      return;
    }

    try {
      const amount = ethers.parseUnits(approveAmount, selectedToken.decimals);
      
      toast.loading('Отправка транзакции...', { id: 'approve' });
      
      const tx = await selectedToken.contract.approve(approveTo, amount);
      
      toast.loading('Ожидание подтверждения...', { id: 'approve' });
      
      await tx.wait();
      
      toast.success('Approve выполнен успешно!', { id: 'approve' });
      
      // Очищаем форму
      setApproveTo('');
      setApproveAmount('');
      
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(`Ошибка approve: ${error.message}`, { id: 'approve' });
    }
  };

  const setMaxAmount = () => {
    if (selectedToken) {
      if (activeTab === 'transfer') {
        setTransferAmount(selectedToken.balance);
      } else {
        setApproveAmount(selectedToken.balance);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Connect Your Wallet
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Please connect your wallet to manage tokens
          </p>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-3xl font-bold mb-4 text-red-400">
            Wrong Network Detected
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Please switch to BSC Testnet to manage tokens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Token Management
          </h1>
          <p className="text-xl text-gray-400 mt-2">
            Управление вашими токенами в экосистеме
          </p>
        </div>
        <button
          onClick={fetchTokenData}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Send className="mr-3 text-blue-400" />
            Ваши токены
          </h2>

          <div className="space-y-4">
            {tokens.map((token) => (
              <div 
                key={token.symbol} 
                className={`card cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedToken?.symbol === token.symbol 
                    ? 'ring-2 ring-blue-500/50 bg-blue-500/10' 
                    : ''
                }`}
                onClick={() => setSelectedToken(token)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-xl`}>
                      {token.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{token.symbol}</h3>
                      <p className="text-sm text-gray-400">{token.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 font-mono">
                          {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(token.address);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                        <a
                          href={`${BSC_TESTNET.blockExplorer}/token/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {loading ? '...' : formatBalance(token.balance)}
                    </p>
                    <p className="text-sm text-gray-400">{token.symbol}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total: {formatBalance(token.totalSupply)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operations Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <CheckCircle className="mr-3 text-green-400" />
            Операции с токенами
          </h2>

          {selectedToken ? (
            <div className="card">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedToken.color} flex items-center justify-center text-xl`}>
                  {selectedToken.icon}
                </div>
                <div>
                  <h3 className="font-bold text-xl">{selectedToken.symbol}</h3>
                  <p className="text-gray-400">{selectedToken.name}</p>
                  <p className="text-sm text-gray-500">
                    Баланс: {formatBalance(selectedToken.balance)} {selectedToken.symbol}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6">
                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'transfer'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Перевод
                </button>
                <button
                  onClick={() => setActiveTab('approve')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'approve'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Approve
                </button>
              </div>

              {/* Transfer Tab */}
              {activeTab === 'transfer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Адрес получателя</label>
                    <input
                      type="text"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="0x..."
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Количество
                      <button
                        onClick={setMaxAmount}
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        (MAX)
                      </button>
                    </label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.0"
                      className="input-field w-full"
                      step="any"
                    />
                  </div>
                  <button
                    onClick={handleTransfer}
                    disabled={!transferTo || !transferAmount}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Отправить</span>
                  </button>
                </div>
              )}

              {/* Approve Tab */}
              {activeTab === 'approve' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Адрес spender</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={approveTo}
                        onChange={(e) => setApproveTo(e.target.value)}
                        placeholder="0x..."
                        className="input-field w-full"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setApproveTo(CONTRACTS.LP_LOCKER)}
                          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                        >
                          LP Locker
                        </button>
                        <button
                          onClick={() => setApproveTo(CONTRACTS.VG_TOKEN_VOTES)}
                          className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded"
                        >
                          VG Votes
                        </button>
                        <button
                          onClick={() => setApproveTo(CONTRACTS.PANCAKE_ROUTER)}
                          className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded"
                        >
                          PancakeSwap
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Количество
                      <button
                        onClick={setMaxAmount}
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        (MAX)
                      </button>
                    </label>
                    <input
                      type="number"
                      value={approveAmount}
                      onChange={(e) => setApproveAmount(e.target.value)}
                      placeholder="0.0"
                      className="input-field w-full"
                      step="any"
                    />
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={!approveTo || !approveAmount}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-xl font-bold mb-2">Выберите токен</h3>
              <p className="text-gray-400">
                Выберите токен из списка слева для выполнения операций
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center group hover:scale-105 transition-transform duration-200">
          <Coins className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h3 className="text-xl font-bold mb-2">Token Operations</h3>
          <p className="text-gray-400 mb-4">Transfer and approve tokens</p>
          <button className="btn-primary">
            Manage Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tokens; 