import React from 'react'
import { Button } from './Button'
import { WaveTransition } from './wave-transition'

export const StyleShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent opacity-50" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-4 py-12 space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="hero-title text-4xl md:text-6xl font-bold">
            🌟 Ultra-Modern Design System 2025
          </h1>
          <p className="hero-subtitle text-xl md:text-2xl max-w-3xl mx-auto">
            Премиальные glassmorphism эффекты, cubic-bezier анимации и потрясающие визуальные компоненты
          </p>
        </div>

        {/* Premium Buttons Section */}
        <section className="glass-panel-ultra space-y-8">
          <h2 className="section-title text-3xl font-semibold text-center">
            🎯 Премиальные Glassmorphism Кнопки
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="card-title text-xl font-medium">Базовые стили</h3>
              <div className="space-y-3">
                <Button variant="default" size="lg" className="w-full">
                  Default Button
                </Button>
                <Button variant="glass" size="lg" className="w-full">
                  Glass Effect
                </Button>
                <Button variant="gradient" size="lg" className="w-full">
                  Gradient Style
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="card-title text-xl font-medium">Цветные варианты</h3>
              <div className="space-y-3">
                <Button variant="orange" size="premium" className="w-full">
                  🧡 Orange Glass
                </Button>
                <Button variant="blue" size="premium" className="w-full">
                  💙 Blue Glass
                </Button>
                <Button variant="fire" size="premium" className="w-full">
                  🔥 Fire Glass
                </Button>
                <Button variant="green" size="premium" className="w-full">
                  💚 Green Glass
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="card-title text-xl font-medium">Интерактивные</h3>
              <div className="space-y-3">
                <Button variant="glow" size="lg" animation="shimmer" className="w-full">
                  ✨ Glow Effect
                </Button>
                <Button variant="orange" size="premium-lg" loading className="w-full">
                  Loading State
                </Button>
                <Button variant="blue" size="premium" disabled className="w-full">
                  Disabled State
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Glass Cards Section */}
        <section className="space-y-8">
          <h2 className="section-title text-3xl font-semibold text-center">
            💎 Glass Cards & Panels
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-ultra">
              <h3 className="card-title text-xl font-medium mb-4">Ultra Glass Card</h3>
              <p className="text-white/80 mb-6">
                Премиальная карточка с blur эффектами и неоморфными тенями.
              </p>
              <Button variant="orange" size="default" className="w-full">
                Действие
              </Button>
            </div>

            <div className="glass-primary p-6 rounded-2xl">
              <h3 className="card-title text-xl font-medium mb-4">Primary Glass</h3>
              <p className="text-white/80 mb-6">
                Карточка с primary цветовой схемой и дополнительными эффектами.
              </p>
              <Button variant="glass" size="default" className="w-full">
                Подробнее
              </Button>
            </div>

            <div className="glass-secondary p-6 rounded-2xl">
              <h3 className="card-title text-xl font-medium mb-4">Secondary Glass</h3>
              <p className="text-white/80 mb-6">
                Элегантная карточка с вторичной цветовой палитрой.
              </p>
              <Button variant="blue" size="default" className="w-full">
                Изучить
              </Button>
            </div>
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="glass-panel-ultra space-y-8">
          <h2 className="section-title text-3xl font-semibold text-center">
            ⚡ Интерактивные Элементы
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="card-title text-xl font-medium">Формы</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Premium Input Field"
                  className="input-field w-full"
                />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className="input-field w-full"
                />
                <textarea 
                  placeholder="Message"
                  rows={4}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="card-title text-xl font-medium">Кнопки с иконками</h3>
              <div className="space-y-4">
                <Button variant="fire" size="lg" leftIcon="🚀" className="w-full">
                  Запустить проект
                </Button>
                <Button variant="green" size="lg" rightIcon="✅" className="w-full">
                  Подтвердить
                </Button>
                <Button variant="blue" size="premium" leftIcon="📊" rightIcon="→" className="w-full">
                  Анализ данных
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Animation Showcase */}
        <section className="glass-panel-ultra space-y-8">
          <h2 className="section-title text-3xl font-semibold text-center">
            🎨 Анимации и Эффекты
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-ultra p-6 rounded-2xl animate-glass-float">
              <h3 className="card-title text-lg font-medium mb-2">Float Animation</h3>
              <p className="text-white/70 text-sm">Плавающая анимация с cubic-bezier</p>
            </div>
            
            <div className="glass-ultra p-6 rounded-2xl animate-glass-pulse">
              <h3 className="card-title text-lg font-medium mb-2">Pulse Effect</h3>
              <p className="text-white/70 text-sm">Пульсирующий glassmorphism эффект</p>
            </div>
            
            <div className="glass-ultra p-6 rounded-2xl hover:scale-105 transition-all duration-500 ease-dramatic">
              <h3 className="card-title text-lg font-medium mb-2">Hover Transform</h3>
              <p className="text-white/70 text-sm">Премиальные hover эффекты</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-8">
          <h2 className="section-title text-3xl font-semibold text-center">
            📝 Типографика
          </h2>
          
          <div className="glass-panel-ultra space-y-6">
            <h1 className="hero-title text-5xl">Hero Title - Крупный заголовок</h1>
            <h2 className="section-title text-3xl">Section Title - Заголовок секции</h2>
            <h3 className="card-title text-xl">Card Title - Заголовок карточки</h3>
            <p className="hero-subtitle text-lg">
              Hero Subtitle - Подзаголовок с улучшенными тенями и типографикой
            </p>
            <p className="text-white/80">
              Обычный текст с оптимальным контрастом и читаемостью на glassmorphism фонах.
            </p>
          </div>
        </section>

        {/* Color Scheme */}
        <section className="glass-panel-ultra space-y-8">
          <h2 className="section-title text-3xl font-semibold text-center">
            🎭 Цветовая Схема
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="glass-primary aspect-square rounded-2xl flex items-center justify-center">
              <span className="text-white font-medium">Primary</span>
            </div>
            <div className="glass-secondary aspect-square rounded-2xl flex items-center justify-center">
              <span className="text-white font-medium">Secondary</span>
            </div>
            <div className="glass-accent aspect-square rounded-2xl flex items-center justify-center">
              <span className="text-white font-medium">Accent</span>
            </div>
            <div className="btn-glass-orange aspect-square rounded-2xl flex items-center justify-center">
              <span className="text-white font-medium">Orange</span>
            </div>
            <div className="btn-glass-blue aspect-square rounded-2xl flex items-center justify-center">
              <span className="text-white font-medium">Blue</span>
            </div>
          </div>
        </section>
      </div>

      {/* Wave Transition at bottom */}
      <WaveTransition />
    </div>
  )
} 