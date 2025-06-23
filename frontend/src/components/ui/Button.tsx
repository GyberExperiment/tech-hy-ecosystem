import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation tap-highlight-none relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90',
        glow: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/25 transition-all duration-300',
        
        // ===== PREMIUM GLASSMORPHISM VARIANTS FROM AURA-DOMUS =====
        glass: 'backdrop-blur-[20px] backdrop-saturate-110 border-[0.5px] border-white/15 bg-white/15 text-white/95 hover:border-white/25 hover:backdrop-blur-[25px] hover:backdrop-saturate-[1.2] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 ease-premium',
        
        orange: 'backdrop-blur-[25px] backdrop-saturate-[1.2] border-[0.5px] bg-[var(--glass-orange)] border-[var(--glass-orange-border)] text-white/95 shadow-[0_8px_32px_rgba(164,107,23,0.15),0_1px_0_rgba(255,255,255,0.1)_inset,0_0_0_1px_rgba(212,157,50,0.1)_inset] hover:bg-[rgba(164,107,23,0.3)] hover:border-[rgba(212,157,50,0.5)] hover:shadow-[0_16px_50px_rgba(164,107,23,0.25),0_1px_0_rgba(255,255,255,0.15)_inset,0_0_0_1px_rgba(212,157,50,0.2)_inset] hover:scale-[1.03] hover:-translate-y-1.5 transition-all duration-300 ease-premium',
        
        blue: 'backdrop-blur-[25px] backdrop-saturate-[1.2] border-[0.5px] bg-[var(--glass-blue)] border-[var(--glass-blue-border)] text-white/95 shadow-[0_8px_32px_rgba(77,125,169,0.15),0_1px_0_rgba(255,255,255,0.1)_inset,0_0_0_1px_rgba(77,125,169,0.1)_inset] hover:bg-[rgba(77,125,169,0.3)] hover:border-[rgba(77,125,169,0.5)] hover:shadow-[0_16px_50px_rgba(77,125,169,0.25),0_1px_0_rgba(255,255,255,0.15)_inset,0_0_0_1px_rgba(77,125,169,0.2)_inset] hover:scale-[1.03] hover:-translate-y-1.5 transition-all duration-300 ease-premium',
        
        fire: 'backdrop-blur-[25px] backdrop-saturate-[1.2] border-[0.5px] bg-[var(--glass-fire)] border-[var(--glass-fire-border)] text-white/95 shadow-[0_8px_32px_rgba(165,52,52,0.15),0_1px_0_rgba(255,255,255,0.1)_inset,0_0_0_1px_rgba(165,52,52,0.1)_inset] hover:bg-[rgba(165,52,52,0.3)] hover:border-[rgba(165,52,52,0.5)] hover:shadow-[0_16px_50px_rgba(165,52,52,0.25),0_1px_0_rgba(255,255,255,0.15)_inset,0_0_0_1px_rgba(165,52,52,0.2)_inset] hover:scale-[1.03] hover:-translate-y-1.5 transition-all duration-300 ease-premium',
        
        green: 'backdrop-blur-[25px] backdrop-saturate-[1.2] border-[0.5px] bg-[var(--glass-green)] border-[var(--glass-green-border)] text-white/95 shadow-[0_8px_32px_rgba(16,144,52,0.15),0_1px_0_rgba(255,255,255,0.1)_inset,0_0_0_1px_rgba(16,144,52,0.1)_inset] hover:bg-[rgba(16,144,52,0.3)] hover:border-[rgba(16,144,52,0.5)] hover:shadow-[0_16px_50px_rgba(16,144,52,0.25),0_1px_0_rgba(255,255,255,0.15)_inset,0_0_0_1px_rgba(16,144,52,0.2)_inset] hover:scale-[1.03] hover:-translate-y-1.5 transition-all duration-300 ease-premium',
        
        clear: 'p-0 rounded-none bg-transparent backdrop-blur-none border-none shadow-none hover:scale-[1.02] hover:brightness-120 active:scale-[1.01] transition-all duration-150 ease-dramatic',
      },
      size: {
        default: 'h-10 px-4 py-2 min-h-[44px] rounded-lg',
        sm: 'h-9 rounded-md px-3 min-h-[40px] text-xs',
        lg: 'h-11 rounded-md px-8 min-h-[48px] text-base',
        xl: 'h-12 rounded-lg px-10 text-base min-h-[52px]',
        icon: 'h-10 w-10 min-h-[44px] min-w-[44px]',
        'icon-sm': 'h-8 w-8 min-h-[36px] min-w-[36px]',
        'icon-lg': 'h-12 w-12 min-h-[48px] min-w-[48px]',
        mobile: 'h-12 px-6 py-3 text-base min-h-[48px] w-full sm:w-auto',
        
        // Premium sizes for glassmorphism buttons
        premium: 'px-[clamp(30px,6vw,60px)] py-[clamp(12px,2vw,16px)] text-[clamp(0.9rem,2vw,1.1rem)] font-medium rounded-[clamp(12px,2vw,16px)]',
        'premium-lg': 'px-[clamp(40px,8vw,80px)] py-[clamp(16px,3vw,20px)] text-[clamp(1rem,2.5vw,1.2rem)] font-medium rounded-[clamp(16px,3vw,20px)]',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        bounce: 'hover:animate-bounce',
        glow: 'animate-pulse-glow',
        shimmer: 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:via-transparent before:to-white/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:z-[1]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    // Add shimmer effect for glassmorphism variants
    const isGlassmorphism = ['glass', 'orange', 'blue', 'fire', 'green'].includes(variant || '')
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, animation, className }),
          loading && 'cursor-not-allowed opacity-70',
          disabled && isGlassmorphism && 'bg-gray-500/15 backdrop-blur-[15px] backdrop-saturate-80 border-white/5 text-white/40 cursor-not-allowed hover:transform-none hover:filter-none hover:scale-100 hover:translate-y-0',
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer effect for glassmorphism buttons */}
        {isGlassmorphism && !disabled && !loading && (
          <span 
            className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300 z-[1] pointer-events-none"
            aria-hidden="true"
          />
        )}
        
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent z-[2]" />
        )}
        {leftIcon && !loading && (
          <span className="mr-2 z-[2] relative">{leftIcon}</span>
        )}
        <span className="z-[2] relative">{children}</span>
        {rightIcon && (
          <span className="ml-2 z-[2] relative">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants } 