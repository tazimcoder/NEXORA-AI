const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLOR_CODES = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[90m', // Gray
  reset: '\x1b[0m',
};

class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    const color = COLOR_CODES[level] || COLOR_CODES.reset;
    return `${color}[${timestamp}] [${level.toUpperCase()}]${COLOR_CODES.reset} ${message} ${metaString}`;
  }

  info(message, meta) {
    if (LOG_LEVELS[this.level] >= LOG_LEVELS.info) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  warn(message, meta) {
    if (LOG_LEVELS[this.level] >= LOG_LEVELS.warn) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message, meta) {
    if (LOG_LEVELS[this.level] >= LOG_LEVELS.error) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  debug(message, meta) {
    if (LOG_LEVELS[this.level] >= LOG_LEVELS.debug) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
