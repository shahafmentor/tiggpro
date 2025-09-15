const { DataSource } = require('typeorm');
const { config } = require('dotenv');

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'tiggpro_user',
  password: process.env.DATABASE_PASSWORD || 'tiggpro_password',
  database: process.env.DATABASE_NAME || 'tiggpro_dev',
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/src/migrations/**/*.js'],
  synchronize: false, // Never use synchronize in production
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = dataSource;
