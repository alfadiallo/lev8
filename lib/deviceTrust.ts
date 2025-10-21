import crypto from 'crypto';

export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const combined = `${userAgent}||${ipAddress}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

export function getClientIpAddress(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

export function getClientUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}