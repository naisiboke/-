import { reflect, type Reflection, type ReflectionInput } from '../domain/reflection'
// Records contain JSON data only; avoid platform-specific structuredClone.
function copy<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}
export type Status = 'ready' | 'tried' | 'helped' | 'unsuitable'
export interface CareRecord {
  id: string
  createdAt: string
  input: ReflectionInput
  result: Reflection
  status: Status
  note: string
}
export interface Store {
  read(): Promise<string | null>
  write(value: string): Promise<void>
}
interface State {
  version: 1
  draft: ReflectionInput | null
  records: CareRecord[]
}
export function memoryStore(): Store {
  let value: string | null = null
  return {
    read: async () => value,
    write: async (v) => {
      value = v
    },
  }
}
function validInput(x: any): x is ReflectionInput {
  return (
    x &&
    ['facts', 'feelings', 'needs', 'category', 'context'].every((k) => typeof x[k] === 'string')
  )
}
function parse(raw: string | null): State {
  if (raw === null) return { version: 1, draft: null, records: [] }
  try {
    const x = JSON.parse(raw)
    if (
      x.version !== 1 ||
      !Array.isArray(x.records) ||
      (x.draft !== null && !validInput(x.draft)) ||
      !x.records.every(
        (r: any) =>
          typeof r.id === 'string' &&
          typeof r.createdAt === 'string' &&
          validInput(r.input) &&
          typeof r.result?.action === 'string' &&
          typeof r.result?.gap === 'string' &&
          ['ready', 'tried', 'helped', 'unsuitable'].includes(r.status) &&
          typeof r.note === 'string',
      )
    )
      throw Error()
    return x
  } catch {
    throw Error('记录读取失败，原数据已保留')
  }
}
export function createRepository(store: Store) {
  let queue: Promise<unknown> = Promise.resolve()
  const read = async () => parse(await store.read())
  function mutate<T>(fn: (s: State) => T): Promise<T> {
    const operation = queue.then(async () => {
      const state = await read()
      const result = fn(state)
      await store.write(JSON.stringify(state))
      return copy(result)
    })
    queue = operation.catch(() => {})
    return operation
  }
  return {
    saveDraft: (draft: ReflectionInput) =>
      mutate((s) => {
        s.draft = copy(draft)
      }),
    loadDraft: async () => {
      await queue
      return (await read()).draft
    },
    saveRecord: (id: string, input: ReflectionInput) =>
      mutate((s) => {
        const existing = s.records.find((r) => r.id === id)
        if (existing) return existing
        const result = reflect(input)
        const record: CareRecord = {
          id,
          createdAt: new Date().toISOString(),
          input: copy(input),
          result,
          status: 'ready',
          note: '',
        }
        s.records.unshift(record)
        s.draft = null
        return record
      }),
    listRecords: async () => {
      await queue
      return (await read()).records
    },
    updateRecord: (
      id: string,
      patch: Partial<Pick<CareRecord, 'status' | 'note' | 'input' | 'result'>>,
    ) =>
      mutate((s) => {
        const record = s.records.find((r) => r.id === id)
        if (!record) throw Error('找不到这条记录')
        if (patch.input) reflect(patch.input)
        Object.assign(record, copy(patch))
        return record
      }),
    deleteRecord: (id: string) =>
      mutate((s) => {
        s.records = s.records.filter((r) => r.id !== id)
      }),
    clear: () =>
      mutate((s) => {
        s.draft = null
        s.records = []
      }),
  }
}
export const repository = createRepository(memoryStore())
