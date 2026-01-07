import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { Logger } from '@nestjs/common';

const ivLength = 16;
const algorithm = 'aes-256-cbc';
const logger = new Logger('EncryptionUtil');

// SECURITY: ENCRYPTION_KEY must be provided via environment variable
// Generate using: openssl rand -base64 32 | tr -d '\n' | cut -c1-32
// Must be exactly 32 characters for AES-256
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -base64 32 | tr -d '\\n' | cut -c1-32",
    );
  }

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters for AES-256');
  }
  return key;
}

const ENCRYPTION_KEY = getEncryptionKey();

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
