import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@rainbow-me/rainbowkit/styles.css';
import { Web3Provider } from './shared/lib/Web3Context';
import './i18n';
import './App.css';

// Import Providers
import I18nProvider from './i18n/I18nProvider';

// Import Layout Components
import Header from './shared/ui/Header';

// Import Pages
import Home from './app/Home';
import Tokens from './app/Tokens';
import Staking from './app/Staking';
import Governance from './app/Governance';
import Dashboard from './app/Dashboard';

// Import Showcase Component
import { StyleShowcase } from './shared/ui/StyleShowcase';
// import { WaveTransition } from './components/ui/wave-transition';

// Import Debug Components (if needed)
// import WalletDebug from './components/WalletDebug';

function App() {
  return (
    <I18nProvider>
      <Web3Provider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          {/* ✅ ФОН НА ВЕСЬ ЭКРАН - вынесен из основного контейнера */}
          <div className="fixed inset-0 bg-pure-white">
            <div className="clean-bg absolute inset-0"></div>
            
            {/* Clean Minimalist Background Elements - на весь экран */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 animate-enhanced-float-bg">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-blue/8 rounded-full blur-3xl animate-subtle-glow"></div>
                <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl animate-enhanced-float-bg"></div>
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-teal/6 rounded-full blur-3xl animate-subtle-glow"></div>
                <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-accent-green/5 rounded-full blur-3xl animate-enhanced-float-bg"></div>
              </div>
            </div>
          </div>
          
          <div className="min-h-screen text-dark-gray relative overflow-hidden">
            {/* Main Application Content */}
            <div className="relative z-10">
              <Header />
              
              <main className="flex-1 py-4 md:py-6 lg:py-8 animate-clean-fade-in">{/* Уменьшил отступы */}
                <div className="w-full px-3 md:px-6 lg:px-12 xl:px-16">{/* Уменьшил горизонтальные отступы */}
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tokens" element={<Tokens />} />
                    <Route path="/staking" element={<Staking />} />
                    <Route path="/governance" element={<Governance />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Development/Debug Routes */}
                    <Route path="/showcase" element={<StyleShowcase />} />
                  </Routes>
                </div>
              </main>
              
              {/* Wave transition effect between sections - DISABLED TEMPORARILY */}
              {/* <WaveTransition className="absolute bottom-0 left-0 right-0 z-10" /> */}
              
              {/* Development wallet debug panel - uncomment if needed */}
              {/* <WalletDebug /> */}
            </div>
          </div>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </Web3Provider>
    </I18nProvider>
  );
}

export default App;
