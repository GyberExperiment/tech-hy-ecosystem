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

  // Генерируем правильные элегантные волны
  const generateCleanWavePath = (phase: number, amplitude: number): string => {
    // Проверяем входные параметры и устанавливаем fallback значения
    const safePhase = isFinite(phase) ? phase : 0;
    const safeAmplitude = isFinite(amplitude) ? amplitude : 0;
    
    // Если амплитуда слишком мала или параметры некорректны, возвращаем прямую линию
    if (Math.abs(safeAmplitude) < 0.1) {
      return 'M0,50 L100,50 V100 H0 Z';
    }
    
    const segments = 8;
    let path = 'M0,50';
    
    // Создаем плавную волну с правильными Bezier кривыми
    for (let i = 0; i < segments; i++) {
      const x1 = (i / segments) * 100;
      const x2 = ((i + 1) / segments) * 100;
      
      // Вычисляем Y координаты с дополнительными проверками
      const y1Raw = 50 + Math.sin((i / segments) * Math.PI * 2 + safePhase) * safeAmplitude;
      const y2Raw = 50 + Math.sin(((i + 1) / segments) * Math.PI * 2 + safePhase) * safeAmplitude;
      
      // Ограничиваем Y координаты разумными пределами
      const y1 = Math.max(25, Math.min(75, isFinite(y1Raw) ? y1Raw : 50));
      const y2 = Math.max(25, Math.min(75, isFinite(y2Raw) ? y2Raw : 50));
      
      // Контрольные точки для плавности
      const cx1 = x1 + (x2 - x1) * 0.3;
      const cy1 = y1;
      const cx2 = x1 + (x2 - x1) * 0.7;
      const cy2 = y2;
      
      // Дополнительная проверка всех значений перед добавлением в path
      if (isFinite(cx1) && isFinite(cy1) && isFinite(cx2) && isFinite(cy2) && 
          isFinite(x2) && isFinite(y2) && 
          cx1 >= 0 && cx2 >= 0 && x2 >= 0) {
        // Округляем значения для стабильности
        const roundedCx1 = Math.round(cx1 * 100) / 100;
        const roundedCy1 = Math.round(cy1 * 100) / 100;
        const roundedCx2 = Math.round(cx2 * 100) / 100;
        const roundedCy2 = Math.round(cy2 * 100) / 100;
        const roundedX2 = Math.round(x2 * 100) / 100;
        const roundedY2 = Math.round(y2 * 100) / 100;
        
        path += ` C${roundedCx1},${roundedCy1} ${roundedCx2},${roundedCy2} ${roundedX2},${roundedY2}`;
      } else {
        // Fallback: добавляем прямую линию если что-то пошло не так
        path += ` L${x2},50`;
      }
    }
    
    path += ' V100 H0 Z';
    return path;
  };

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
        {[0, 1, 2].map((index) => {
          const basePhase = index * Math.PI * 0.6;
          const baseAmplitude = waveHeight * (1 - index * 0.2);
          
          // Генерируем пути для анимации с проверкой валидности
          const pathFrames = [
            generateCleanWavePath(basePhase, baseAmplitude),
            generateCleanWavePath(basePhase + Math.PI * 2, baseAmplitude),
            generateCleanWavePath(basePhase + Math.PI * 4, baseAmplitude),
          ];
          
          // Проверяем что все пути валидны
          const validPaths = pathFrames.every(path => 
            path && path.length > 0 && !path.includes('undefined') && !path.includes('NaN')
          );
          
          // Если пути невалидны, используем fallback
          const safePaths = validPaths ? pathFrames : [
            'M0,50 L100,50 V100 H0 Z',
            'M0,50 L100,50 V100 H0 Z',
            'M0,50 L100,50 V100 H0 Z'
          ];
          
          return (
            <motion.path
              key={index}
              d={safePaths[0]}
              fill={`url(#${gradientId})`}
              filter={`url(#${filterId})`}
              animate={{
                d: safePaths
              }}
              transition={{
                duration: Math.max(5, animationDuration + index * 3), // Минимальная длительность
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.5
              }}
              style={{ 
                opacity: Math.max(0.1, 0.6 - index * 0.15), // Минимальная непрозрачность
                mixBlendMode: 'normal'
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