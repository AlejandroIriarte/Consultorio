import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
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
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Sanitize all incoming request bodies and query params
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}
