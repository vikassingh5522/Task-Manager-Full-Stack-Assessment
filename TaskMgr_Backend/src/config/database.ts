import mongoose from 'mongoose';

/**
 * Database configuration and connection management
 */

interface ConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: ConnectionOptions = {
  maxRetries: 5,
  retryDelay: 5000, // 5 seconds
};

/**
 * Connect to MongoDB with retry logic
 * @param uri MongoDB connection URI
 * @param options Connection options
 * @returns Promise that resolves when connected
 */
export const connectDatabase = async (
  uri: string,
  options: ConnectionOptions = DEFAULT_OPTIONS
): Promise<void> => {
  const { maxRetries = 5, retryDelay = 5000 } = options;
  let retries = 0;

  const connect = async (): Promise<void> => {
    try {
      await mongoose.connect(uri);
      console.log('✓ MongoDB connected successfully');
      
      // Set up connection event handlers
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✓ MongoDB reconnected successfully');
      });

    } catch (error) {
      retries++;
      console.error(`MongoDB connection failed (attempt ${retries}/${maxRetries}):`, error);

      if (retries < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return connect();
      } else {
        console.error('Max retries reached. Could not connect to MongoDB.');
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      }
    }
  };

  await connect();
};

/**
 * Disconnect from MongoDB
 * @returns Promise that resolves when disconnected
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✓ MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Get the current connection state
 * @returns Connection state (0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
 */
export const getConnectionState = (): number => {
  return mongoose.connection.readyState;
};

/**
 * Check if database is connected
 * @returns True if connected, false otherwise
 */
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
