/**
 * Format numbers with proper decimal places and K/M/B suffixes
 */
export function formatNumber(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return '0';
  if (num === 0) return '0';
  
  // For small numbers, show more precision
  if (Math.abs(num) < 0.000001) return '< 0.000001';
  if (Math.abs(num) < 0.001) return num.toFixed(6);
  if (Math.abs(num) < 1) return num.toFixed(4);
  if (Math.abs(num) < 1000) return num.toFixed(decimals);
  
  // For large numbers, use suffixes
  if (Math.abs(num) < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (Math.abs(num) < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

/**
 * Format currency values (specifically for crypto)
 */
export function formatCurrency(value: string | number, decimals: number = 4, symbol?: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return '0';
  if (num === 0) return '0';
  
  let formatted: string;
  
  // For very small amounts
  if (Math.abs(num) < 0.000001) {
    formatted = '< 0.000001';
  } else if (Math.abs(num) < 0.001) {
    formatted = num.toFixed(6);
  } else if (Math.abs(num) < 1) {
    formatted = num.toFixed(decimals);
  } else {
    formatted = num.toFixed(decimals);
  }
  
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format percentage values
 */
export function formatPercentage(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return '0%';
  
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format token amounts with proper precision
 */
export function formatTokenAmount(value: string | number, decimals: number = 18): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return '0';
  if (num === 0) return '0';
  
  // Adjust precision based on value magnitude
  if (Math.abs(num) < 0.000001) return '< 0.000001';
  if (Math.abs(num) < 0.01) return num.toFixed(6);
  if (Math.abs(num) < 1) return num.toFixed(4);
  if (Math.abs(num) < 1000) return num.toFixed(2);
  
  return formatNumber(num, 2);
} 