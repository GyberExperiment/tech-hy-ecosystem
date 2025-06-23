import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';

// Import Providers
import { I18nProvider } from './i18n/I18nProvider';
import { Web3Provider } from './contexts/Web3Context';

// Import Layout Components
import Header from './components/Header';

// Import Pages
import Home from './pages/Home';
import Tokens from './pages/Tokens';
import Staking from './pages/Staking';
import Governance from './pages/Governance';

// Import Showcase Component
import { StyleShowcase } from './components/StyleShowcase';
// import { WaveTransition } from './components/ui/wave-transition';

// Import Debug Components (if needed)
// import WalletDebug from './components/WalletDebug';

function App() {
  return (
    <I18nProvider>
      <Web3Provider>
        <Router>
          <div className="min-h-screen text-white relative overflow-hidden">
            {/* Dark Background with Gradient Overlay */}
            <div className="fixed inset-0 bg-slate-900">
              <div className="gradient-bg absolute inset-0"></div>
              
              {/* Ultra Modern Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 animate-glass-float">
                  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-glass-pulse"></div>
                  <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-glass-float"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-glass-pulse"></div>
                  <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-glass-float"></div>
                </div>
              </div>
            </div>
            
            {/* Main Application Content */}
            <div className="relative z-10">
              <Header />
              
              <main className="flex-1 py-6 md:py-8 lg:py-12 animate-fade-in">
                <div className="container-mobile">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tokens" element={<Tokens />} />
                    <Route path="/staking" element={<Staking />} />
                    <Route path="/governance" element={<Governance />} />
                    
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
        </Router>
      </Web3Provider>
    </I18nProvider>
  );
}

export default App;
