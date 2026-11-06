import { it, expect } from 'vitest'
import { createRepository, memoryStore } from '../src/storage/records'
const input = {
  facts: '今天复诊没有提前确认陪同人',
  feelings: '疲惫',
  needs: '分担',
  category: 'tasks',
  context: 'unassigned',
}
it('round trips draft and saves idempotently without losing facts', async () => {
  const repo = createRepository(memoryStore())
  await repo.saveDraft(input)
  expect(await repo.loadDraft()).toEqual(input)
  const a = await repo.saveRecord('same', input)
  const b = await repo.saveRecord('same', input)
  expect(b.id).toBe(a.id)
  expect(await repo.listRecords()).toHaveLength(1)
  await repo.updateRecord(a.id, { status: 'tried' })
  expect((await repo.listRecords())[0].status).toBe('tried')
  await repo.deleteRecord(a.id)
  expect(await repo.listRecords()).toEqual([])
})
it('refuses corrupt stored state without overwriting it', async () => {
  const store = memoryStore()
  await store.write('broken')
  const repo = createRepository(store)
  await expect(repo.saveRecord('1', input)).rejects.toThrow()
  expect(await store.read()).toBe('broken')
})
it('propagates writes failing instead of claiming success', async () => {
  const repo = createRepository({
    read: async () => null,
    write: async () => {
      throw Error('full')
    },
  })
  await expect(repo.saveDraft(input)).rejects.toThrow('full')
})
