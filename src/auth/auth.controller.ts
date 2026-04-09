import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService, type AdminJwtPayload } from './auth.service';

@Controller('auth/admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body()
    body: {
      username: string;
      password: string;
    },
  ) {
    return this.authService.loginAdmin(body);
  }

  @Get('me')
  async me(
    @Headers('authorization') authorization?: string,
  ): Promise<AdminJwtPayload> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = authorization.slice('Bearer '.length);
    return this.authService.verifyAccessToken(token);
  }
}
