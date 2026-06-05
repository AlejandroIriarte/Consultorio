import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwoFactorService } from './two-factor.service';
import { TokenService } from './token.service';
import { LoginRateLimitGuard } from './guards/login-rate-limit.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    // Fallback throttler for endpoints not covered by LoginRateLimitGuard
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TwoFactorService, TokenService, LoginRateLimitGuard],
  exports: [AuthService, JwtStrategy, LoginRateLimitGuard],
})
export class AuthModule {}
