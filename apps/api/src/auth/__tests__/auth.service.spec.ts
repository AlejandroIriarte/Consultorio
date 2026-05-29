import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { TwoFactorService } from '../two-factor.service';
import { PrismaService } from '../../common/prisma.service';

const mockUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hash',
  firstName: 'Juan',
  lastName: 'Pérez',
  role: 'RECEPTIONIST',
  isActive: true,
  isEmailVerified: true,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  emailVerificationToken: null,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let tokenService: jest.Mocked<TokenService>;
  let twoFactorService: jest.Mocked<TwoFactorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokenPair: jest.fn(),
            revokeAllUserTokens: jest.fn(),
            rotateRefreshToken: jest.fn(),
          },
        },
        {
          provide: TwoFactorService,
          useValue: {
            generateSecret: jest.fn(),
            generateQRCode: jest.fn(),
            verifyToken: jest.fn(),
            encryptSecret: jest.fn(),
            decryptSecret: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    tokenService = module.get(TokenService);
    twoFactorService = module.get(TwoFactorService);
  });

  describe('register', () => {
    const dto = {
      email: 'nuevo@example.com',
      password: 'Segura123!',
      firstName: 'Juan',
      lastName: 'Pérez',
    };

    it('should create user and return success message', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockUser, email: dto.email } as any);

      const result = await service.register('tenant-1', dto);

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('Cuenta creada');
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.register('tenant-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'correctPassword' };

    it('should return tokens on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      prisma.user.update.mockResolvedValue(mockUser as any);
      tokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await service.login('tenant-1', dto);

      expect(result.accessToken).toBe('access');
      expect(result.refreshToken).toBe('refresh');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('tenant-1', dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password and increment counter', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      prisma.user.update.mockResolvedValue({ ...mockUser, failedLoginAttempts: 1 } as any);

      await expect(service.login('tenant-1', dto)).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 1 }),
        }),
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      const almostLocked = { ...mockUser, failedLoginAttempts: 4 };
      prisma.user.findUnique.mockResolvedValue(almostLocked as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      prisma.user.update.mockResolvedValue({ ...almostLocked, lockedUntil: new Date() } as any);

      await expect(service.login('tenant-1', dto)).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
        }),
      );
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60_000),
      };
      prisma.user.findUnique.mockResolvedValue(lockedUser as any);

      await expect(service.login('tenant-1', dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should require 2FA code when 2FA is enabled', async () => {
      const userWith2FA = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'encrypted' };
      prisma.user.findUnique.mockResolvedValue(userWith2FA as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.login('tenant-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should accept valid 2FA code', async () => {
      const userWith2FA = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'encrypted' };
      prisma.user.findUnique.mockResolvedValue(userWith2FA as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      twoFactorService.decryptSecret.mockReturnValue('base32secret');
      twoFactorService.verifyToken.mockReturnValue(true);
      prisma.user.update.mockResolvedValue(userWith2FA as any);
      tokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await service.login('tenant-1', { ...dto, totpCode: '123456' });

      expect(result.accessToken).toBe('access');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerificationToken: 'token123' } as any);
      prisma.user.update.mockResolvedValue({ ...mockUser, isEmailVerified: true } as any);

      const result = await service.verifyEmail('token123');

      expect(result.message).toContain('verificado');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isEmailVerified: true, emailVerificationToken: null },
        }),
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should revoke all user tokens', async () => {
      tokenService.revokeAllUserTokens.mockResolvedValue(undefined);

      const result = await service.logout('user-1');

      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith('user-1');
      expect(result.message).toContain('cerrada');
    });
  });

  describe('forgotPassword', () => {
    it('should return same message regardless of email existence', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result1 = await service.forgotPassword('tenant-1', { email: 'noexiste@x.com' });

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      const result2 = await service.forgotPassword('tenant-1', { email: 'test@example.com' });

      expect(result1.message).toBe(result2.message);
    });
  });
});
