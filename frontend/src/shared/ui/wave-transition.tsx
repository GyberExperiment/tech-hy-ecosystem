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
  const gradientId = `clean-wave-gradient-${uniqueId}`
  const filterId = `clean-wave-filter-${uniqueId}`
  
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

  // Мягкая амплитуда для элегантного эффекта
  const waveHeight = height * intensity
  const animationDuration = 25 / speed // Медленные элегантные волны

  // Генерируем мягкие элегантные волны
  const generateCleanWavePath = (phase: number, amplitude: number) => {
    const points = []
    const segments = 6 // Меньше сегментов для простоты
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 100
      const y = Math.sin((i / segments) * Math.PI * 2 + phase) * amplitude
      points.push(`${x},${50 + y}`)
    }
    
    return `M0,50 C${points.join(' ')} 100,50 V100 H0 Z`
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
            background: `linear-gradient(90deg, ${cleanColors[0]}20, ${cleanColors[1]}15, ${cleanColors[2]}10)`
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
            ${cleanColors[1]}08 25%, 
            ${cleanColors[2]}10 50%, 
            ${cleanColors[3]}06 75%, 
            ${cleanColors[0]}08 100%)`,
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
            <stop offset="25%" stopColor={cleanColors[1]} stopOpacity="0.2" />
            <stop offset="50%" stopColor={cleanColors[2]} stopOpacity="0.25" />
            <stop offset="75%" stopColor={cleanColors[3]} stopOpacity="0.15" />
            <stop offset="100%" stopColor={cleanColors[0]} stopOpacity="0.2" />
          </linearGradient>
          
          {/* Soft blur filter */}
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feColorMatrix
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
            />
          </filter>
        </defs>
        
        {/* Мягкие анимированные волны */}
        {[0, 1, 2].map((index) => (
        <motion.path
            key={index}
            d={generateCleanWavePath(index * Math.PI * 0.6, waveHeight * (1 - index * 0.2))}
          fill={`url(#${gradientId})`}
            filter={`url(#${filterId})`}
          animate={{
            d: [
                generateCleanWavePath(index * Math.PI * 0.6, waveHeight * (1 - index * 0.2)),
                generateCleanWavePath(index * Math.PI * 0.6 + Math.PI * 2, waveHeight * (1 - index * 0.2)),
                generateCleanWavePath(index * Math.PI * 0.6 + Math.PI * 4, waveHeight * (1 - index * 0.2)),
            ]
          }}
          transition={{
              duration: animationDuration + index * 3,
            repeat: Infinity,
              ease: "linear",
              delay: index * 0.5
            }}
          style={{ 
              opacity: 0.6 - index * 0.15, // Мягкая непрозрачность
              mixBlendMode: 'normal' // Обычное смешивание
            }}
          />
        ))}
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
          duration: animationDuration * 2,
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
          duration: animationDuration * 1.5,
            repeat: Infinity,
          ease: "easeInOut"
          }}
        />
    </div>
  )
} 