import {
  plainToInstance,
  Transform,
  type TransformFnParams,
} from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value as string, 10))
  PORT: number = 3001;

  @IsString()
  @IsOptional()
  DATABASE_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value as string, 10))
  DATABASE_PORT: number = 5432;

  @IsString()
  @IsOptional()
  DATABASE_USERNAME: string = 'tiggpro_user';

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD: string = 'tiggpro_password';

  @IsString()
  @IsOptional()
  DATABASE_NAME: string = 'tiggpro_dev';

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'your-super-secret-jwt-key-here';

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3000';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
