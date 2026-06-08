import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';

@ApiTags('Admin Profile')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  @Get('profile')
  @UseGuards(AdminJwtGuard)
  @ApiOperation({ summary: 'Get current platform admin profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cuid12345' },
        email: { type: 'string', example: 'admin@neomora.com' },
        role: { type: 'string', example: 'OWNER' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  getProfile(@CurrentAdmin() admin: any) {
    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };
  }
}
