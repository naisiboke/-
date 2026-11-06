import { it, expect } from 'vitest'
import { redact } from '../src/services/privacy'
it('redacts phone, email, identity number and explicitly named people without dropping conflict facts', () => {
  const result = redact('张三在市医院复诊，电话13800138000，邮箱a@b.cn，证件11010519491231002X', [
    '张三',
    '市医院',
  ])
  expect(result).not.toContain('张三')
  expect(result).not.toContain('市医院')
  expect(result).not.toContain('13800138000')
  expect(result).not.toContain('a@b.cn')
  expect(result).not.toContain('11010519491231002X')
  expect(result).toContain('复诊')
})
it('preserves unrelated content and treats literal names as literal strings', () => {
  expect(redact('今天有分歧')).toBe('今天有分歧')
  expect(redact('a.b和axb', ['a.b'])).toBe('[已隐去]和axb')
})
