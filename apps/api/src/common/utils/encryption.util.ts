import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const ivLength = 16;
const algorithm = 'aes-256-cbc';

// In production, this keys should proveided by environment variable mechanism
// For MVP, we derive it or use a fixed one if ENV is set.
// Ideally ENCRYPTION_KEY should be 32 bytes hex string.
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; // 32 chars for demo

export class EncryptionUtil {
  static async encrypt(text: string): Promise<string> {
    const iv = randomBytes(ivLength);
    const cipher = createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  static async decrypt(text: string): Promise<string> {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(
      algorithm,
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
