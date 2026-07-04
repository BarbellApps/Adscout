import { randomBytes, createHash } from 'node:crypto'

export function generateApiKeyPlaintext(): string {
  return `adsk_${randomBytes(24).toString('base64url')}`
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
