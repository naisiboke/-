const iterations = 310000
const maxSize = 10_000_000
function engine() {
  if (!globalThis.crypto?.subtle) throw Error('此环境不支持安全备份')
  return globalThis.crypto
}
function encode(bytes: Uint8Array) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
function decode(text: string) {
  if (typeof text !== 'string' || text.length > maxSize || !/^[A-Za-z0-9+/]*={0,2}$/.test(text))
    throw Error('备份格式无效')
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
}
async function key(password: string, salt: Uint8Array) {
  const crypto = engine()
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}
export async function encryptBackup(text: string, password: string): Promise<string> {
  if (password.length < 12) throw Error('请使用至少 12 位的备份密码')
  if (new TextEncoder().encode(text).length > 7_000_000) throw Error('备份内容过大')
  const crypto = engine(),
    salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await key(password, salt),
    new TextEncoder().encode(text),
  )
  return JSON.stringify({
    version: 1,
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: encode(salt),
    iv: encode(iv),
    cipher: encode(new Uint8Array(cipher)),
  })
}
export async function decryptBackup(text: string, password: string): Promise<string> {
  if (text.length > maxSize) throw Error('备份内容过大')
  try {
    const data = JSON.parse(text)
    if (
      data.version !== 1 ||
      data.algorithm !== 'AES-256-GCM' ||
      data.kdf !== 'PBKDF2-SHA256' ||
      data.iterations !== iterations
    )
      throw Error()
    const salt = decode(data.salt),
      iv = decode(data.iv)
    if (salt.length !== 16 || iv.length !== 12) throw Error()
    const plain = await engine().subtle.decrypt(
      { name: 'AES-GCM', iv },
      await key(password, salt),
      decode(data.cipher),
    )
    return new TextDecoder().decode(plain)
  } catch {
    throw Error('密码不正确，或备份文件已损坏')
  }
}
