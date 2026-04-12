import winston from 'winston';
import path from 'path';

// Define log levels with colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Determine log level based on environment
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs');

// Create the logger
const logger = winston.createLogger({
    level,
    levels,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: consoleFormat,
        }),
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
        }),
    ],
});

// Export logger instance
export default logger;

// Helper functions for structured logging
export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
    logger.http(`${method} ${url} ${statusCode} - ${duration}ms`);
};

export const logError = (error: Error, context?: string) => {
    logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
        stack: error.stack,
        context,
    });
};

export const logInfo = (message: string, meta?: object) => {
    logger.info(message, meta);
};

export const logDebug = (message: string, meta?: object) => {
    logger.debug(message, meta);
};

export const logWarn = (message: string, meta?: object) => {
    logger.warn(message, meta);
};
