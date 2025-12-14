import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyToken, AuthTokenPayload } from '../utils/jwt';

/**
 * Extended Socket interface with user data
 */
export interface AuthenticatedSocket extends Socket {
  user?: AuthTokenPayload;
}

/**
 * Socket.IO server instance
 */
let io: SocketIOServer | null = null;

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from socket handshake and attaches user data to socket
 * @param socket - Socket.IO socket instance
 * @param next - Callback to continue or reject connection
 */
export function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void): void {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify the JWT token
    const decoded = verifyToken(token);

    // Attach user data to socket
    socket.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Continue with connection
    next();
  } catch (error) {
    // Reject connection with authentication error
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    next(new Error(`Authentication error: ${errorMessage}`));
  }
}

/**
 * Initialize Socket.IO server with Express HTTP server
 * @param httpServer - HTTP server instance from Express
 * @returns Socket.IO server instance
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  // Create Socket.IO server with CORS configuration
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.socketIoCorsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Connection settings
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Set up connection event handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id}, user: ${socket.user?.userId}`);

    // Join user to their own room for targeted notifications
    if (socket.user?.userId) {
      socket.join(socket.user.userId);
      console.log(`User ${socket.user.userId} joined their room`);
    }

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('Socket.IO server initialized with authentication');
  return io;
}

/**
 * Get the Socket.IO server instance
 * @returns Socket.IO server instance or null if not initialized
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Close the Socket.IO server
 */
export function closeSocketIO(): void {
  if (io) {
    io.close();
    io = null;
    console.log('Socket.IO server closed');
  }
}
