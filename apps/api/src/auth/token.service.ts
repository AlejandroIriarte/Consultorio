import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import type { JwtPayload, AuthTokens } from '@consultorio/types';

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async generateTokenPair(
    userId: string,
    tenantId: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, tenantId, role };
    const accessToken = this.jwt.sign(payload);

    const rawRefreshToken = randomBytes(64).toString('hex');
    const family = randomBytes(16).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId, token: tokenHash, family, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async rotateRefreshToken(rawToken: string): Promise<AuthTokens | null> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Expired or not found — invalidate the family to prevent reuse attacks
      if (stored) {
        await this.prisma.refreshToken.deleteMany({ where: { family: stored.family } });
      }
      return null;
    }

    if (stored.usedAt) {
      // Token already used — reuse attack detected, kill the entire family
      await this.prisma.refreshToken.deleteMany({ where: { family: stored.family } });
      return null;
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    return this.generateTokenPair(stored.userId, stored.user.tenantId, stored.user.role);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
