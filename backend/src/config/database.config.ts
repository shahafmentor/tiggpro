import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

// Parse DATABASE_URL if provided, otherwise use individual env vars
const parseDatabaseUrl = (url?: string) => {
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

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    ...dbConfig,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  }),
);

// DataSource for CLI operations (migrations, etc.)
const cliDbConfig = parseDatabaseUrl(process.env.DATABASE_URL) || {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'tiggpro_user',
  password: process.env.DATABASE_PASSWORD || 'tiggpro_password',
  database: process.env.DATABASE_NAME || 'tiggpro_dev',
};

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...cliDbConfig,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
  synchronize: false, // Never synchronize in CLI mode
  logging: false,
};

export const dataSource = new DataSource(dataSourceOptions);
