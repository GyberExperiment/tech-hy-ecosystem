import { ethers } from 'ethers';

/**
 * Format timestamp to readable date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time ago from timestamp
 */
export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}д назад`;
  if (hours > 0) return `${hours}ч назад`;
  if (minutes > 0) return `${minutes}м назад`;
  return 'только что';
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string, decimals: number = 18, symbol?: string): string {
  try {
    const value = ethers.formatUnits(amount, decimals);
    const num = parseFloat(value);
    
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  } catch {
    return '0';
  }
}

/**
 * Format BNB amount
 */
export function formatBNB(amount: string): string {
  return formatTokenAmount(amount, 18, 'BNB');
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string, length: number = 10): string {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-4)}`;
}

/**
 * Format address for display
 */
export function formatAddress(address: string, length: number = 8): string {
  if (address.length <= length) return address;
  return `${address.slice(0, length)}...${address.slice(-4)}`;
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatNumber(num: number): string {
  if (num === 0) return '0';
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format gas amount
 */
export function formatGas(gasUsed: string, gasPrice?: string): string {
  try {
    const gas = parseFloat(gasUsed);
    if (gasPrice) {
      const price = parseFloat(gasPrice);
      const totalCost = (gas * price) / 1e18;
      return `${gas.toLocaleString()} (${totalCost.toFixed(6)} BNB)`;
    }
    return gas.toLocaleString();
  } catch {
    return gasUsed;
  }
} 