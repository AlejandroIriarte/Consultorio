import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { DatabaseModule } from './common/database.module';
import { AuditModule } from './common/audit.module';
import { RedisModule } from './common/redis.module';
import { SanitizeMiddleware } from './common/middleware/sanitize.middleware';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    RedisModule,
    AuditModule,
    AuthModule,
    TenantsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Sanitize all incoming request bodies and query params
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}
