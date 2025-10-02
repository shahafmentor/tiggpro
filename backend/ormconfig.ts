const { DataSource } = require('typeorm');
const { config } = require('dotenv');

// Load environment variables
config();

// Parse DATABASE_URL if provided, otherwise use individual env vars
const parseDatabaseUrl = (url) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      username: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1), // Remove leading /
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    return null;
  }
};

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL) || {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'tiggpro_user',
  password: process.env.DATABASE_PASSWORD || 'tiggpro_password',
  database: process.env.DATABASE_NAME || 'tiggpro_dev',
};

const dataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/src/migrations/**/*.js'],
  synchronize: false, // Never use synchronize in production
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = dataSource;
