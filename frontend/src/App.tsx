import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './contexts/Web3Context';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Tokens from './pages/Tokens';
import LPLocking from './pages/LPStaking';
import Governance from './pages/Governance';
import './index.css';

// Initialize i18n
import './i18n';

// Loading component for i18n
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
      <p className="text-gray-300">Loading translations...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Web3Provider>
        <Suspense fallback={<LoadingFallback />}>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-safe">
              <Header />
              
              <main className="container-mobile py-4 sm:py-6 lg:py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tokens" element={<Tokens />} />
                  <Route path="/staking" element={<LPLocking />} />
                  <Route path="/governance" element={<Governance />} />
                </Routes>
              </main>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#f9fafb',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#f9fafb',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </Suspense>
      </Web3Provider>
    </ErrorBoundary>
  );
}

export default App;
