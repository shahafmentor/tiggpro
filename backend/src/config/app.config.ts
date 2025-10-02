import { registerAs } from '@nestjs/config';

// Parse REDIS_URL if provided, otherwise use individual env vars
const parseRedisUrl = (url?: string) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
    };
  } catch (error) {
    console.error('Failed to parse REDIS_URL:', error);
    return null;
  }
};

const redisConfig = parseRedisUrl(process.env.REDIS_URL) || {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Redis Configuration
  redisHost: redisConfig.host,
  redisPort: redisConfig.port,

  // File Upload Configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
  ],
}));
