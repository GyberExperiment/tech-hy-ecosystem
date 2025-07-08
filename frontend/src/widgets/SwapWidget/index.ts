// SwapWidget - Token Swap with Dual Modes
export { default as SwapWidget } from './ui/SwapWidget';

export type {
  // Re-export types from VCSaleWidget for Buy VC mode
  VCSaleWidgetProps,
  SaleStats,
  UserStats,
  SecurityStatus,
  VCSaleState,
  VCSaleAction,
  VCSaleConfig,
  PurchaseParams,
  TransactionResult
} from '../VCSaleWidget';

// Additional SwapWidget specific types
export interface SwapWidgetProps {
  className?: string;
}

export interface SwapMode {
  mode: 'buyvc' | 'earnvg';
  isActive: boolean;
  description: string;
} 