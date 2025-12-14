import { config, isProduction, isDevelopment, isTest } from './env';
import { getConnectionState, isConnected } from './database';

describe('Environment Configuration', () => {
  it('should load configuration with required fields', () => {
    expect(config).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
    expect(config.port).toBeGreaterThan(0);
    expect(config.mongodbUri).toBeDefined();
    expect(config.jwtSecret).toBeDefined();
    expect(config.jwtExpiresIn).toBeDefined();
    expect(config.corsOrigin).toBeDefined();
    expect(config.bcryptSaltRounds).toBeGreaterThan(0);
    expect(config.socketIoCorsOrigin).toBeDefined();
  });

  it('should have valid port number', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThan(65536);
  });

  it('should have valid bcrypt salt rounds', () => {
    expect(config.bcryptSaltRounds).toBeGreaterThanOrEqual(8);
    expect(config.bcryptSaltRounds).toBeLessThanOrEqual(15);
  });

  it('should correctly identify environment', () => {
    const envChecks = [isProduction(), isDevelopment(), isTest()];
    const trueCount = envChecks.filter(Boolean).length;
    expect(trueCount).toBe(1); // Exactly one should be true
  });
});

describe('Database Configuration', () => {
  it('should provide connection state', () => {
    const state = getConnectionState();
    expect(state).toBeGreaterThanOrEqual(0);
    expect(state).toBeLessThanOrEqual(3);
  });

  it('should check connection status', () => {
    const connected = isConnected();
    expect(typeof connected).toBe('boolean');
  });
});
