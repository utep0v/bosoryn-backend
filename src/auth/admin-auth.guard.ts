import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      admin?: unknown;
    }>();
    const authorization = request.headers?.authorization;
    const rawHeader = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!rawHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const token = rawHeader.slice('Bearer '.length);
    request.admin = await this.authService.verifyAccessToken(token);
    return true;
  }
}
