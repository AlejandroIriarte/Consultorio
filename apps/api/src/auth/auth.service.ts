import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@consultorio/validators';
import type { AuthTokens } from '@consultorio/types';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private twoFactorService: TwoFactorService,
  ) {}

  async register(
    tenantId: string,
    dto: RegisterDto,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const emailVerificationToken = randomBytes(32).toString('hex');

    await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerificationToken,
      },
    });

    // TODO: send verification email via Resend

    return { message: 'Cuenta creada. Revisá tu email para verificarla.' };
  }

  async login(tenantId: string, dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intentá de nuevo en ${minutesLeft} minutos.`,
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const isLocked = attempts >= MAX_FAILED_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: isLocked
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
            : null,
        },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        throw new BadRequestException('Se requiere el código de autenticación 2FA');
      }
      const secret = this.twoFactorService.decryptSecret(user.twoFactorSecret!);
      const valid = this.twoFactorService.verifyToken(secret, dto.totpCode);
      if (!valid) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    return this.tokenService.generateTokenPair(user.id, user.tenantId, user.role);
  }

  async refreshTokens(rawToken: string): Promise<AuthTokens> {
    const tokens = await this.tokenService.rotateRefreshToken(rawToken);
    if (!tokens) {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }
    return tokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.tokenService.revokeAllUserTokens(userId);
    return { message: 'Sesión cerrada correctamente' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
    if (!user) throw new BadRequestException('Token de verificación inválido');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerificationToken: null },
    });

    return { message: 'Email verificado correctamente' };
  }

  async setup2FA(
    userId: string,
  ): Promise<{ secret: string; qrCode: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.email);
    const qrCode = await this.twoFactorService.generateQRCode(otpauthUrl);
    const encryptedSecret = this.twoFactorService.encryptSecret(secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptedSecret, twoFactorEnabled: false },
    });

    return { secret, qrCode, otpauthUrl };
  }

  async confirm2FA(userId: string, totpCode: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Primero iniciá la configuración de 2FA');
    }

    const secret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
    const valid = this.twoFactorService.verifyToken(secret, totpCode);
    if (!valid) throw new BadRequestException('Código inválido');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA activado correctamente' };
  }

  async disable2FA(userId: string, totpCode: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('El 2FA no está activo');
    }

    const secret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
    const valid = this.twoFactorService.verifyToken(secret, totpCode);
    if (!valid) throw new BadRequestException('Código inválido');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { message: '2FA desactivado correctamente' };
  }

  async forgotPassword(
    tenantId: string,
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });

    // Always return the same message to prevent email enumeration
    if (!user) {
      return { message: 'Si el email existe, recibirás las instrucciones.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60_000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });

    // TODO: send reset email via Resend

    return { message: 'Si el email existe, recibirás las instrucciones.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Token inválido o expirado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    await this.tokenService.revokeAllUserTokens(user.id);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
