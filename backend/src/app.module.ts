import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { TenantsModule } from '@/tenants/tenants.module';
import { validate } from '@/config/validation';
import databaseConfig from '@/config/database.config';
import appConfig from '@/config/app.config';
import {
  LoggerMiddleware,
  GlobalExceptionFilter,
  ResponseInterceptor
} from '@/common';

@Module({
  imports: [
    // Configuration module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),

    // TypeORM module with configuration
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig(),
    }),

    // Feature modules
    AuthModule,
    TenantsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logger middleware to all routes
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
