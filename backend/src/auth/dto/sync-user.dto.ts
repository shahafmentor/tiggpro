import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { AuthProvider } from '@tiggpro/shared';

export class SyncUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  providerId: string;

  @IsEnum(AuthProvider)
  provider: AuthProvider;
}
