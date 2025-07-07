import React from 'react';
import { cn } from '../lib/cn';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'input' | 'stats';
  lines?: number;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animated?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'text',
  lines = 1,
  width = '100%',
  height,
  rounded = 'md',
  animated = true,
}) => {
  const baseClasses = cn(
    'bg-gradient-to-r from-slate-700/20 via-slate-600/30 to-slate-700/20 bg-[length:200%_100%]',
    {
      'animate-pulse': !animated,
      'animate-shimmer': animated,
      'rounded-none': rounded === 'none',
      'rounded-sm': rounded === 'sm',
      'rounded-md': rounded === 'md',
      'rounded-lg': rounded === 'lg',
      'rounded-xl': rounded === 'xl',
      'rounded-full': rounded === 'full',
    },
    className
  );

  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          width: width,
          height: height || '1em',
        };
      case 'card':
        return {
          width: width,
          height: height || '200px',
        };
      case 'avatar':
        return {
          width: width || '48px',
          height: height || '48px',
        };
      case 'button':
        return {
          width: width || '120px',
          height: height || '40px',
        };
      case 'input':
        return {
          width: width,
          height: height || '48px',
        };
      case 'stats':
        return {
          width: width,
          height: height || '80px',
        };
      default:
        return {
          width: width,
          height: height || '1em',
        };
    }
  };

  // Multi-line text skeleton
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={baseClasses}
            style={{
              ...getVariantStyles(),
              width: index === lines - 1 ? '75%' : width, // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={baseClasses}
      style={getVariantStyles()}
      role="status"
      aria-label="Loading content"
    />
  );
};

// Специализированные компоненты
export const BalanceCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl p-4', className)}>
    <div className="flex items-center gap-3 mb-2">
      <LoadingSkeleton variant="avatar" width="32px" height="32px" rounded="lg" />
      <LoadingSkeleton variant="text" width="100px" height="14px" />
    </div>
    <LoadingSkeleton variant="text" width="120px" height="28px" />
  </div>
);

export const SaleInfoSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl p-4', className)}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <LoadingSkeleton variant="avatar" width="16px" height="16px" rounded="full" />
        <LoadingSkeleton variant="text" width="140px" height="14px" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
      {[1, 2].map((i) => (
        <div key={i}>
          <LoadingSkeleton variant="text" width="80px" height="14px" className="mb-1" />
          <LoadingSkeleton variant="text" width="120px" height="16px" />
        </div>
      ))}
    </div>
    <div className="pt-3 border-t border-white/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {[1, 2].map((i) => (
          <div key={i}>
            <LoadingSkeleton variant="text" width="100px" height="14px" className="mb-1" />
            <LoadingSkeleton variant="text" width="80px" height="16px" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const UserStatsSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl p-4', className)}>
    <div className="flex items-center gap-2 mb-3">
      <LoadingSkeleton variant="avatar" width="16px" height="16px" rounded="full" />
      <LoadingSkeleton variant="text" width="120px" height="14px" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <LoadingSkeleton variant="text" width="90px" height="14px" className="mb-1" />
          <LoadingSkeleton variant="text" width="100px" height="16px" />
        </div>
      ))}
    </div>
  </div>
);

// Table Skeleton for TransactionHistory
export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <div className={cn('backdrop-blur-xl bg-white/3 border border-white/8 rounded-xl p-4', className)}>
    {/* Table Header */}
    <div className="grid grid-cols-4 gap-4 p-3 border-b border-white/10 mb-4">
      <LoadingSkeleton variant="text" width="80px" height="14px" />
      <LoadingSkeleton variant="text" width="100px" height="14px" />
      <LoadingSkeleton variant="text" width="60px" height="14px" />
      <LoadingSkeleton variant="text" width="90px" height="14px" />
    </div>
    
    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="grid grid-cols-4 gap-4 p-3 border-b border-white/5 last:border-b-0">
        <LoadingSkeleton variant="text" width="120px" height="16px" />
        <LoadingSkeleton variant="text" width="80px" height="16px" />
        <LoadingSkeleton variant="text" width="60px" height="16px" />
        <LoadingSkeleton variant="text" width="100px" height="16px" />
      </div>
    ))}
  </div>
);

// Компонент для полного виджета
export const VCSaleWidgetSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('card-ultra animate-enhanced-widget-chaos-1', className)}>
    {/* Header Skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="avatar" width="48px" height="48px" rounded="xl" />
        <div>
          <LoadingSkeleton variant="text" width="100px" height="20px" className="mb-1" />
          <LoadingSkeleton variant="text" width="200px" height="14px" />
        </div>
      </div>
      <LoadingSkeleton variant="button" width="48px" height="48px" rounded="xl" />
    </div>

    {/* Balances Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <BalanceCardSkeleton />
      <BalanceCardSkeleton />
    </div>

    {/* Sale Info Skeleton */}
    <SaleInfoSkeleton className="mb-6" />

    {/* Input Fields Skeleton */}
    <div className="space-y-4 mb-6">
      <div>
        <LoadingSkeleton variant="text" width="100px" height="14px" className="mb-2" />
        <LoadingSkeleton variant="input" rounded="xl" />
      </div>
      <div>
        <LoadingSkeleton variant="text" width="120px" height="14px" className="mb-2" />
        <LoadingSkeleton variant="input" rounded="xl" />
      </div>
    </div>

    {/* Purchase Button Skeleton */}
    <LoadingSkeleton variant="button" height="48px" rounded="xl" className="mb-6" />

    {/* User Stats Skeleton */}
    <UserStatsSkeleton />
  </div>
); 