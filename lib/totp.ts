import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function generateTOTPSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `Elevate (${email})`,
    issuer: 'Elevate',
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes: generateBackupCodes(),
  };
}

export function verifyTOTPCode(secret: string, token: string): boolean {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });

  return verified;
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}