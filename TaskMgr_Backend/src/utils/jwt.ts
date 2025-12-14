import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

/**
 * JWT token payload interface
 */
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Decoded JWT token with standard claims
 */
export interface DecodedToken extends AuthTokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token for a user
 * @param payload - User data to include in token
 * @returns Signed JWT token string
 */
export function generateToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };
  
  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode a JWT token without verification (for debugging/testing)
 * @param token - JWT token string to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token - JWT token string to check
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}
