import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { log } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  enableReporting?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error
    if (process.env.NODE_ENV === 'development') {
      log.error('ErrorBoundary caught an error', {
        component: 'ErrorBoundary',
        targetComponent: this.props.componentName || 'Unknown',
        errorId: this.state.errorId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }, error);
    }

    // Custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to analytics/monitoring service
    if (this.props.enableReporting && process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Report to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        error_id: this.state.errorId,
        component: this.props.componentName || 'Unknown',
      });
    }

    // Report to error monitoring service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: this.props.componentName || 'Unknown',
          errorId: this.state.errorId,
        },
      });
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    } else {
      // Force page reload after max retries
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="card-ultra max-w-md w-full">
            <div className="text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              {/* Error Title */}
              <h3 className="text-xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h3>

              {/* Error Description */}
              <p className="text-slate-300 text-sm mb-4">
                {this.props.componentName ? 
                  `An error occurred in ${this.props.componentName}. Don't worry, we're working on it!` :
                  'An unexpected error occurred. Please try again.'
                }
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-400/20 rounded-lg text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-300">Debug Info:</span>
                  </div>
                  <div className="text-xs text-red-200 font-mono overflow-auto max-h-32">
                    <div className="mb-1">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorId && (
                      <div className="mb-1">
                        <strong>ID:</strong> {this.state.errorId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  disabled={this.retryCount >= this.maxRetries}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 text-white font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  {this.retryCount >= this.maxRetries ? 'Max Retries' : `Try Again (${this.maxRetries - this.retryCount})`}
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex-1 py-3 px-4 backdrop-blur-xl bg-white/8 border border-white/20 text-white font-medium rounded-xl hover:bg-white/12 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={this.handleGoHome}
                  className="text-sm text-slate-400 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Homepage
                </button>
              </div>

              {/* Error ID for Support */}
              {this.state.errorId && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-500">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC для простого использования
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 