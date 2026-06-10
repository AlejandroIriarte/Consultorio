import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  SetMetadata,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoginRateLimitGuard } from './guards/login-rate-limit.guard';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  VerifyEmailSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  Verify2FASchema,
  type RegisterDto,
  type LoginDto,
  type RefreshTokenDto,
  type VerifyEmailDto,
  type ForgotPasswordDto,
  type ResetPasswordDto,
  type Verify2FADto,
} from '@consultorio/validators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
@Throttle({ auth: { ttl: 60_000, limit: 10 } })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  register(
    @Req() req: { tenant: { id: string } },
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
  ) {
    return this.authService.register(req.tenant.id, dto);
  }

  // LoginRateLimitGuard runs BEFORE JwtAuthGuard for this endpoint:
  // - IP-based: 20 attempts / 5 min → 1 h block
  // - Email-based: 10 attempts / 15 min → 30 min block
  // - Progressive delay: +500 ms per attempt after 3rd
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginRateLimitGuard)
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(
    @Req() req: { tenant: { id: string } },
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ) {
    return this.authService.login(req.tenant.id, dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token' })
  refresh(@Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  logout(@CurrentUser() user: { id: string }) {
    return this.authService.logout(user.id);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar email' })
  verifyEmail(@Body(new ZodValidationPipe(VerifyEmailSchema)) dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Get('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar configuración de 2FA' })
  setup2FA(@CurrentUser() user: { id: string }) {
    return this.authService.setup2FA(user.id);
  }

  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar y activar 2FA' })
  confirm2FA(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(Verify2FASchema)) dto: Verify2FADto,
  ) {
    return this.authService.confirm2FA(user.id, dto.totpCode);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar 2FA' })
  disable2FA(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(Verify2FASchema)) dto: Verify2FADto,
  ) {
    return this.authService.disable2FA(user.id, dto.totpCode);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  // Rate limit forgot-password too to prevent email flooding
  @UseGuards(LoginRateLimitGuard)
  @ApiOperation({ summary: 'Solicitar reset de contraseña' })
  forgotPassword(
    @Req() req: { tenant: { id: string } },
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(req.tenant.id, dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña' })
  resetPassword(@Body(new ZodValidationPipe(ResetPasswordSchema)) dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }
}
