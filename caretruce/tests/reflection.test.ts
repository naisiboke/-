import { describe, it, expect } from 'vitest'
import { categories, reflect, templates } from '../src/domain/reflection'
describe('offline reflection', () => {
  it('rejects empty facts', () =>
    expect(() =>
      reflect({ facts: '  ', feelings: '', needs: '', category: 'tasks', context: 'unassigned' }),
    ).toThrow())
  it('covers all six types with at least three contexts and one action', () => {
    expect(categories).toHaveLength(6)
    for (const c of categories) {
      expect(templates.filter((t) => t.category === c.id).length).toBeGreaterThanOrEqual(3)
      for (const t of templates.filter((t) => t.category === c.id)) {
        const input = {
          facts: '今天复诊没有确认谁陪同',
          feelings: '疲惫',
          needs: '明确分工',
          category: c.id,
          context: t.context,
        }
        const before = JSON.stringify(input)
        const result = reflect(input)
        expect(result.templateId).toBe(t.id)
        expect(result.action.length).toBeGreaterThan(10)
        expect(JSON.stringify(input)).toBe(before)
      }
    }
  })
  it('rejects unknown categories', () =>
    expect(() =>
      reflect({ facts: '发生了分歧', feelings: '', needs: '', category: 'unknown', context: '' }),
    ).toThrow())
})
