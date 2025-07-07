import { useState, useEffect } from 'react';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const breakpoints: Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCurrentBreakpoint = (): BreakpointKey => {
    const { width } = windowSize;
    
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  };

  const isBreakpoint = (breakpoint: BreakpointKey): boolean => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;
  const isSmallMobile = windowSize.width < breakpoints.sm;

  const getResponsiveConfig = <T>(config: Partial<Record<BreakpointKey, T>>): T | undefined => {
    const currentBreakpoint = getCurrentBreakpoint();
    const orderedBreakpoints: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    
    // Find the first matching breakpoint in descending order
    const startIndex = orderedBreakpoints.indexOf(currentBreakpoint);
    for (let i = startIndex; i < orderedBreakpoints.length; i++) {
      const breakpoint = orderedBreakpoints[i];
      if (config[breakpoint] !== undefined) {
        return config[breakpoint];
      }
    }
    
    return undefined;
  };

  const getGridCols = (desktop: number = 2, tablet: number = 1, mobile: number = 1): number => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };

  const getSpacing = (desktop: string = 'gap-6', tablet: string = 'gap-4', mobile: string = 'gap-3'): string => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };

  const getPadding = (desktop: string = 'p-6', tablet: string = 'p-4', mobile: string = 'p-3'): string => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };

  return {
    windowSize,
    breakpoints,
    currentBreakpoint: getCurrentBreakpoint(),
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    getResponsiveConfig,
    getGridCols,
    getSpacing,
    getPadding,
  };
};

// Hook для адаптивных значений
export const useBreakpoint = () => {
  const { currentBreakpoint, isMobile, isTablet, isDesktop, isSmallMobile } = useResponsive();
  
  return {
    current: currentBreakpoint,
    isMobile,
    isTablet, 
    isDesktop,
    isSmallMobile,
    // Shortcuts for common responsive patterns
    cols: {
      default: isSmallMobile ? 1 : isMobile ? 1 : isTablet ? 2 : 3,
      cards: isSmallMobile ? 1 : isMobile ? 1 : isTablet ? 2 : isDesktop ? 2 : 3,
      stats: isSmallMobile ? 1 : isMobile ? 2 : isTablet ? 2 : 4,
    },
  };
}; 