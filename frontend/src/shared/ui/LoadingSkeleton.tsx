import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full',
  rounded = false 
}) => {
  return (
    <div 
      className={`
        ${height} ${width} 
        bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 
        bg-[length:200%_100%] animate-pulse
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `}
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <Skeleton height="h-6" width="w-32" />
      <Skeleton height="h-5" width="w-20" />
    </div>
    <div className="space-y-3">
      <Skeleton height="h-4" width="w-full" />
      <Skeleton height="h-4" width="w-3/4" />
      <Skeleton height="h-4" width="w-1/2" />
    </div>
    <div className="mt-6">
      <Skeleton height="h-10" width="w-full" />
    </div>
  </div>
);

// Stats Skeleton
export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="card text-center">
        <Skeleton height="h-8" width="w-24" className="mx-auto mb-2" />
        <Skeleton height="h-5" width="w-16" className="mx-auto" />
      </div>
    ))}
  </div>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="card">
    <div className="mb-4">
      <Skeleton height="h-6" width="w-48" />
    </div>
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border border-slate-700 rounded-lg">
          <Skeleton height="h-10" width="w-10" rounded />
          <div className="flex-1 space-y-2">
            <Skeleton height="h-4" width="w-3/4" />
            <Skeleton height="h-3" width="w-1/2" />
          </div>
          <Skeleton height="h-8" width="w-20" />
        </div>
      ))}
    </div>
  </div>
);

// Pool Info Skeleton
export const PoolInfoSkeleton: React.FC = () => (
  <div className="card">
    <div className="mb-6">
      <Skeleton height="h-6" width="w-40" className="mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton height="h-4" width="w-24" className="mb-2" />
          <Skeleton height="h-8" width="w-32" />
        </div>
        <div>
          <Skeleton height="h-4" width="w-24" className="mb-2" />
          <Skeleton height="h-8" width="w-32" />
        </div>
      </div>
    </div>
    
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton height="h-4" width="w-20" />
        <Skeleton height="h-4" width="w-28" />
      </div>
      <div className="flex justify-between">
        <Skeleton height="h-4" width="w-24" />
        <Skeleton height="h-4" width="w-20" />
      </div>
      <div className="flex justify-between">
        <Skeleton height="h-4" width="w-28" />
        <Skeleton height="h-4" width="w-24" />
      </div>
    </div>
  </div>
);

// Input Form Skeleton
export const InputFormSkeleton: React.FC = () => (
  <div className="card">
    <Skeleton height="h-6" width="w-32" className="mb-4" />
    <div className="space-y-4">
      <div>
        <Skeleton height="h-4" width="w-20" className="mb-2" />
        <Skeleton height="h-12" width="w-full" />
      </div>
      <div>
        <Skeleton height="h-4" width="w-16" className="mb-2" />
        <Skeleton height="h-12" width="w-full" />
      </div>
      <Skeleton height="h-10" width="w-full" />
    </div>
  </div>
);

// Chart Skeleton
export const ChartSkeleton: React.FC = () => (
  <div className="card">
    <div className="flex items-center justify-between mb-6">
      <Skeleton height="h-6" width="w-32" />
      <div className="flex space-x-2">
        <Skeleton height="h-8" width="w-16" />
        <Skeleton height="h-8" width="w-16" />
        <Skeleton height="h-8" width="w-16" />
      </div>
    </div>
    <div className="h-64 bg-slate-800 rounded-lg flex items-end space-x-2 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div 
          key={i} 
          className="flex-1 bg-gradient-to-t from-blue-500/30 to-blue-500/60 rounded-t animate-pulse"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

// Page Loading
export const PageSkeleton: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="mb-8">
      <Skeleton height="h-8" width="w-64" className="mb-2" />
      <Skeleton height="h-5" width="w-96" />
    </div>
    
    <StatsSkeleton />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export default Skeleton; 