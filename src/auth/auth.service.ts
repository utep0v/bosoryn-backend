import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface AdminLoginDto {
  username: string;
  password: string;
}

export interface AdminJwtPayload {
  sub: 'admin';
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(payload: AdminLoginDto) {
    const adminUsername =
      this.configService.get<string>('ADMIN_USERNAME') ?? 'admin';
    const adminPassword =
      this.configService.get<string>('ADMIN_PASSWORD') ?? 'admin12345';

    if (
      payload.username.trim() !== adminUsername ||
      payload.password !== adminPassword
    ) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const jwtPayload: AdminJwtPayload = {
      sub: 'admin',
      username: adminUsername,
      role: 'admin',
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '24h',
      admin: {
        username: adminUsername,
        role: 'admin' as const,
      },
    };
  }

  async verifyAccessToken(token: string): Promise<AdminJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<AdminJwtPayload>(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') ?? 'supersecretkey',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
