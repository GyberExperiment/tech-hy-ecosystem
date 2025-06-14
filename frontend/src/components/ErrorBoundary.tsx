import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can log to error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleResetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="card text-center">
              <div className="text-6xl mb-6">💥</div>
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                Упс! Что-то пошло не так
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Произошла неожиданная ошибка в приложении. Мы уже работаем над её исправлением.
              </p>

              {/* Error Details (for development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white mb-2 flex items-center">
                    <Bug className="mr-2" size={16} />
                    Показать детали ошибки (режим разработки)
                  </summary>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm">
                    <div className="text-red-400 font-semibold mb-2 text-slate-100">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="text-gray-400 text-xs overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-gray-400 text-xs overflow-auto max-h-40 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleResetError}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={18} />
                  <span>Попробовать снова</span>
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={18} />
                  <span>Перезагрузить страницу</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <Home size={18} />
                  <span>На главную</span>
                </button>
              </div>

              {/* Additional Help */}
              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                <div className="flex items-center justify-center space-x-2 text-blue-400 mb-2">
                  <AlertTriangle size={16} />
                  <span className="font-semibold text-slate-200">Что можно сделать:</span>
                </div>
                <ul className="text-gray-400 space-y-1">
                  <li>• Перезагрузите страницу</li>
                  <li>• Проверьте подключение к интернету</li>
                  <li>• Убедитесь что MetaMask работает корректно</li>
                  <li>• Очистите кэш браузера</li>
                  <li>• Попробуйте использовать другой браузер</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 