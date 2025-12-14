import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  bcryptSaltRounds: number;
  socketIoCorsOrigin: string;
}

const validateEnv = (): void => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  // Validate JWT_SECRET strength in production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      console.warn(
        '⚠ WARNING: JWT_SECRET should be at least 32 characters long in production'
      );
    }
  }
};

/**
 * Parse and return typed configuration object
 */
const getConfig = (): EnvConfig => {
  // Validate environment variables first
  validateEnv();

  return {
    // Server Configuration
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    
    // Database Configuration
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmgr',
    
    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    
    // CORS Configuration
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    
    // Security
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    
    // Socket.IO Configuration
    socketIoCorsOrigin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3001',
  };
};

/**
 * Exported configuration object
 */
export const config: EnvConfig = getConfig();


export const isProduction = (): boolean => {
  return config.nodeEnv === 'production';
};


export const isDevelopment = (): boolean => {
  return config.nodeEnv === 'development';
};

export const isTest = (): boolean => {
  return config.nodeEnv === 'test';
};


if (!isTest()) {
  console.log('Configuration loaded:');
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Port: ${config.port}`);
  console.log(`  - MongoDB URI: ${config.mongodbUri.replace(/\/\/.*@/, '//***@')}`);
  console.log(`  - CORS Origin: ${config.corsOrigin}`);
  console.log(`  - JWT Expires In: ${config.jwtExpiresIn}`);
}
