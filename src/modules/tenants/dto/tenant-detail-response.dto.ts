export class TenantDetailSubscriptionDto {
  id!: string;
  status!: string;
  startDate!: Date;
  endDate!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class TenantDetailPlanDto {
  id!: string;
  name!: string;
  code!: string;
  maxUsers!: number;
  maxLocations!: number;
  maxParticipants!: number;
}

export class TenantDetailAdminUserDto {
  id!: string;
  email!: string;
  fullName!: string | null;
  role!: string;
  createdAt!: Date;
}

export class TenantDetailResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  schemaName!: string;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
  subscription!: TenantDetailSubscriptionDto;
  plan!: TenantDetailPlanDto;
  adminUser!: TenantDetailAdminUserDto;
}
