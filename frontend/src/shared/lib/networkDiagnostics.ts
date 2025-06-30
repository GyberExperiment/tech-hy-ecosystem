/**
 * 🔧 Network Diagnostics and Solutions
 * 
 * TECH HY Ecosystem - Network connectivity troubleshooting
 */

import { getAllRpcEndpoints } from '../config/rpcEndpoints';
import { rpcService } from '../api/rpcService';
import { log } from './logger';

export interface NetworkDiagnostics {
  hasMetaMask: boolean;
  isConnected: boolean;
  chainId: number | null;
  rpcStatus: 'good' | 'degraded' | 'poor' | 'offline';
  workingEndpoints: string[];
  failingEndpoints: string[];
  recommendations: string[];
  rpcStats?: any; // From rpcService.getProviderStats()
}

export class NetworkDiagnosticsService {
  private static instance: NetworkDiagnosticsService;
  
  static getInstance(): NetworkDiagnosticsService {
    if (!this.instance) {
      this.instance = new NetworkDiagnosticsService();
    }
    return this.instance;
  }

  async runDiagnostics(): Promise<NetworkDiagnostics> {
    const results: NetworkDiagnostics = {
      hasMetaMask: this.checkMetaMask(),
      isConnected: false,
      chainId: null,
      rpcStatus: 'offline',
      workingEndpoints: [],
      failingEndpoints: [],
      recommendations: []
    };

    // Check wallet connection
    if (results.hasMetaMask && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        results.isConnected = accounts.length > 0;
        
        if (results.isConnected) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          results.chainId = parseInt(chainId, 16);
        }
      } catch (error) {
        log.warn('Failed to check wallet connection', { error });
      }
    }

    // ✅ Получаем статистику от rpcService
    try {
      results.rpcStats = rpcService.getProviderStats();
      
      // Анализируем статистику провайдеров
      const stats = results.rpcStats;
      if (stats && stats.fallbackProviders) {
        stats.fallbackProviders.forEach((provider: any) => {
          if (provider.isHealthy && provider.consecutiveErrors < 2) {
            results.workingEndpoints.push(provider.url);
          } else {
            results.failingEndpoints.push(provider.url);
          }
        });
      }
    } catch (error) {
      // Fallback: Test RPC endpoints manually
      await this.testRpcEndpoints(results);
    }
    
    // Generate recommendations
    this.generateRecommendations(results);

    return results;
  }

  private checkMetaMask(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask === true;
  }

  private async testRpcEndpoints(results: NetworkDiagnostics): Promise<void> {
    const endpoints = getAllRpcEndpoints();
    const testPromises = endpoints.map(endpoint => this.testSingleEndpoint(endpoint));
    
    const testResults = await Promise.allSettled(testPromises);
    
    testResults.forEach((result, index) => {
      const endpoint = endpoints[index];
      if (result.status === 'fulfilled' && result.value) {
        results.workingEndpoints.push(endpoint);
      } else {
        results.failingEndpoints.push(endpoint);
      }
    });

    // Determine overall RPC status
    const workingCount = results.workingEndpoints.length;
    const totalCount = endpoints.length;
    
    if (workingCount === 0) {
      results.rpcStatus = 'offline';
    } else if (workingCount < totalCount * 0.3) {
      results.rpcStatus = 'poor';
    } else if (workingCount < totalCount * 0.7) {
      results.rpcStatus = 'degraded';
    } else {
      results.rpcStatus = 'good';
    }
  }

  private async testSingleEndpoint(endpoint: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.result && typeof data.result === 'string';

    } catch (error) {
      return false;
    }
  }

  private generateRecommendations(results: NetworkDiagnostics): void {
    const recommendations: string[] = [];

    // MetaMask recommendations
    if (!results.hasMetaMask) {
      recommendations.push('🦊 Установите MetaMask или другой Web3 кошелек');
      recommendations.push('📱 Убедитесь что расширение MetaMask включено в браузере');
    } else if (!results.isConnected) {
      recommendations.push('🔗 Подключите кошелек к приложению');
      recommendations.push('🔐 Разблокируйте MetaMask если он заблокирован');
    }

    // Network recommendations
    if (results.chainId && results.chainId !== 97) {
      recommendations.push('🌐 Переключитесь на BSC Testnet (Chain ID: 97)');
      recommendations.push('⚙️ Добавьте BSC Testnet в MetaMask если его нет');
    }

    // RPC recommendations based on status
    switch (results.rpcStatus) {
      case 'offline':
        recommendations.push('🚨 Все RPC провайдеры недоступны');
        recommendations.push('📶 Проверьте подключение к интернету');
        recommendations.push('🔄 Попробуйте обновить страницу через несколько минут');
        recommendations.push('🌍 Возможны временные проблемы с BSC Testnet');
        break;
        
      case 'poor':
        recommendations.push('⚠️ Большинство RPC провайдеров недоступны');
        recommendations.push('⏱️ Возможны задержки в загрузке данных');
        recommendations.push('🔄 Попробуйте обновить страницу');
        break;
        
      case 'degraded':
        recommendations.push('🟡 Некоторые RPC провайдеры недоступны');
        recommendations.push('⏳ Возможны незначительные задержки');
        break;
        
      case 'good':
        recommendations.push('✅ Подключение к blockchain стабильно');
        break;
    }

    // General troubleshooting
    if (results.rpcStatus !== 'good') {
      recommendations.push('');
      recommendations.push('🔧 Дополнительные решения:');
      recommendations.push('• Отключите VPN если используете');
      recommendations.push('• Очистите кэш браузера (Ctrl+Shift+Delete)');
      recommendations.push('• Попробуйте другой браузер');
      recommendations.push('• Проверьте не блокирует ли антивирус соединения');
    }

    results.recommendations = recommendations;
  }

  getStatusMessage(status: NetworkDiagnostics['rpcStatus']): string {
    switch (status) {
      case 'good': return '🟢 Отличное подключение';
      case 'degraded': return '🟡 Стабильное подключение';
      case 'poor': return '🟠 Слабое подключение';
      case 'offline': return '🔴 Нет подключения';
      default: return '❓ Неизвестно';
    }
  }
}

// Export singleton
export const networkDiagnostics = NetworkDiagnosticsService.getInstance(); 