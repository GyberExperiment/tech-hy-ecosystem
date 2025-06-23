import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';

// Import Providers
import { I18nProvider } from './i18n/I18nProvider';
import { Web3Provider } from './shared/lib/Web3Context';

// Import Layout Components
import Header from './shared/ui/Header';

// Import Pages
import Home from './app/Home';
import Tokens from './app/Tokens';
import Staking from './app/Staking';
import Governance from './app/Governance';

// Import Showcase Component
import { StyleShowcase } from './shared/ui/StyleShowcase';
// import { WaveTransition } from './components/ui/wave-transition';

// Import Debug Components (if needed)
// import WalletDebug from './components/WalletDebug';

function App() {
  return (
    <I18nProvider>
      <Web3Provider>
        <Router>
          <div className="min-h-screen text-dark-gray relative overflow-hidden">
            {/* Clean Light Background */}
            <div className="fixed inset-0 bg-pure-white">
              <div className="clean-bg absolute inset-0"></div>
              
              {/* Clean Minimalist Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 animate-gentle-float">
                  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-blue/8 rounded-full blur-3xl animate-subtle-glow"></div>
                  <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl animate-gentle-float"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-teal/6 rounded-full blur-3xl animate-subtle-glow"></div>
                  <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-accent-green/5 rounded-full blur-3xl animate-gentle-float"></div>
                </div>
              </div>
            </div>
            
            {/* Main Application Content */}
            <div className="relative z-10">
              <Header />
              
              <main className="flex-1 py-6 md:py-8 lg:py-12 animate-clean-fade-in">
                <div className="clean-container">
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
