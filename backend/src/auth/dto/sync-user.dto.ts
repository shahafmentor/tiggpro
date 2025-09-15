import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '@tiggpro/shared';

export class SyncUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User avatar/profile image URL',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Unique identifier from the OAuth provider',
    example: '1234567890'
  })
  @IsString()
  providerId: string;

  @ApiProperty({
    description: 'OAuth provider used for authentication',
    enum: AuthProvider,
    example: AuthProvider.GOOGLE
  })
  @IsEnum(AuthProvider)
  provider: AuthProvider;
}
