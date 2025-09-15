import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiDoc } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, TypeOrmHealthIndicator } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check', description: 'General health check including database connectivity' })
  @ApiDoc({ status: 200, description: 'Health check passed' })
  @ApiDoc({ status: 503, description: 'Health check failed' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check', description: 'Checks if the application is ready to serve requests' })
  @ApiDoc({ status: 200, description: 'Application is ready' })
  @ApiDoc({ status: 503, description: 'Application is not ready' })
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness check', description: 'Checks if the application is alive and responding' })
  @ApiDoc({ status: 200, description: 'Application is alive' })
  @ApiDoc({ status: 503, description: 'Application is not responding' })
  liveness() {
    return this.health.check([]);
  }
}
