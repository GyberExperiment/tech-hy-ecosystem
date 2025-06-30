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
  const cleanId = uniqueId.replace(/[^a-zA-Z0-9]/g, '') || Date.now().toString()
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

  // Мягкая амплитуда для элегантного эффекта
  const waveHeight = height * intensity
  const animationDuration = 25 / speed // Медленные элегантные волны

  // УЛУЧШЕННАЯ функция генерации правильных элегантных волн с надежными fallback
  const generateCleanWavePath = (phase: number, amplitude: number): string => {
    try {
      // Строгие проверки входных параметров с дополнительной валидацией
      if (!isFinite(phase) || isNaN(phase) || !isFinite(amplitude) || isNaN(amplitude)) {
        console.warn('Invalid parameters for wave generation, using fallback');
        return 'M0,50 L100,50 V100 H0 Z';
      }
      
      const safePhase = Number(phase) || 0;
      const safeAmplitude = Math.max(0, Number(amplitude) || 0);
      
      // Если амплитуда слишком мала, возвращаем прямую линию
      if (safeAmplitude < 0.1) {
        return 'M0,50 L100,50 V100 H0 Z';
      }
      
      const segments = 8;
      let path = 'M0,50';
      
      // Создаем плавную волну с правильными Bezier кривыми
      for (let i = 0; i < segments; i++) {
        const x1 = (i / segments) * 100;
        const x2 = ((i + 1) / segments) * 100;
        
        // Безопасные вычисления Y координат с дополнительными проверками
        const angle1 = (i / segments) * Math.PI * 2 + safePhase;
        const angle2 = ((i + 1) / segments) * Math.PI * 2 + safePhase;
        
        const sinValue1 = Math.sin(angle1);
        const sinValue2 = Math.sin(angle2);
        
        // Тройная проверка на валидность sin значений
        if (!isFinite(sinValue1) || isNaN(sinValue1) || !isFinite(sinValue2) || isNaN(sinValue2)) {
          console.warn('Invalid sin values, using fallback segment');
          continue;
        }
        
        const y1Raw = 50 + sinValue1 * safeAmplitude;
        const y2Raw = 50 + sinValue2 * safeAmplitude;
        
        // Ограничиваем Y координаты разумными пределами с дополнительной проверкой
        const y1 = Math.max(25, Math.min(75, isFinite(y1Raw) ? y1Raw : 50));
        const y2 = Math.max(25, Math.min(75, isFinite(y2Raw) ? y2Raw : 50));
        
        // Контрольные точки для плавности
        const cx1 = x1 + (x2 - x1) * 0.3;
        const cy1 = y1;
        const cx2 = x1 + (x2 - x1) * 0.7;
        const cy2 = y2;
        
        // Строгая проверка всех значений перед добавлением в path
        const values = [cx1, cy1, cx2, cy2, x2, y2];
        const allValuesValid = values.every(val => 
          isFinite(val) && 
          !isNaN(val) && 
          val >= 0 && 
          val <= 100
        );
        
        if (allValuesValid) {
          // Округляем значения для стабильности с проверкой
          const roundedValues = values.map(val => {
            const rounded = Math.round(val * 100) / 100;
            return isFinite(rounded) ? rounded : 50;
          });
          
          path += ` C${roundedValues[0]},${roundedValues[1]} ${roundedValues[2]},${roundedValues[3]} ${roundedValues[4]},${roundedValues[5]}`;
        } else {
          // Fallback: добавляем прямую линию если что-то пошло не так
          const safeX2 = Math.max(0, Math.min(100, x2));
          path += ` L${safeX2},50`;
        }
      }
      
      path += ' V100 H0 Z';
      
      // Финальная проверка валидности path
      if (path.includes('undefined') || path.includes('NaN') || path.includes('Infinity') || path.length < 20) {
        console.warn('Invalid path generated, using fallback');
        return 'M0,50 L100,50 V100 H0 Z';
      }
      
      return path;
      
    } catch (error) {
      console.warn('Error generating wave path:', error);
      return 'M0,50 L100,50 V100 H0 Z';
    }
  };

  // НОВАЯ функция для безопасной генерации анимационных кадров
  const generateSafeAnimationFrames = (index: number) => {
    const basePhase = index * Math.PI * 0.6;
    const baseAmplitude = Math.max(0.1, waveHeight * (1 - index * 0.2));
    
    const frames = [];
    for (let i = 0; i < 3; i++) {
      const phase = basePhase + i * Math.PI * 2;
      const path = generateCleanWavePath(phase, baseAmplitude);
      frames.push(path);
    }
    
    // Проверяем что все пути валидны
    const validFrames = frames.every(path => 
      path && 
      typeof path === 'string' && 
      path.length > 10 && 
      !path.includes('undefined') && 
      !path.includes('NaN') && 
      !path.includes('Infinity')
    );
    
    // Если есть проблемы, возвращаем безопасные fallback
    if (!validFrames) {
      console.warn('Generated invalid animation frames, using fallback');
      const fallback = 'M0,50 L100,50 V100 H0 Z';
      return [fallback, fallback, fallback];
    }
    
    return frames;
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
        
        {/* УЛУЧШЕННЫЕ мягкие анимированные волны с дополнительной защитой */}
        {[0, 1, 2].map((index) => {
          const animationFrames = generateSafeAnimationFrames(index);
          const initialPath = animationFrames[0] || 'M0,50 L100,50 V100 H0 Z';
          
          // ✅ Дополнительная проверка всех кадров анимации перед рендером
          const validatedFrames = animationFrames.map(frame => {
            if (!frame || 
                typeof frame !== 'string' || 
                frame.includes('undefined') || 
                frame.includes('NaN') || 
                frame.includes('Infinity') ||
                frame.length < 10) {
              console.warn(`Invalid animation frame for wave ${index}, using fallback`);
              return 'M0,50 L100,50 V100 H0 Z';
            }
            return frame;
          });

          // ✅ Финальная проверка что у нас есть хотя бы базовый path
          const safeInitialPath = validatedFrames[0] && typeof validatedFrames[0] === 'string' && validatedFrames[0].length > 10 
            ? validatedFrames[0] 
            : 'M0,50 L100,50 V100 H0 Z';
          
          // ✅ МАКСИМАЛЬНО СТРОГАЯ защита от undefined в animate объекте
          const safeAnimateFrames = (() => {
            // Тройная проверка каждого кадра анимации
            const checkedFrames = validatedFrames.map(frame => {
              const safeFrame = frame && typeof frame === 'string' && 
                                frame.length > 10 && 
                                !frame.includes('undefined') && 
                                !frame.includes('NaN') && 
                                !frame.includes('Infinity') && 
                                frame.startsWith('M') ? frame : 'M0,50 L100,50 V100 H0 Z';
              return safeFrame;
            });
            
            // Убеждаемся что у нас ровно 3 валидных кадра
            if (checkedFrames.length !== 3 || checkedFrames.some(frame => frame === 'M0,50 L100,50 V100 H0 Z')) {
              console.warn('Using fallback animation frames due to validation failure');
              return [safeInitialPath, safeInitialPath, safeInitialPath];
            }
            
            return checkedFrames;
          })();
          
          return (
            <motion.path
              key={`wave-${index}-${cleanId}`}
              d={safeInitialPath}
              fill={`url(#${gradientId})`}
              filter={`url(#${filterId})`}
              animate={{
                d: safeAnimateFrames
              }}
              transition={{
                duration: Math.max(8, animationDuration + index * 3), // Увеличили минимальную длительность
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.8,
                // Добавляем более мягкие переходы
                type: "tween"
              }}
              style={{ 
                opacity: Math.max(0.15, 0.6 - index * 0.12), // Увеличили минимальную непрозрачность
                mixBlendMode: 'normal'
              }}
              // ✅ Добавляем защиту от ошибок рендера
              onError={(error) => {
                console.warn('SVG path render error:', error);
              }}
              // ✅ Усиленная проверка на валидность перед анимацией
              onAnimationStart={() => {
                const currentD = safeInitialPath;
                if (!currentD || currentD.includes('undefined')) {
                  console.error('Critical: undefined detected in SVG path during animation start');
                }
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