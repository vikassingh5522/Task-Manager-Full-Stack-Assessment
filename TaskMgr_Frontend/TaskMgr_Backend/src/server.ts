import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeSocketIO, closeSocketIO } from './socket';

/**
 * TaskMgr Backend Server Entry Point
 * 
 * Initializes and starts the server with:
 * - Express application
 * - MongoDB connection
 * - Socket.IO real-time communication
 * - Graceful shutdown handling
 */

// Create Express application
const app = createApp();

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDatabase(config.mongodbUri);

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log('='.repeat(50));
      console.log(`✓ TaskMgr Backend Server started successfully`);
      console.log(`  - Environment: ${config.nodeEnv}`);
      console.log(`  - Port: ${config.port}`);
      console.log(`  - URL: http://localhost:${config.port}`);
      console.log(`  - Health Check: http://localhost:${config.port}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close HTTP server (stop accepting new connections)
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ HTTP server closed');
          resolve();
        }
      });
    });

    // Close Socket.IO connections
    closeSocketIO();

    // Disconnect from MongoDB
    await disconnectDatabase();

    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

// Export for testing
export { app, httpServer };
