import { IsString, IsOptional, IsLowercase } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsLowercase()
  slug?: string;
}
