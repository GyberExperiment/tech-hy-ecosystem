'use client'
import { motion } from 'framer-motion'
import { useState, useEffect, useId } from 'react'

interface WaveTransitionProps {
  className?: string
  intensity?: number // от 0 до 1 - интенсивность волн
  speed?: number // скорость анимации
  height?: number // высота волн в пикселях
}

export const WaveTransition = ({ 
  className = '', 
  intensity = 0.15, // Минимальная интенсивность
  speed = 0.3, // Очень медленно для еле заметности
  height = 6 // Очень низкие волны
}: WaveTransitionProps) => {
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  // Используем useId для стабильных ID между сервером и клиентом
  const uniqueId = useId()
  const gradientId = `wave-gradient-${uniqueId}`
  
  // Защита от некорректных значений
  const safeHeight = typeof height === 'number' && !isNaN(height) && height > 0 ? height : 6
  const safeIntensity = typeof intensity === 'number' && !isNaN(intensity) ? Math.max(0, Math.min(1, intensity)) : 0.15
  const safeSpeed = typeof speed === 'number' && !isNaN(speed) && speed > 0 ? speed : 0.3
  
  useEffect(() => {
    // Определяем предпочтения пользователя по анимациям
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
    }
    
    checkReducedMotion()
    
    // Слушатель для изменения настроек анимации
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => checkReducedMotion()
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  // Если анимации отключены, не показываем волны
  if (prefersReducedMotion) {
    return null
  }
  
  // Функция для создания безопасных SVG path
  const createSafePath = (pathTemplate: string): string => {
    try {
      return pathTemplate
        .replace(/NaN/g, '0')
        .replace(/undefined/g, '0')
        .replace(/Infinity/g, '0')
    } catch (error) {
      console.warn('Error creating SVG path:', error)
      return `M0,${safeHeight/2} L1200,${safeHeight/2} L1200,${safeHeight} L0,${safeHeight} Z`
    }
  }
  
  return (
    <div 
      className={`fixed bottom-0 left-0 w-full pointer-events-none z-10 ${className}`}
      style={{ 
        height: `${safeHeight}px`
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 1200 ${safeHeight}`}
        preserveAspectRatio="none"
        className="absolute top-0 left-0"
      >
        <defs>
          {/* Subtle градиент интегрированный с дизайн-системой */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(30, 58, 138, 0.08)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.06)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.04)" />
          </linearGradient>
        </defs>
        
        {/* Основная еле заметная волна */}
        <motion.path
          d={createSafePath(`M0,${safeHeight*0.7} Q300,${safeHeight*0.6} 600,${safeHeight*0.7} Q900,${safeHeight*0.8} 1200,${safeHeight*0.7} L1200,${safeHeight} L0,${safeHeight} Z`)}
          fill={`url(#${gradientId})`}
          style={{ 
            opacity: safeIntensity
          }}
          animate={{
            d: [
              createSafePath(`M0,${safeHeight*0.7} Q300,${safeHeight*0.6} 600,${safeHeight*0.7} Q900,${safeHeight*0.8} 1200,${safeHeight*0.7} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*0.65} Q300,${safeHeight*0.75} 600,${safeHeight*0.65} Q900,${safeHeight*0.55} 1200,${safeHeight*0.65} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*0.8} Q300,${safeHeight*0.55} 600,${safeHeight*0.8} Q900,${safeHeight*0.9} 1200,${safeHeight*0.8} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*0.7} Q300,${safeHeight*0.6} 600,${safeHeight*0.7} Q900,${safeHeight*0.8} 1200,${safeHeight*0.7} L1200,${safeHeight} L0,${safeHeight} Z`)
            ]
          }}
          transition={{
            duration: 20 / safeSpeed,
            repeat: Infinity,
            ease: [0.25, 0.8, 0.25, 1] // Очень мягкий easing
          }}
        />
        
        {/* Вторая еще более тонкая волна */}
        <motion.path
          d={createSafePath(`M0,${safeHeight*0.75} Q400,${safeHeight*0.65} 800,${safeHeight*0.75} Q1000,${safeHeight*0.85} 1200,${safeHeight*0.75} L1200,${safeHeight} L0,${safeHeight} Z`)}
          fill="rgba(255, 255, 255, 0.03)"
          style={{ 
            opacity: safeIntensity * 0.7
          }}
          animate={{
            d: [
              createSafePath(`M0,${safeHeight*0.75} Q400,${safeHeight*0.65} 800,${safeHeight*0.75} Q1000,${safeHeight*0.85} 1200,${safeHeight*0.75} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*0.8} Q400,${safeHeight*0.7} 800,${safeHeight*0.8} Q1000,${safeHeight*0.6} 1200,${safeHeight*0.8} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*0.7} Q400,${safeHeight*0.8} 800,${safeHeight*0.7} Q1000,${safeHeight*0.9} 1200,${safeHeight*0.7} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*0.75} Q400,${safeHeight*0.65} 800,${safeHeight*0.75} Q1000,${safeHeight*0.85} 1200,${safeHeight*0.75} L1200,${safeHeight} L0,${safeHeight} Z`)
            ]
          }}
          transition={{
            duration: 15 / safeSpeed,
            repeat: Infinity,
            ease: [0.25, 0.8, 0.25, 1],
            delay: 5
          }}
        />
        
        {/* Тонкая контурная линия для подчеркивания */}
        <motion.path
          d={createSafePath(`M0,${safeHeight*0.7} Q300,${safeHeight*0.6} 600,${safeHeight*0.7} Q900,${safeHeight*0.8} 1200,${safeHeight*0.7}`)}
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="1"
          fill="none"
          style={{ 
            opacity: safeIntensity
          }}
          animate={{
            d: [
              createSafePath(`M0,${safeHeight*0.7} Q300,${safeHeight*0.6} 600,${safeHeight*0.7} Q900,${safeHeight*0.8} 1200,${safeHeight*0.7}`),
              createSafePath(`M0,${safeHeight*0.65} Q300,${safeHeight*0.75} 600,${safeHeight*0.65} Q900,${safeHeight*0.55} 1200,${safeHeight*0.65}`),
              createSafePath(`M0,${safeHeight*0.8} Q300,${safeHeight*0.55} 600,${safeHeight*0.8} Q900,${safeHeight*0.9} 1200,${safeHeight*0.8}`),
              createSafePath(`M0,${safeHeight*0.7} Q300,${safeHeight*0.6} 600,${safeHeight*0.7} Q900,${safeHeight*0.8} 1200,${safeHeight*0.7}`)
            ]
          }}
          transition={{
            duration: 20 / safeSpeed,
            repeat: Infinity,
            ease: [0.25, 0.8, 0.25, 1]
          }}
        />
      </svg>
    </div>
  )
} 