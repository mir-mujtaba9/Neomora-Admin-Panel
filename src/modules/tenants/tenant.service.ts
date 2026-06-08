import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { ListTenantsResponseDto, TenantListItemDto } from './dto/tenant-list-response.dto';
import { TenantDetailResponseDto } from './dto/tenant-detail-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(dto: CreateTenantDto) {
    const { 
      name, 
      slug, 
      adminEmail, 
      adminPassword, 
      adminFirstName, 
      adminLastName, 
      planCode 
    } = dto;

    return await (this.prisma as any).$transaction(async (tx: any) => {
      // 1. Check tenant slug uniqueness
      const existingTenant = await tx.tenant.findUnique({
        where: { slug },
      });

      if (existingTenant) {
        throw new ConflictException(`Tenant with slug "${slug}" already exists`);
      }

      // 2. Lookup selected Plan
      const plan = await tx.plan.findUnique({
        where: { code: planCode },
      });

      if (!plan) {
        throw new NotFoundException(`Plan with code "${planCode}" not found`);
      }

      // 3. Create Tenant
      // Note: schemaName is required and unique in schema.prisma. 
      // Using slug as schemaName for now as common practice.
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          schemaName: slug.replace(/-/g, '_'), // Standard PG schema naming
          status: 'ACTIVE',
        },
      });

      // 4. Hash password
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      // 5. Create first User (SUPER_ADMIN)
      // Check admin email uniqueness inside that tenant (though it's a new tenant)
      const existingUser = await tx.user.findFirst({
        where: { 
          tenantId: tenant.id,
          email: adminEmail 
        },
      });

      if (existingUser) {
        throw new ConflictException(`User with email "${adminEmail}" already exists in this tenant`);
      }

      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          fullName: `${adminFirstName} ${adminLastName}`.trim(),
          role: 'SUPER_ADMIN',
        },
      });

      // 6. Create Subscription
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
        },
      });

      return {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        adminEmail: adminUser.email,
        temporaryPassword: adminPassword, // As requested in the return structure
      };
    });
  }

  async getTenants(query: ListTenantsQueryDto): Promise<ListTenantsResponseDto> {
    const { page = 1, limit = 10, search, searchBy = 'name' } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      if (searchBy === 'slug') {
        where.slug = { contains: search, mode: 'insensitive' };
      } else {
        where.name = { contains: search, mode: 'insensitive' };
      }
    }

    const [tenants, total] = await Promise.all([
      (this.prisma as any).tenant.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          subscriptions: {
            select: {
              status: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).tenant.count({ where }),
    ]);

    const data: TenantListItemDto[] = tenants.map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      createdAt: t.createdAt,
      subscriptionStatus: t.subscriptions[0]?.status || 'UNKNOWN',
      planName: t.subscriptions[0]?.plan?.name || 'N/A',
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getTenantById(id: string): Promise<TenantDetailResponseDto> {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: { plan: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        users: {
          where: { role: 'SUPER_ADMIN', deletedAt: null },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    if (!tenant.subscriptions[0]) {
      throw new BadRequestException(`Tenant has no active subscription`);
    }

    const adminUser = tenant.users[0];
    if (!adminUser) {
      throw new BadRequestException(`Tenant has no admin user`);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      schemaName: tenant.schemaName,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      deletedAt: tenant.deletedAt,
      subscription: {
        id: tenant.subscriptions[0].id,
        status: tenant.subscriptions[0].status,
        startDate: tenant.subscriptions[0].startDate,
        endDate: tenant.subscriptions[0].endDate,
        createdAt: tenant.subscriptions[0].createdAt,
        updatedAt: tenant.subscriptions[0].updatedAt,
      },
      plan: {
        id: tenant.subscriptions[0].plan.id,
        name: tenant.subscriptions[0].plan.name,
        code: tenant.subscriptions[0].plan.code,
        maxUsers: tenant.subscriptions[0].plan.maxUsers,
        maxLocations: tenant.subscriptions[0].plan.maxLocations,
        maxParticipants: tenant.subscriptions[0].plan.maxParticipants,
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
      },
    };
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    if (tenant.deletedAt) {
      throw new BadRequestException(`Cannot update a deleted tenant`);
    }

    // Check slug uniqueness if slug is being updated
    if (dto.slug && dto.slug !== tenant.slug) {
      const existingSlug = await (this.prisma as any).tenant.findUnique({
        where: { slug: dto.slug },
      });

      if (existingSlug) {
        throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);
      }
    }

    const updated = await (this.prisma as any).tenant.update({
      where: { id },
      data: dto,
    });

    return updated;
  }

  async suspendTenant(id: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    if (tenant.deletedAt) {
      throw new BadRequestException(`Cannot suspend a deleted tenant`);
    }

    if (!tenant.subscriptions[0]) {
      throw new BadRequestException(`Tenant has no active subscription`);
    }

    if (tenant.subscriptions[0].status === 'SUSPENDED') {
      throw new BadRequestException(`Tenant is already suspended`);
    }

    await (this.prisma as any).subscription.update({
      where: { id: tenant.subscriptions[0].id },
      data: { status: 'SUSPENDED' },
    });

    return { message: `Tenant "${id}" has been suspended` };
  }

  async activateTenant(id: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    if (tenant.deletedAt) {
      throw new BadRequestException(`Cannot activate a deleted tenant`);
    }

    if (!tenant.subscriptions[0]) {
      throw new BadRequestException(`Tenant has no active subscription`);
    }

    if (tenant.subscriptions[0].status === 'ACTIVE') {
      throw new BadRequestException(`Tenant is already active`);
    }

    await (this.prisma as any).subscription.update({
      where: { id: tenant.subscriptions[0].id },
      data: { status: 'ACTIVE' },
    });

    return { message: `Tenant "${id}" has been activated` };
  }

  async deleteTenant(id: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    if (tenant.deletedAt) {
      throw new BadRequestException(`Tenant is already deleted`);
    }

    await (this.prisma as any).tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: `Tenant "${id}" has been deleted` };
  }
}
