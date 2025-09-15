import { IsString, Length } from 'class-validator';

export class JoinTenantDto {
  @IsString()
  @Length(6, 12, { message: 'Tenant code must be between 6 and 12 characters' })
  tenantCode: string;
}
