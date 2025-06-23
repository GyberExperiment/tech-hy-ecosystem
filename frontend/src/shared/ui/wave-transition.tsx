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
  intensity = 0.4, // Максимальная интенсивность
  speed = 0.6, // Медленнее для элегантности
  height = 8 // Высота волн
}: WaveTransitionProps) => {
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  // Используем useId для стабильных ID между сервером и клиентом
  const uniqueId = useId()
  const gradientId = `wave-gradient-${uniqueId}`
  const foamGradientId = `foam-gradient-${uniqueId}`
  
  // Защита от некорректных значений
  const safeHeight = typeof height === 'number' && !isNaN(height) && height > 0 ? height : 16
  const safeIntensity = typeof intensity === 'number' && !isNaN(intensity) ? Math.max(0, Math.min(1, intensity)) : 1.0
  const safeSpeed = typeof speed === 'number' && !isNaN(speed) && speed > 0 ? speed : 0.8
  
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
      className={`fixed bottom-0 left-0 w-full pointer-events-none z-50 ${className}`}
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
          {/* Основной градиент моря - более яркий и контрастный */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(21, 94, 117, 0.4)" />
            <stop offset="40%" stopColor="rgba(21, 94, 117, 0.8)" />
            <stop offset="70%" stopColor="rgba(7, 43, 64, 0.9)" />
            <stop offset="100%" stopColor="rgba(7, 43, 64, 1)" />
          </linearGradient>
          
          {/* Градиент для пены */}
          <linearGradient id={foamGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="50%" stopColor="rgba(212, 157, 50, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.6)" />
          </linearGradient>
        </defs>
        
        {/* Фоновый слой моря */}
        <motion.path
          d={createSafePath(`M0,${safeHeight/2} Q300,${safeHeight/4} 600,${safeHeight/2} Q900,${safeHeight*3/4} 1200,${safeHeight/2} L1200,${safeHeight} L0,${safeHeight} Z`)}
          fill={`url(#${gradientId})`}
          style={{ 
            opacity: safeIntensity
          }}
          animate={{
            d: [
              createSafePath(`M0,${safeHeight/2} Q300,${safeHeight/4} 600,${safeHeight/2} Q900,${safeHeight*3/4} 1200,${safeHeight/2} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*3/8} Q300,${safeHeight*5/8} 600,${safeHeight*3/8} Q900,${safeHeight/8} 1200,${safeHeight*3/8} L1200,${safeHeight} L0,${safeHeight} Z`), 
              createSafePath(`M0,${safeHeight*5/8} Q300,${safeHeight/8} 600,${safeHeight*5/8} Q900,${safeHeight*7/8} 1200,${safeHeight*5/8} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight/2} Q300,${safeHeight/4} 600,${safeHeight/2} Q900,${safeHeight*3/4} 1200,${safeHeight/2} L1200,${safeHeight} L0,${safeHeight} Z`)
            ]
          }}
          transition={{
            duration: 5.0 / safeSpeed,
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94] // cubic-bezier для плавных океанских волн
          }}
        />
        
        {/* Средние волны с золотистым оттенком */}
        <motion.path
          d={createSafePath(`M0,${safeHeight*3/8} Q150,${safeHeight*5/8} 300,${safeHeight*3/8} Q450,${safeHeight/8} 600,${safeHeight*3/8} Q750,${safeHeight*5/8} 900,${safeHeight*3/8} Q1050,${safeHeight/8} 1200,${safeHeight*3/8} L1200,${safeHeight} L0,${safeHeight} Z`)}
          fill="rgba(212, 157, 50, 0.7)"
          style={{ 
            opacity: safeIntensity
          }}
          animate={{
            d: [
              createSafePath(`M0,${safeHeight*3/8} Q150,${safeHeight*5/8} 300,${safeHeight*3/8} Q450,${safeHeight/8} 600,${safeHeight*3/8} Q750,${safeHeight*5/8} 900,${safeHeight*3/8} Q1050,${safeHeight/8} 1200,${safeHeight*3/8} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight/2} Q150,${safeHeight/4} 300,${safeHeight/2} Q450,${safeHeight*3/4} 600,${safeHeight/2} Q750,${safeHeight/4} 900,${safeHeight/2} Q1050,${safeHeight*3/4} 1200,${safeHeight/2} L1200,${safeHeight} L0,${safeHeight} Z`), 
              createSafePath(`M0,${safeHeight/4} Q150,${safeHeight/2} 300,${safeHeight/4} Q450,0 600,${safeHeight/4} Q750,${safeHeight/2} 900,${safeHeight/4} Q1050,0 1200,${safeHeight/4} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight*3/8} Q150,${safeHeight*5/8} 300,${safeHeight*3/8} Q450,${safeHeight/8} 600,${safeHeight*3/8} Q750,${safeHeight*5/8} 900,${safeHeight*3/8} Q1050,${safeHeight/8} 1200,${safeHeight*3/8} L1200,${safeHeight} L0,${safeHeight} Z`)
            ]
          }}
          transition={{
            duration: 3.2 / safeSpeed,
            repeat: Infinity,
            ease: [0.23, 1, 0.32, 1], // cubic-bezier для элегантного движения
            delay: 0.8
          }}
        />
        
        {/* Передние волны с пеной */}
        <motion.path
          d={createSafePath(`M0,${safeHeight/4} Q200,${safeHeight/2} 400,${safeHeight/4} Q600,0 800,${safeHeight/4} Q1000,${safeHeight/2} 1200,${safeHeight/4} L1200,${safeHeight} L0,${safeHeight} Z`)}
          fill={`url(#${foamGradientId})`}
          style={{ 
            opacity: safeIntensity
          }}
          animate={{
            d: [
              createSafePath(`M0,${safeHeight/4} Q200,${safeHeight/2} 400,${safeHeight/4} Q600,0 800,${safeHeight/4} Q1000,${safeHeight/2} 1200,${safeHeight/4} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight/8} Q200,${safeHeight*3/8} 400,${safeHeight/8} Q600,${safeHeight*5/8} 800,${safeHeight/8} Q1000,${safeHeight*3/8} 1200,${safeHeight/8} L1200,${safeHeight} L0,${safeHeight} Z`), 
              createSafePath(`M0,${safeHeight*3/8} Q200,${safeHeight/8} 400,${safeHeight*3/8} Q600,${safeHeight*3/4} 800,${safeHeight*3/8} Q1000,${safeHeight/8} 1200,${safeHeight*3/8} L1200,${safeHeight} L0,${safeHeight} Z`),
              createSafePath(`M0,${safeHeight/4} Q200,${safeHeight/2} 400,${safeHeight/4} Q600,0 800,${safeHeight/4} Q1000,${safeHeight/2} 1200,${safeHeight/4} L1200,${safeHeight} L0,${safeHeight} Z`)
            ]
          }}
          transition={{
            duration: 2.5 / safeSpeed,
            repeat: Infinity,
            ease: [0.175, 0.885, 0.32, 1.275], // cubic-bezier с легким bounce для пены
            delay: 0.3
          }}
        />
        
        {/* Контрастная линия основной волны */}
        <motion.path
          d={createSafePath(`M0,${safeHeight/2} Q300,${safeHeight/4} 600,${safeHeight/2} Q900,${safeHeight*3/4} 1200,${safeHeight/2}`)}
          stroke="rgba(21, 94, 117, 1)"
          strokeWidth="3"
          fill="none"
          animate={{
            d: [
              createSafePath(`M0,${safeHeight/2} Q300,${safeHeight/4} 600,${safeHeight/2} Q900,${safeHeight*3/4} 1200,${safeHeight/2}`),
              createSafePath(`M0,${safeHeight*3/8} Q300,${safeHeight*5/8} 600,${safeHeight*3/8} Q900,${safeHeight/8} 1200,${safeHeight*3/8}`), 
              createSafePath(`M0,${safeHeight*5/8} Q300,${safeHeight/8} 600,${safeHeight*5/8} Q900,${safeHeight*7/8} 1200,${safeHeight*5/8}`),
              createSafePath(`M0,${safeHeight/2} Q300,${safeHeight/4} 600,${safeHeight/2} Q900,${safeHeight*3/4} 1200,${safeHeight/2}`)
            ]
          }}
          transition={{
            duration: 5.0 / safeSpeed,
            repeat: Infinity,
            ease: [0.77, 0, 0.175, 1] // cubic-bezier для премиум ощущения
          }}
        />
        
        {/* Белая пена на гребнях волн */}
        <motion.path
          d={createSafePath(`M0,${safeHeight/4} Q200,${safeHeight/2} 400,${safeHeight/4} Q600,0 800,${safeHeight/4} Q1000,${safeHeight/2} 1200,${safeHeight/4}`)}
          stroke="rgba(255, 255, 255, 1)"
          strokeWidth="2"
          fill="none"
          animate={{
            d: [
              createSafePath(`M0,${safeHeight/4} Q200,${safeHeight/2} 400,${safeHeight/4} Q600,0 800,${safeHeight/4} Q1000,${safeHeight/2} 1200,${safeHeight/4}`),
              createSafePath(`M0,${safeHeight/8} Q200,${safeHeight*3/8} 400,${safeHeight/8} Q600,${safeHeight*5/8} 800,${safeHeight/8} Q1000,${safeHeight*3/8} 1200,${safeHeight/8}`), 
              createSafePath(`M0,${safeHeight*3/8} Q200,${safeHeight/8} 400,${safeHeight*3/8} Q600,${safeHeight*3/4} 800,${safeHeight*3/8} Q1000,${safeHeight/8} 1200,${safeHeight*3/8}`),
              createSafePath(`M0,${safeHeight/4} Q200,${safeHeight/2} 400,${safeHeight/4} Q600,0 800,${safeHeight/4} Q1000,${safeHeight/2} 1200,${safeHeight/4}`)
            ]
          }}
          transition={{
            duration: 2.5 / safeSpeed,
            repeat: Infinity,
            ease: [0.68, -0.55, 0.265, 1.55], // cubic-bezier с dramatic эффектом для пены
            delay: 0.3
          }}
        />
        
        {/* Высокочастотная рябь */}
        <motion.path
          d={createSafePath(`M0,${safeHeight/2} Q60,${safeHeight*3/8} 120,${safeHeight/2} Q180,${safeHeight*5/8} 240,${safeHeight/2} Q300,${safeHeight*3/8} 360,${safeHeight/2} Q420,${safeHeight*5/8} 480,${safeHeight/2} Q540,${safeHeight*3/8} 600,${safeHeight/2} Q660,${safeHeight*5/8} 720,${safeHeight/2} Q780,${safeHeight*3/8} 840,${safeHeight/2} Q900,${safeHeight*5/8} 960,${safeHeight/2} Q1020,${safeHeight*3/8} 1080,${safeHeight/2} Q1140,${safeHeight*5/8} 1200,${safeHeight/2}`)}
          stroke="rgba(212, 157, 50, 1)"
          strokeWidth="1.5"
          fill="none"
          animate={{
            d: [
              createSafePath(`M0,${safeHeight/2} Q60,${safeHeight*3/8} 120,${safeHeight/2} Q180,${safeHeight*5/8} 240,${safeHeight/2} Q300,${safeHeight*3/8} 360,${safeHeight/2} Q420,${safeHeight*5/8} 480,${safeHeight/2} Q540,${safeHeight*3/8} 600,${safeHeight/2} Q660,${safeHeight*5/8} 720,${safeHeight/2} Q780,${safeHeight*3/8} 840,${safeHeight/2} Q900,${safeHeight*5/8} 960,${safeHeight/2} Q1020,${safeHeight*3/8} 1080,${safeHeight/2} Q1140,${safeHeight*5/8} 1200,${safeHeight/2}`),
              createSafePath(`M0,${safeHeight*3/8} Q60,${safeHeight/2} 120,${safeHeight*3/8} Q180,${safeHeight/2} 240,${safeHeight*3/8} Q300,${safeHeight/2} 360,${safeHeight*3/8} Q420,${safeHeight/2} 480,${safeHeight*3/8} Q540,${safeHeight/2} 600,${safeHeight*3/8} Q660,${safeHeight/2} 720,${safeHeight*3/8} Q780,${safeHeight/2} 840,${safeHeight*3/8} Q900,${safeHeight/2} 960,${safeHeight*3/8} Q1020,${safeHeight/2} 1080,${safeHeight*3/8} Q1140,${safeHeight/2} 1200,${safeHeight*3/8}`),
              createSafePath(`M0,${safeHeight*5/8} Q60,${safeHeight/2} 120,${safeHeight*5/8} Q180,${safeHeight*3/8} 240,${safeHeight*5/8} Q300,${safeHeight/2} 360,${safeHeight*5/8} Q420,${safeHeight*3/8} 480,${safeHeight*5/8} Q540,${safeHeight/2} 600,${safeHeight*5/8} Q660,${safeHeight*3/8} 720,${safeHeight*5/8} Q780,${safeHeight/2} 840,${safeHeight*5/8} Q900,${safeHeight*3/8} 960,${safeHeight*5/8} Q1020,${safeHeight/2} 1080,${safeHeight*5/8} Q1140,${safeHeight*3/8} 1200,${safeHeight*5/8}`),
              createSafePath(`M0,${safeHeight/2} Q60,${safeHeight*3/8} 120,${safeHeight/2} Q180,${safeHeight*5/8} 240,${safeHeight/2} Q300,${safeHeight*3/8} 360,${safeHeight/2} Q420,${safeHeight*5/8} 480,${safeHeight/2} Q540,${safeHeight*3/8} 600,${safeHeight/2} Q660,${safeHeight*5/8} 720,${safeHeight/2} Q780,${safeHeight*3/8} 840,${safeHeight/2} Q900,${safeHeight*5/8} 960,${safeHeight/2} Q1020,${safeHeight*3/8} 1080,${safeHeight/2} Q1140,${safeHeight*5/8} 1200,${safeHeight/2}`)
            ]
          }}
          transition={{
            duration: 1.8 / safeSpeed,
            repeat: Infinity,
            ease: [0.42, 0, 0.58, 1], // cubic-bezier для быстрой ряби
            delay: 0.7
          }}
        />
      </svg>
    </div>
  )
} 