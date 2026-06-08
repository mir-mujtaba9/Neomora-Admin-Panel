export class TenantListItemDto {
  id!: string;
  name!: string;
  slug!: string;
  subscriptionStatus!: string;
  planName!: string;
  createdAt!: Date;
}

export class ListTenantsResponseDto {
  data!: TenantListItemDto[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
