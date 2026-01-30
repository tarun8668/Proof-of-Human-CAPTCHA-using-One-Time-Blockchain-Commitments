
/**
 * Simple SHA-256 implementation using Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a one-time commitment hash based on user action and timestamp
 */
export async function generateCommitment(
  movementData: string,
  nonce: string = Math.random().toString(36).substring(7)
): Promise<string> {
  const timestamp = new Date().toISOString();
  const input = `${movementData}|${timestamp}|${nonce}`;
  return await sha256(input);
}
