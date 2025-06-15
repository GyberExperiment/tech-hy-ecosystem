/**
 * Production Logger для Node.js scripts
 * Заменяет все console.* calls на structured logging
 */

const LogLevel = {
  ERROR: 0,
  WARN: 1,  
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

class ScriptLogger {
  constructor() {
    this.currentLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.TRACE;
    this.enableColors = process.stdout.isTTY && !process.env.NO_COLOR;
  }

  shouldLog(level) {
    return level <= this.currentLevel;
  }

  getColorCode(level) {
    if (!this.enableColors) return '';
    
    switch (level) {
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.INFO: return '\x1b[32m';  // Green  
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.TRACE: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Reset
    }
  }

  getResetCode() {
    return this.enableColors ? '\x1b[0m' : '';
  }

  getLevelName(level) {
    switch (level) {
      case LogLevel.ERROR: return 'ERROR';
      case LogLevel.WARN: return 'WARN ';
      case LogLevel.INFO: return 'INFO ';
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.TRACE: return 'TRACE';
      default: return 'LOG  ';
    }
  }

  getLevelEmoji(level) {
    switch (level) {
      case LogLevel.ERROR: return '🚨';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.TRACE: return '📍';
      default: return '📝';
    }
  }

  formatTimestamp() {
    return new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
  }

  formatContext(context) {
    if (!context) return '';
    
    const parts = [];
    if (context.script) parts.push(`[${context.script}]`);
    if (context.function) parts.push(`${context.function}()`);
    if (context.contract) parts.push(`contract:${context.contract}`);
    if (context.txHash) parts.push(`tx:${context.txHash.slice(0, 8)}...`);
    if (context.address) parts.push(`addr:${context.address.slice(0, 6)}...`);
    
    return parts.length > 0 ? parts.join(' ') + ' ' : '';
  }

  log(level, message, context, data) {
    if (!this.shouldLog(level)) return;

    const timestamp = this.formatTimestamp();
    const levelName = this.getLevelName(level);
    const emoji = this.getLevelEmoji(level);
    const colorCode = this.getColorCode(level);
    const resetCode = this.getResetCode();
    const contextStr = this.formatContext(context);
    
    const formattedMessage = `${colorCode}${emoji} ${timestamp} ${levelName}${resetCode} ${contextStr}${message}`;
    
    const output = level === LogLevel.ERROR ? console.error : console.log;
    
    if (data !== undefined) {
      output(formattedMessage, data);
    } else {
      output(formattedMessage);
    }
  }

  // Public API
  error(message, context, data) {
    this.log(LogLevel.ERROR, message, context, data);
  }

  warn(message, context, data) {
    this.log(LogLevel.WARN, message, context, data);
  }

  info(message, context, data) {
    this.log(LogLevel.INFO, message, context, data);
  }

  debug(message, context, data) {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  trace(message, context, data) {
    this.log(LogLevel.TRACE, message, context, data);
  }

  // Специальные методы для scripts
  script(message, scriptName, data) {
    this.info(message, { script: scriptName }, data);
  }

  transaction(message, txHash, data) {
    this.info(message, { txHash }, data);
  }

  contract(message, contractAddress, data) {
    this.debug(message, { contract: contractAddress }, data);
  }

  // Разделители для визуального оформления
  separator() {
    this.info('═'.repeat(60));
  }

  section(title) {
    this.info('');
    this.info(`📋 ${title.toUpperCase()}`);
    this.info('─'.repeat(40));
  }

  success(message, context, data) {
    const colorCode = this.enableColors ? '\x1b[32m' : '';
    const resetCode = this.getResetCode();
    this.log(LogLevel.INFO, `${colorCode}✅ ${message}${resetCode}`, context, data);
  }

  failure(message, context, data) {
    const colorCode = this.enableColors ? '\x1b[31m' : '';
    const resetCode = this.getResetCode();
    this.log(LogLevel.ERROR, `${colorCode}❌ ${message}${resetCode}`, context, data);
  }

  // Методы для настройки
  setLevel(level) {
    this.currentLevel = level;
  }

  getLevel() {
    return this.currentLevel;
  }
}

// Создаем singleton instance
const logger = new ScriptLogger();

// Convenience экспорты
const log = {
  error: (message, context, data) => logger.error(message, context, data),
  warn: (message, context, data) => logger.warn(message, context, data),
  info: (message, context, data) => logger.info(message, context, data),
  debug: (message, context, data) => logger.debug(message, context, data),
  trace: (message, context, data) => logger.trace(message, context, data),
  script: (message, scriptName, data) => logger.script(message, scriptName, data),
  transaction: (message, txHash, data) => logger.transaction(message, txHash, data),
  contract: (message, contractAddress, data) => logger.contract(message, contractAddress, data),
  separator: () => logger.separator(),
  section: (title) => logger.section(title),
  success: (message, context, data) => logger.success(message, context, data),
  failure: (message, context, data) => logger.failure(message, context, data),
};

// Совместимость с console.*
const loggerCompat = {
  log: (message, ...args) => logger.info(String(message), undefined, args.length > 0 ? args : undefined),
  error: (message, ...args) => logger.error(String(message), undefined, args.length > 0 ? args : undefined),
  warn: (message, ...args) => logger.warn(String(message), undefined, args.length > 0 ? args : undefined),
  info: (message, ...args) => logger.info(String(message), undefined, args.length > 0 ? args : undefined),
  debug: (message, ...args) => logger.debug(String(message), undefined, args.length > 0 ? args : undefined),
  trace: (message, ...args) => logger.trace(String(message), undefined, args.length > 0 ? args : undefined),
};

module.exports = {
  logger,
  log,
  loggerCompat,
  LogLevel
}; 