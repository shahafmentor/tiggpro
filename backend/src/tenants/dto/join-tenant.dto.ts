import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinTenantDto {
  @ApiProperty({
    description: 'Unique tenant code to join a family/organization',
    example: 'ABC12345',
    minLength: 6,
    maxLength: 12,
  })
  @IsString()
  @Length(6, 12, { message: 'Tenant code must be between 6 and 12 characters' })
  tenantCode: string;
}
