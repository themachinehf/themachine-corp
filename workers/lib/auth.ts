// 密码哈希 - 使用 Web Crypto API
// TODO: 生产环境应使用 argon2 或 bcrypt 更安全的专用密码哈希算法
const STATIC_SALT = 'THEMATHINK_SALT_v1';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + STATIC_SALT);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
