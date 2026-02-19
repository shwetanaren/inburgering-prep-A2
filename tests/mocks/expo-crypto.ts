import { createHash } from 'crypto';

export enum CryptoDigestAlgorithm {
  SHA256 = 'SHA256',
}

export async function digestStringAsync(
  algorithm: CryptoDigestAlgorithm,
  data: string
): Promise<string> {
  if (algorithm !== CryptoDigestAlgorithm.SHA256) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
  return createHash('sha256').update(data).digest('hex');
}
