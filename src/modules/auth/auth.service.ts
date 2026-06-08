import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AdminJwtPayload } from '../../common/types/admin-jwt-payload.type';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(admin.id, admin.email, admin.role);
  }

  async issueToken(id: string, email: string, role: string): Promise<LoginResponseDto> {
    const payload: AdminJwtPayload = {
      sub: id,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
