import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { LoginRateLimitGuard } from '../login-rate-limit.guard';
import { RedisService } from '../../../common/redis.service';

function makeContext(ip: string, email?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        ip,
        headers: {},
        body: email ? { email } : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('LoginRateLimitGuard', () => {
  let guard: LoginRateLimitGuard;
  let redis: jest.Mocked<RedisService>;

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      increment: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      ttl: jest.fn().mockResolvedValue(3600),
    } as unknown as jest.Mocked<RedisService>;

    guard = new LoginRateLimitGuard(redis);
  });

  it('should allow a normal login attempt', async () => {
    const result = await guard.canActivate(makeContext('1.2.3.4', 'user@example.com'));
    expect(result).toBe(true);
  });

  it('should block if IP is in blocklist', async () => {
    redis.get.mockImplementation((key) =>
      Promise.resolve(key.includes('block:ip') ? '1' : null),
    );

    await expect(guard.canActivate(makeContext('1.2.3.4', 'user@example.com'))).rejects.toThrow(
      HttpException,
    );
  });

  it('should block if email is in blocklist', async () => {
    redis.get.mockImplementation((key) =>
      Promise.resolve(key.includes('block:email') ? '1' : null),
    );

    await expect(guard.canActivate(makeContext('1.2.3.4', 'user@example.com'))).rejects.toThrow(
      HttpException,
    );
  });

  it('should throw 429 and set IP block when IP attempts exceed limit', async () => {
    redis.increment.mockResolvedValue(21); // over the 20 limit

    await expect(guard.canActivate(makeContext('1.2.3.4', 'user@example.com'))).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('block:ip:1.2.3.4'),
      '1',
      3600,
    );
  });

  it('should throw 429 and set email block when email attempts exceed limit', async () => {
    redis.increment
      .mockResolvedValueOnce(5)   // IP attempts — below limit
      .mockResolvedValueOnce(11); // email attempts — over limit of 10

    await expect(guard.canActivate(makeContext('1.2.3.4', 'user@example.com'))).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('block:email:user@example.com'),
      '1',
      1800,
    );
  });

  it('should use CF-Connecting-IP header when present', async () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: '10.0.0.1',
          headers: { 'cf-connecting-ip': '5.5.5.5' },
          body: { email: 'user@example.com' },
        }),
      }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);

    expect(redis.increment).toHaveBeenCalledWith(
      expect.stringContaining('5.5.5.5'),
      expect.any(Number),
    );
  });
});
