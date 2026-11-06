import { it, expect } from 'vitest'
import { encryptBackup, decryptBackup } from '../src/services/backup'
it('round trips encrypted backup without revealing plaintext', async () => {
  const plain = JSON.stringify({ facts: '照护记录内容' })
  const output = await encryptBackup(plain, 'long-test-password')
  expect(output).not.toContain('照护记录')
  expect(await decryptBackup(output, 'long-test-password')).toBe(plain)
})
it('rejects wrong passwords, corruption and too short passwords', async () => {
  await expect(encryptBackup('hello', '123')).rejects.toThrow()
  const output = await encryptBackup('hello', 'long-test-password')
  await expect(decryptBackup(output, 'wrong-password')).rejects.toThrow()
  const data = JSON.parse(output)
  data.cipher = data.cipher.slice(4)
  await expect(decryptBackup(JSON.stringify(data), 'long-test-password')).rejects.toThrow()
})
