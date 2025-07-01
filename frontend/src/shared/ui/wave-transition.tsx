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
  intensity = 0.2, // Мягкая интенсивность для минимализма
  speed = 0.3, // Медленнее для элегантности
  height = 6 // Умеренная высота
}: WaveTransitionProps) => {
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  // Используем useId для стабильных ID между сервером и клиентом
  const uniqueId = useId()
  // Очищаем ID от потенциально проблемных символов для SVG  
  const cleanId = uniqueId.replace(/[^a-zA-Z0-9]/g, '') || `wave-${Date.now()}`
  const gradientId = `wave-gradient-${cleanId}`
  const filterId = `wave-filter-${cleanId}`
  
  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Clean minimalist colors - мягкие элегантные тона
  const cleanColors = [
    '#4285F4', // Clean Blue
    '#34A853', // Clean Green  
    '#00BCD4', // Clean Teal
    '#9C27B0', // Clean Purple
    '#FF8F00', // Clean Orange
    '#607D8B', // Clean Blue Gray
    '#795548', // Clean Brown
    '#8BC34A'  // Clean Light Green
  ]

  // Простая и надежная функция генерации SVG path
  const generateWavePath = (phase: number = 0, amplitude: number = 10): string => {
    try {
      // Безопасные значения по умолчанию
      const safePhase = Number.isFinite(phase) ? phase : 0
      const safeAmplitude = Number.isFinite(amplitude) && amplitude > 0 ? amplitude : 10
      
      // Простая синусоидальная волна
      const points = []
      for (let x = 0; x <= 100; x += 10) {
        const y = 50 + Math.sin((x / 100) * Math.PI * 2 + safePhase) * safeAmplitude
        const safeY = Math.max(20, Math.min(80, y))
        points.push(`${x},${safeY}`)
      }
      
      const path = `M0,50 L${points.join(' L')} L100,50 V100 H0 Z`
      
      // Финальная проверка
      if (!path || path.includes('undefined') || path.includes('NaN')) {
        return 'M0,50 L100,50 V100 H0 Z'
      }
      
      return path
    } catch (error) {
      console.warn('Wave generation error:', error)
      return 'M0,50 L100,50 V100 H0 Z'
    }
  }

  if (prefersReducedMotion) {
    return (
      <div 
        className={`w-full overflow-hidden ${className}`}
        style={{ height: `${height}px` }}
      >
        <div 
          className="w-full h-full"
          style={{
            background: `linear-gradient(90deg, ${cleanColors[0]}20, ${cleanColors[1]}15)`
          }}
        />
      </div>
    )
  }
  
  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Clean minimalist background base */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            ${cleanColors[0]}12 0%, 
            ${cleanColors[1]}08 50%, 
            ${cleanColors[2]}10 100%)`,
          opacity: 0.6
        }}
      />
      
      {/* Мягкие SVG волны */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        style={{ opacity: 0.7 }}
      >
        <defs>
          {/* Clean gradient definition */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={cleanColors[0]} stopOpacity="0.3" />
            <stop offset="50%" stopColor={cleanColors[1]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={cleanColors[2]} stopOpacity="0.25" />
          </linearGradient>
          
          {/* Soft blur filter */}
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>
        
        {/* УЛУЧШЕННЫЕ мягкие анимированные волны с дополнительной защитой */}
        {[0, 1, 2].map((index) => {
          const basePhase = index * Math.PI * 0.5
          const baseAmplitude = Math.max(2, (height || 6) * (intensity || 0.2) * (1 - index * 0.3))
          
          // Генерируем 3 безопасных кадра анимации
          const frame1 = generateWavePath(basePhase, baseAmplitude)
          const frame2 = generateWavePath(basePhase + Math.PI, baseAmplitude)
          const frame3 = generateWavePath(basePhase + Math.PI * 2, baseAmplitude)
          
          return (
            <motion.path
              key={`wave-${index}-${cleanId}`}
              d={frame1}
              fill={`url(#${gradientId})`}
              filter={`url(#${filterId})`}
              animate={{
                d: [frame1, frame2, frame3, frame1]
              }}
              transition={{
                duration: 20 + index * 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ 
                opacity: 0.6 - index * 0.15
              }}
            />
          )
        })}
      </svg>
      
      {/* Soft shimmer overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: `linear-gradient(45deg, 
            transparent 0%, 
            ${cleanColors[0]}15 20%, 
            transparent 40%, 
            ${cleanColors[2]}10 60%, 
            transparent 80%, 
            ${cleanColors[1]}08 100%)`,
          backgroundSize: '300% 300%'
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Clean edge highlights */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to right, 
            ${cleanColors[0]}30 0%, 
            transparent 20%, 
            transparent 80%, 
            ${cleanColors[2]}25 100%)`
        }}
      />
      
      {/* Subtle ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, 
            ${cleanColors[1]}08 0%, 
            transparent 70%)`
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
} 