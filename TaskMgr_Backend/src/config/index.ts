/**
 * Configuration module exports
 */

// Environment configuration
export {
  config,
  isProduction,
  isDevelopment,
  isTest,
  type EnvConfig,
} from './env';

// Database configuration
export {
  connectDatabase,
  disconnectDatabase,
  getConnectionState,
  isConnected,
} from './database';
