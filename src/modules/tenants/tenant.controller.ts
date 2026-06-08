import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';

@ApiTags('Admin - Tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(AdminJwtGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Provision a new tenant' })
  @ApiCreatedResponse({
    description: 'Tenant created successfully',
    schema: {
      example: {
        tenantId: 'uuid-here',
        tenantSlug: 'my-club',
        adminEmail: 'admin@myclub.com',
        temporaryPassword: 'TempPass123!',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input or validation failed' })
  @ApiConflictResponse({ description: 'Tenant slug or email already exists' })
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.createTenant(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants with pagination and search' })
  @ApiOkResponse({
    description: 'List of tenants',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'My Club',
            slug: 'my-club',
            subscriptionStatus: 'ACTIVE',
            planName: 'Professional',
            createdAt: '2026-06-08T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
        },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'searchBy',
    required: false,
    enum: ['name', 'slug'],
    description: 'Search field (default: name)',
  })
  async list(@Query() query: ListTenantsQueryDto) {
    return this.tenantService.getTenants(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant details with subscription and plan info' })
  @ApiOkResponse({
    description: 'Tenant details',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'My Club',
        slug: 'my-club',
        schemaName: 'my_club',
        status: 'ACTIVE',
        createdAt: '2026-06-08T00:00:00Z',
        updatedAt: '2026-06-08T00:00:00Z',
        deletedAt: null,
        subscription: {
          id: 'sub-id',
          status: 'ACTIVE',
          startDate: '2026-06-08T00:00:00Z',
          endDate: null,
          createdAt: '2026-06-08T00:00:00Z',
          updatedAt: '2026-06-08T00:00:00Z',
        },
        plan: {
          id: 'plan-id',
          name: 'Professional',
          code: 'PROFESSIONAL',
          maxUsers: 250,
          maxLocations: 5,
          maxParticipants: 2000,
        },
        adminUser: {
          id: 'user-id',
          email: 'admin@myclub.com',
          fullName: 'John Doe',
          role: 'SUPER_ADMIN',
          createdAt: '2026-06-08T00:00:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  async getById(@Param('id') id: string) {
    return this.tenantService.getTenantById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant name and/or slug' })
  @ApiOkResponse({
    description: 'Tenant updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Cannot update deleted tenant or invalid input' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  @ApiConflictResponse({ description: 'Slug already in use' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantService.updateTenant(id, updateTenantDto);
  }

  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a tenant (subscription status -> SUSPENDED)' })
  @ApiOkResponse({
    description: 'Tenant suspended successfully',
    schema: {
      example: {
        message: 'Tenant "id" has been suspended',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Tenant already suspended, deleted, or has no subscription',
  })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  async suspend(@Param('id') id: string) {
    return this.tenantService.suspendTenant(id);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a tenant (subscription status -> ACTIVE)' })
  @ApiOkResponse({
    description: 'Tenant activated successfully',
    schema: {
      example: {
        message: 'Tenant "id" has been activated',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Tenant already active, deleted, or has no subscription',
  })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  async activate(@Param('id') id: string) {
    return this.tenantService.activateTenant(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a tenant' })
  @ApiOkResponse({
    description: 'Tenant deleted successfully',
    schema: {
      example: {
        message: 'Tenant "id" has been deleted',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Tenant already deleted' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  async delete(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }
}
