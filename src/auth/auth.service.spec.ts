import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AuthService, type AdminJwtPayload } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-secret',
              JWT_EXPIRES_IN: '24h',
              ADMIN_USERNAME: 'admin',
              ADMIN_PASSWORD: 'admin12345',
            }),
          ],
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: {
            expiresIn: '24h' as StringValue,
          },
        }),
      ],
      providers: [AuthService, ConfigService],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('logs in admin and returns access token', async () => {
    const result = await authService.loginAdmin({
      username: 'admin',
      password: 'admin12345',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.admin.role).toBe('admin');
  });

  it('verifies access token', async () => {
    const login = await authService.loginAdmin({
      username: 'admin',
      password: 'admin12345',
    });

    const payload: AdminJwtPayload = await authService.verifyAccessToken(
      login.accessToken,
    );

    expect(payload.role).toBe('admin');
    expect(payload.username).toBe('admin');
  });
});
