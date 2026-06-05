import { Injectable, Inject } from '@nestjs/common';
import type Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, ttlSeconds);
    return count;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }
}
