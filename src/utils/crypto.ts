import crypto from'crypto';

// The key must be exactly 32 bytes (64 hex characters if hex, or a 32 character string)
// We will derive a 32-byte key from the env variable to ensure correct length.
function getKey() {
  const secret = process.env.SYNC_ENCRYPTION_KEY ||'default_insecure_key_for_development';
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
}

const ALGORITHM ='aes-256-cbc';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getKey()), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') +':'+ encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) throw new Error("Invalid encrypted string format");
  const iv = Buffer.from(ivStr,'hex');
  const encryptedText = Buffer.from(textParts.join(':'),'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getKey()), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
