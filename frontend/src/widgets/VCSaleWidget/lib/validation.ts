import { ethers } from 'ethers';
import { VALIDATION_RULES, ERROR_MESSAGES, SUPPORTED_NETWORKS } from '../config/constants';

// Input validation utilities
export class ValidationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// NEW: Soft validation for input fields - doesn't block input
export const validateInputAmount = (amount: string): { isValid: boolean; error?: string } => {
  if (!amount || amount.trim() === '') {
    return { isValid: true }; // Allow empty fields during typing
  }

  // Allow partial input like ".", "0.", "0.0"
  if (amount === '.' || amount === '0.' || amount.endsWith('.')) {
    return { isValid: true };
  }

  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return { isValid: false, error: 'Invalid number format' };
  }

  if (numericAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  if (numericAmount > VALIDATION_RULES.MAX_VC_AMOUNT) {
    return { isValid: false, error: `Maximum ${VALIDATION_RULES.MAX_VC_AMOUNT} VC allowed` };
  }

  // Check for precision issues
  if (numericAmount > VALIDATION_RULES.SAFE_INTEGER_LIMIT) {
    return { isValid: false, error: 'Amount too large for safe calculation' };
  }

  // Validate decimal places
  const decimalParts = amount.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > VALIDATION_RULES.DECIMAL_PLACES) {
    return { isValid: false, error: `Maximum ${VALIDATION_RULES.DECIMAL_PLACES} decimal places allowed` };
  }

  return { isValid: true };
};

// EXISTING: Strict validation for form submission - can throw errors
export const validateVCAmount = (amount: string): void => {
  if (!amount || amount.trim() === '') {
    throw new ValidationError(ERROR_MESSAGES.INVALID_AMOUNT, 'EMPTY_AMOUNT');
  }

  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_AMOUNT, 'NAN_AMOUNT');
  }

  if (numericAmount <= 0) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_AMOUNT, 'NEGATIVE_AMOUNT');
  }

  if (numericAmount < VALIDATION_RULES.MIN_VC_AMOUNT) {
    throw new ValidationError(ERROR_MESSAGES.AMOUNT_TOO_LOW, 'MIN_AMOUNT');
  }

  if (numericAmount > VALIDATION_RULES.MAX_VC_AMOUNT) {
    throw new ValidationError(ERROR_MESSAGES.AMOUNT_TOO_HIGH, 'MAX_AMOUNT');
  }

  // Check for precision issues
  if (numericAmount > VALIDATION_RULES.SAFE_INTEGER_LIMIT) {
    throw new ValidationError('Amount too large for safe calculation', 'UNSAFE_AMOUNT');
  }

  // Validate decimal places
  const decimalParts = amount.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > VALIDATION_RULES.DECIMAL_PLACES) {
    throw new ValidationError(`Maximum ${VALIDATION_RULES.DECIMAL_PLACES} decimal places allowed`, 'TOO_MANY_DECIMALS');
  }
};

export const validateBNBBalance = (balance: string, required: string): void => {
  const balanceNum = parseFloat(balance);
  const requiredNum = parseFloat(required);
  
  if (isNaN(balanceNum) || isNaN(requiredNum)) {
    throw new ValidationError('Invalid balance data', 'INVALID_BALANCE');
  }
  
  if (balanceNum < requiredNum) {
    throw new ValidationError(ERROR_MESSAGES.INSUFFICIENT_BALANCE, 'INSUFFICIENT_BNB');
  }
};

export const validateNetwork = (chainId: number): void => {
  const supportedNetworks = Object.values(SUPPORTED_NETWORKS);
  if (!supportedNetworks.includes(chainId)) {
    throw new ValidationError(`Unsupported network. Please switch to BSC Mainnet or Testnet`, 'UNSUPPORTED_NETWORK');
  }
};

export const validateContractAddress = (address: string): void => {
  if (!address || !ethers.isAddress(address)) {
    throw new ValidationError('Invalid contract address', 'INVALID_CONTRACT');
  }
};

export const validateWalletAddress = (address: string): void => {
  if (!address || !ethers.isAddress(address)) {
    throw new ValidationError('Invalid wallet address', 'INVALID_WALLET');
  }
};

// Security utilities
export const sanitizeInput = (input: string): string => {
  return input.replace(/[^\d.-]/g, '').slice(0, 20); // Remove non-numeric, limit length
};

export const formatSafeNumber = (value: string | number, decimals: number = 6): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) return '0';
  if (num === 0) return '0';
  if (num < 0.000001) return '<0.000001';
  
  return num.toFixed(decimals);
};

export const isValidTransaction = (tx: any): boolean => {
  return tx && 
         typeof tx.hash === 'string' && 
         tx.hash.startsWith('0x') && 
         tx.hash.length === 66;
};

// Rate limiting utilities
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return true;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return false;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Wei conversion utilities with safety checks
export const safeParseEther = (amount: string): bigint => {
  try {
    validateVCAmount(amount);
    return ethers.parseEther(amount);
  } catch (error) {
    throw new ValidationError(`Invalid amount for Wei conversion: ${amount}`, 'WEI_CONVERSION_ERROR');
  }
};

export const safeFormatEther = (wei: bigint): string => {
  try {
    return ethers.formatEther(wei);
  } catch (error) {
    throw new ValidationError('Invalid Wei value for formatting', 'WEI_FORMAT_ERROR');
  }
};

// Transaction parameter validation
export const validateTransactionParams = (params: {
  to: string;
  value: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
}): void => {
  validateContractAddress(params.to);
  
  if (params.value < 0n) {
    throw new ValidationError('Transaction value cannot be negative', 'NEGATIVE_VALUE');
  }
  
  if (params.gasLimit && params.gasLimit < 21000n) {
    throw new ValidationError('Gas limit too low', 'LOW_GAS_LIMIT');
  }
  
  if (params.gasLimit && params.gasLimit > 10000000n) {
    throw new ValidationError('Gas limit too high', 'HIGH_GAS_LIMIT');
  }
}; 