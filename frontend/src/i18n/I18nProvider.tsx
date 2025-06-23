import React, { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './index'

interface I18nProviderProps {
  children: React.ReactNode
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="loading-spinner w-8 h-8" />
  </div>
)

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </I18nextProvider>
  )
} 