import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class TwoFactorService {
  constructor(private config: ConfigService) {}

  private get encryptionKey(): string {
    return this.config.getOrThrow('TOTP_ENCRYPTION_KEY');
  }

  generateSecret(email: string): { secret: string; otpauthUrl: string } {
    const generated = speakeasy.generateSecret({
      name: `Consultorio (${email})`,
      issuer: 'Consultorio',
      length: 20,
    });
    return {
      secret: generated.base32,
      otpauthUrl: generated.otpauth_url ?? '',
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  encryptSecret(secret: string): string {
    return CryptoJS.AES.encrypt(secret, this.encryptionKey).toString();
  }

  decryptSecret(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
