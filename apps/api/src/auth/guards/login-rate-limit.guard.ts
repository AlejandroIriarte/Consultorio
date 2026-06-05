import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../common/redis.service';
import { Request } from 'express';

// Limits for IP-based rate limiting
const IP_WINDOW_SECONDS = 300;    // 5 minutes
const IP_MAX_ATTEMPTS = 20;       // max 20 login attempts per IP per 5 min
const IP_BLOCK_SECONDS = 3600;    // 1 hour block after exceeding

// Limits for email-based rate limiting (detects credential stuffing)
const EMAIL_WINDOW_SECONDS = 900; // 15 minutes
const EMAIL_MAX_ATTEMPTS = 10;    // max 10 attempts per email per 15 min
const EMAIL_BLOCK_SECONDS = 1800; // 30 min block per email

// Progressive delay thresholds (ms added per attempt after threshold)
const DELAY_AFTER_ATTEMPTS = 3;
const DELAY_MS_PER_ATTEMPT = 500;
const MAX_DELAY_MS = 5000;

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(req);
    const email = (req.body?.email as string | undefined)?.toLowerCase().trim();

    // --- IP block check ---
    const ipBlockKey = `login:block:ip:${ip}`;
    const ipBlocked = await this.redis.get(ipBlockKey);
    if (ipBlocked) {
      const remainingTtl = await this.redis.ttl(ipBlockKey);
      const minutes = Math.ceil(remainingTtl / 60);
      throw new HttpException(
        `Demasiados intentos. IP bloqueada por ${minutes} minutos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // --- Email block check ---
    if (email) {
      const emailBlockKey = `login:block:email:${email}`;
      const emailBlocked = await this.redis.get(emailBlockKey);
      if (emailBlocked) {
        const remainingTtl = await this.redis.ttl(emailBlockKey);
        const minutes = Math.ceil(remainingTtl / 60);
        throw new HttpException(
          `Cuenta bloqueada temporalmente. Intentá de nuevo en ${minutes} minutos.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // --- IP attempt counter ---
    const ipCountKey = `login:attempts:ip:${ip}`;
    const ipAttempts = await this.redis.increment(ipCountKey, IP_WINDOW_SECONDS);

    if (ipAttempts > IP_MAX_ATTEMPTS) {
      await this.redis.set(ipBlockKey, '1', IP_BLOCK_SECONDS);
      await this.redis.delete(ipCountKey);
      throw new HttpException(
        'Demasiados intentos desde tu dirección. IP bloqueada por 1 hora.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // --- Email attempt counter ---
    if (email) {
      const emailCountKey = `login:attempts:email:${email}`;
      const emailAttempts = await this.redis.increment(emailCountKey, EMAIL_WINDOW_SECONDS);

      if (emailAttempts > EMAIL_MAX_ATTEMPTS) {
        const emailBlockKey = `login:block:email:${email}`;
        await this.redis.set(emailBlockKey, '1', EMAIL_BLOCK_SECONDS);
        await this.redis.delete(emailCountKey);
        throw new HttpException(
          'Cuenta bloqueada temporalmente por múltiples intentos fallidos.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // --- Progressive delay after N attempts ---
    if (ipAttempts > DELAY_AFTER_ATTEMPTS) {
      const delayMs = Math.min(
        (ipAttempts - DELAY_AFTER_ATTEMPTS) * DELAY_MS_PER_ATTEMPT,
        MAX_DELAY_MS,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return true;
  }

  private getClientIp(req: Request): string {
    // Trust CF-Connecting-IP (Cloudflare) or X-Forwarded-For (proxy)
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return Array.isArray(cfIp) ? cfIp[0] : cfIp;

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',');
      return ips[0].trim();
    }

    return req.ip ?? '0.0.0.0';
  }
}
