/**
 * Production Logger с уровнями логирования
 * Заменяет все console.* calls на structured logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogContext {
  component?: string;
  function?: string;
  userId?: string | null | undefined;
  txHash?: string | null | undefined;
  address?: string | null | undefined;
  network?: string | null | undefined;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: LogContext | undefined;
  error?: Error | undefined;
  data?: any;
}

class ProductionLogger {
  private currentLevel: LogLevel;
  private isProduction: boolean;
  private enableConsole: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.currentLevel = this.isProduction ? LogLevel.WARN : LogLevel.TRACE;
    this.enableConsole = !this.isProduction || import.meta.env.VITE_ENABLE_LOGGING === 'true';
    
    // В production можно отправлять логи на внешний сервис
    if (this.isProduction) {
      this.setupProductionLogging();
    }
  }

  private setupProductionLogging() {
    // Отправка критических ошибок в production
    window.addEventListener('error', (event) => {
      this.error('Uncaught Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
      });
    });

    // Периодическая отправка логов (можно настроить на внешний сервис)
    setInterval(() => {
      this.flushLogs();
    }, 30000); // каждые 30 секунд
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error, data?: any): LogEntry {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    return {
      timestamp,
      level,
      levelName,
      message,
      context,
      error,
      data,
    };
  }

  private getContextString(context?: LogContext | undefined): string {
    if (!context) return '';
    
    const parts: string[] = [];
    if (context.component) parts.push(`[${context.component}]`);
    if (context.function) parts.push(`${context.function}()`);
    if (context.txHash && typeof context.txHash === 'string') {
      parts.push(`tx:${context.txHash.slice(0, 8)}...`);
    }
    if (context.address && typeof context.address === 'string') {
      parts.push(`addr:${context.address.slice(0, 6)}...`);
    }
    if (context.network && typeof context.network === 'string') {
      parts.push(`net:${context.network}`);
    }
    
    return parts.length > 0 ? parts.join(' ') + ' ' : '';
  }

  private logToConsole(entry: LogEntry) {
    if (!this.enableConsole) return;

    const contextStr = this.getContextString(entry.context);
    const emoji = this.getLevelEmoji(entry.level);
    
    // Безопасное извлечение времени из timestamp
    let timestamp = 'unknown';
    try {
      if (entry.timestamp) {
        const parts = entry.timestamp.split('T');
        if (parts.length > 1 && parts[1]) {
          const timeParts = parts[1].split('.');
          if (timeParts.length > 0 && timeParts[0]) {
            timestamp = timeParts[0];
          }
        }
      }
      
      if (timestamp === 'unknown') {
        const now = new Date();
        timestamp = now.toTimeString().substring(0, 8); // HH:MM:SS
      }
    } catch {
      timestamp = new Date().toTimeString().substring(0, 8);
    }
    
    const formattedMessage = `${emoji} ${timestamp} ${contextStr}${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        if (entry.error) {
          console.error(formattedMessage, entry.error, entry.data);
        } else {
          console.error(formattedMessage, entry.data);
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.data);
        break;
      case LogLevel.DEBUG:
        console.log(formattedMessage, entry.data);
        break;
      case LogLevel.TRACE:
        console.trace(formattedMessage, entry.data);
        break;
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '🚨';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.TRACE: return '📍';
      default: return '📝';
    }
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // убираем старые записи
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, data?: any) {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, context, error, data);
    
    this.logToConsole(entry);
    this.addToBuffer(entry);

    // В production критические ошибки можно отправлять сразу
    if (this.isProduction && level === LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    // Здесь можно настроить отправку в Sentry, LogRocket, DataDog и т.д.
    // Пока просто сохраняем в localStorage для debugging
    try {
      const existingLogs = localStorage.getItem('app_error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(entry);
      
      // Храним только последние 50 ошибок
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('app_error_logs', JSON.stringify(logs));
    } catch (e) {
      // Игнорируем ошибки сохранения логов
    }
  }

  private flushLogs() {
    if (this.logBuffer.length === 0) return;
    
    // В production здесь можно отправлять batch логов на сервер
    if (this.isProduction) {
      // Отправка batch логов
    }
    
    // Очищаем буфер после отправки
    this.logBuffer = [];
  }

  // Public API
  error(message: string, context?: LogContext | Error, data?: any) {
    if (context instanceof Error) {
      this.log(LogLevel.ERROR, message, undefined, context, data);
    } else {
      this.log(LogLevel.ERROR, message, context, undefined, data);
    }
  }

  warn(message: string, context?: LogContext, data?: any) {
    this.log(LogLevel.WARN, message, context, undefined, data);
  }

  info(message: string, context?: LogContext, data?: any) {
    this.log(LogLevel.INFO, message, context, undefined, data);
  }

  debug(message: string, context?: LogContext, data?: any) {
    this.log(LogLevel.DEBUG, message, context, undefined, data);
  }

  trace(message: string, context?: LogContext, data?: any) {
    this.log(LogLevel.TRACE, message, context, undefined, data);
  }

  // Утилиты для Web3 контекста
  web3(message: string, data?: any) {
    this.debug(message, { component: 'Web3' }, data);
  }

  transaction(message: string, txHash?: string, data?: any) {
    this.info(message, { component: 'Transaction', txHash }, data);
  }

  contract(message: string, address?: string, data?: any) {
    this.debug(message, { component: 'Contract', address }, data);
  }

  // Методы для настройки
  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogs() {
    this.logBuffer = [];
  }

  // Экспорт логов для debugging
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Создаем singleton instance
export const logger = new ProductionLogger();

// Convenience функции для быстрого использования
export const log = {
  error: (message: string, context?: LogContext | Error, data?: any) => logger.error(message, context, data),
  warn: (message: string, context?: LogContext, data?: any) => logger.warn(message, context, data),
  info: (message: string, context?: LogContext, data?: any) => logger.info(message, context, data),
  debug: (message: string, context?: LogContext, data?: any) => logger.debug(message, context, data),
  trace: (message: string, context?: LogContext, data?: any) => logger.trace(message, context, data),
  web3: (message: string, data?: any) => logger.web3(message, data),
  transaction: (message: string, txHash?: string, data?: any) => logger.transaction(message, txHash, data),
  contract: (message: string, address?: string, data?: any) => logger.contract(message, address, data),
};

// Для migration с console.*
export const loggerCompat = {
  log: (message: any, ...args: any[]) => logger.info(String(message), undefined, args.length > 0 ? args : undefined),
  error: (message: any, ...args: any[]) => logger.error(String(message), undefined, args.length > 0 ? args : undefined),
  warn: (message: any, ...args: any[]) => logger.warn(String(message), undefined, args.length > 0 ? args : undefined),
  info: (message: any, ...args: any[]) => logger.info(String(message), undefined, args.length > 0 ? args : undefined),
  debug: (message: any, ...args: any[]) => logger.debug(String(message), undefined, args.length > 0 ? args : undefined),
  trace: (message: any, ...args: any[]) => logger.trace(String(message), undefined, args.length > 0 ? args : undefined),
};

export default logger; 