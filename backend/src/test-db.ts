import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function testDatabaseConnection() {
  console.log('🚀 Testing database connection...');

  try {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    console.log('✅ Application created successfully');
    console.log('✅ DataSource injected successfully');

    // Test database connection
    if (dataSource.isInitialized) {
      console.log('✅ Database connection established');

      // Test a simple query
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await dataSource.query('SELECT NOW() as current_time');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (result && result.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.log('✅ Database query successful:', result[0]);
      }

      // Check if our tables would be created (dry run)
      const options = dataSource.options as {
        database?: string;
        host?: string;
      };
      console.log('📊 Database name:', options.database);
      console.log('🏠 Database host:', options.host);
      console.log('📋 Entities loaded:', dataSource.entityMetadatas.length);

      // List loaded entities
      const entityNames = dataSource.entityMetadatas.map(
        (metadata) => metadata.name,
      );
      console.log('📚 Loaded entities:', entityNames.join(', '));
    } else {
      console.log('❌ Database connection not initialized');
    }

    await app.close();
    console.log('✅ Test completed successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Test failed:', error.message);
      console.error('Error details:', error);
    }
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  void testDatabaseConnection();
}
