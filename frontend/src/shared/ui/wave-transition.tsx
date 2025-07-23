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
    '#8BC34A'  // Dark Neon Green
  ]

  // БЕЗОПАСНАЯ функция генерации SVG path - гарантированно без undefined
  const generateWavePath = (phase: number = 0, amplitude: number = 10): string => {
    // Константные безопасные пути
    const SAFE_STATIC_PATH = 'M0,50 L100,50 V100 H0 Z'
    
    try {
      // Проверка входных параметров
      if (!Number.isFinite(phase) || !Number.isFinite(amplitude)) {
        return SAFE_STATIC_PATH
      }
      
      const safePhase = Number(phase) || 0
      const safeAmplitude = Math.max(1, Math.min(15, Number(amplitude) || 10))
      
      // Генерация точек с дополнительными проверками
      const points: string[] = []
      for (let x = 0; x <= 100; x += 20) { // Увеличиваем шаг для меньшего количества точек
        const angleRad = (x / 100) * Math.PI * 2 + safePhase
        const sinValue = Math.sin(angleRad)
        
        // Проверка на корректность вычислений
        if (!Number.isFinite(sinValue)) {
          return SAFE_STATIC_PATH
        }
        
        const y = 50 + sinValue * safeAmplitude
        const safeY = Math.max(20, Math.min(80, Math.round(y)))
        const safeX = Math.round(x)
        
        points.push(`${safeX},${safeY}`)
      }
      
      // Проверка корректности точек
      if (points.length === 0 || points.some(p => p.includes('undefined') || p.includes('NaN'))) {
        return SAFE_STATIC_PATH
      }
      
      const path = `M0,50 L${points.join(' L')} L100,50 V100 H0 Z`
      
      // Финальная проверка на undefined/NaN
      if (!path || path.includes('undefined') || path.includes('NaN') || path.length < 10) {
        return SAFE_STATIC_PATH
      }
      
      return path
    } catch (error) {
      console.warn('Wave generation error, using safe fallback:', error)
      return SAFE_STATIC_PATH
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
        
        {/* СТАТИЧЕСКИЕ БЕЗОПАСНЫЕ волны без анимации для устранения undefined ошибок */}
        {[0, 1, 2].map((index) => {
          // Используем статические безопасные пути для каждого слоя
          const staticPaths = [
            'M0,55 L20,52 L40,58 L60,48 L80,62 L100,50 V100 H0 Z', // Слой 1
            'M0,48 L20,58 L40,45 L60,55 L80,42 L100,50 V100 H0 Z', // Слой 2  
            'M0,52 L20,46 L40,54 L60,44 L80,56 L100,50 V100 H0 Z'  // Слой 3
          ]
          
          const safePath = staticPaths[index] || 'M0,50 L100,50 V100 H0 Z'
          
          return (
            <motion.path
              key={`wave-${index}-${cleanId}`}
              d={safePath}
              fill={`url(#${gradientId})`}
              filter={`url(#${filterId})`}
              animate={{
                // Простая анимация opacity вместо path morphing
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 8 + index * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3
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
      
              {/* Dark edge highlights */}
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