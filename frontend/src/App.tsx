import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';

// Import Providers
import { I18nProvider } from './i18n/I18nProvider';
import { Web3Provider } from './contexts/Web3Context';
import { RainbowKitProvider } from './providers/RainbowKitProvider';

// Import Layout Components
import Header from './components/Header';

// Import Pages
import Home from './pages/Home';
import Tokens from './pages/Tokens';
import Staking from './pages/Staking';
import Governance from './pages/Governance';

// Import Debug Components (if needed)
// import WalletDebug from './components/WalletDebug';

function App() {
  return (
    <I18nProvider>
      <RainbowKitProvider>
        <Web3Provider>
          <Router>
            <AppContent />
          </Router>
        </Web3Provider>
      </RainbowKitProvider>
    </I18nProvider>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen gradient-bg text-white">
      {/* Ultra Modern Animated Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 animate-glass-float">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-glass-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-glass-float"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-glass-pulse"></div>
        </div>
      </div>

      <Header />
      
      {/* Main Content Container with Glass Background */}
      <main className="relative z-10 py-6 md:py-8 lg:py-12 animate-fade-in">
        <div className="container-mobile">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/governance" element={<Governance />} />
          </Routes>
        </div>
      </main>

      {/* Ultra Modern Footer with Glassmorphism */}
      <footer className="relative z-10 mt-16 py-8">
        <div className="container-mobile">
          <div className="liquid-glass p-6 animate-glass-float">
            <div className="text-center space-y-4">
              <p className="text-gray-300 text-sm">
                © 2024 TECH HY Ecosystem. Все права защищены.
              </p>
              <div className="flex justify-center space-x-6 text-xs text-gray-400">
                <a 
                  href="https://github.com" 
                  className="hover:text-white transition-colors duration-300 glass-ultra px-3 py-1 rounded-lg hover:glass-accent"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <a 
                  href="https://discord.com" 
                  className="hover:text-white transition-colors duration-300 glass-ultra px-3 py-1 rounded-lg hover:glass-accent"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
                <a 
                  href="https://twitter.com" 
                  className="hover:text-white transition-colors duration-300 glass-ultra px-3 py-1 rounded-lg hover:glass-accent"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </div>
              <div className="text-xs text-gray-500">
                Работает на BSC Testnet • Powered by PancakeSwap
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Debug Component (uncomment if needed) */}
      {/* process.env.NODE_ENV === 'development' && <WalletDebug /> */}
    </div>
  );
}

export default App;
