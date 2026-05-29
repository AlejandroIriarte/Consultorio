import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { DatabaseModule } from './common/database.module';
import { AuditModule } from './common/audit.module';
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
    AuditModule,
    AuthModule,
    TenantsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
