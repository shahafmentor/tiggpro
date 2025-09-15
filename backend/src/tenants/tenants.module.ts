import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { AuthModule } from '@/auth/auth.module';
import { Tenant, TenantMember, User } from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantMember, User]),
    AuthModule, // For guards and auth service
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
