import categoryData from './categories.json'
import templateData from './templates.json'
export const categories = categoryData
export const templates = templateData
export interface ReflectionInput {
  facts: string
  feelings: string
  needs: string
  category: string
  context: string
}
export interface Reflection {
  templateId: string
  gap: string
  action: string
}
export function reflect(input: ReflectionInput): Reflection {
  if (!input.facts.trim()) throw Error('先写下发生的事')
  const template = templates.find(
    (t) => t.category === input.category && t.context === input.context,
  )
  if (!template) throw Error('请选择冲突类型和更接近的情境')
  return { templateId: template.id, gap: template.gap, action: template.action }
}
