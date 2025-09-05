import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Enhanced connection options for production
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(mongoUri, options);
    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    });
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      // In production, critical DB errors should trigger alerts
      if (process.env.NODE_ENV === 'production') {
        // This would trigger monitoring alerts in a real production environment
        logger.error('CRITICAL: Database error in production', { error: error.message });
      }
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      // In production, attempt to reconnect or alert operations team
      if (process.env.NODE_ENV === 'production') {
        logger.error('CRITICAL: Database disconnected in production');
      }
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, closing MongoDB connection`);
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error('Database connection failed:', error);
    
    // In production, database connection failure should be fatal
    if (process.env.NODE_ENV === 'production') {
      logger.error('FATAL: Cannot start application without database connection in production');
      process.exit(1);
    } else {
      // In development, warn but continue for API documentation testing
      logger.warn('⚠️  DEVELOPMENT MODE: Continuing without database connection');
      logger.warn('⚠️  Most API endpoints will not work without a database');
      logger.warn('⚠️  Start MongoDB or set NODE_ENV=production to fail fast');
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

// Health check function for the database
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Get database connection status
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    4: 'unauthorized',
    99: 'uninitialized'
  };
  
  return {
    status: states[mongoose.connection.readyState as keyof typeof states] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};