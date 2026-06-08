import { IsEmail, IsEnum, IsLowercase, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PlanType } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsLowercase()
  slug!: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  adminPassword!: string;

  @IsString()
  @IsNotEmpty()
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty()
  adminLastName!: string;

  @IsEnum(PlanType)
  @IsNotEmpty()
  planCode!: PlanType;
}
