import test from 'node:test'
import assert from 'node:assert/strict'
import { createGateway, createLedger } from './gateway.mjs'
const input = { text: '今天复诊没有确认谁陪同', category: 'tasks' }
const output = {
  facts: '今天复诊没有确认陪同人',
  feelings: '疲惫',
  needs: '明确分工',
  gap: '责任尚未确认',
  action: '下次复诊前两天，确认谁来陪诊。',
}
test('authentication and quota prevent unauthorized model use', async () => {
  const ledger = createLedger(':memory:')
  const gate = createGateway({ ledger, provider: async () => output })
  await assert.rejects(gate.run('bad', 'request-001', input), { code: 'UNAUTHORIZED' })
  const token = ledger.issue(0)
  await assert.rejects(gate.run(token, 'request-001', input), { code: 'NO_CREDIT' })
  ledger.close()
})
test('concurrent requests cannot overspend and duplicate id does not charge twice', async () => {
  const ledger = createLedger(':memory:')
  const token = ledger.issue(1)
  let release
  const wait = new Promise((r) => (release = r))
  const gate = createGateway({
    ledger,
    provider: async () => {
      await wait
      return output
    },
  })
  const first = gate.run(token, 'request-001', input)
  await assert.rejects(gate.run(token, 'request-001', input), { code: 'DUPLICATE' })
  await assert.rejects(gate.run(token, 'request-002', input), { code: 'NO_CREDIT' })
  release()
  assert.deepEqual(await first, output)
  assert.equal(ledger.balance(token), 0)
  assert.deepEqual(await gate.run(token, 'request-001', input), output)
  ledger.close()
})
test('provider failure and invalid output refund reserved credit without storing text', async () => {
  const ledger = createLedger(':memory:')
  const token = ledger.issue(1)
  const gate = createGateway({ ledger, provider: async () => ({ action: 'bad' }) })
  await assert.rejects(gate.run(token, 'request-001', input), { code: 'INVALID_OUTPUT' })
  assert.equal(ledger.balance(token), 1)
  const timeout = createGateway({
    ledger,
    provider: async () => new Promise(() => {}),
    timeoutMs: 10,
  })
  await assert.rejects(timeout.run(token, 'request-002', input), { code: 'UPSTREAM_FAILED' })
  assert.equal(ledger.balance(token), 1)
  ledger.close()
})
test('rejects oversized text before reserving credit', async () => {
  const ledger = createLedger(':memory:')
  const token = ledger.issue(1)
  const gate = createGateway({ ledger, provider: async () => output })
  await assert.rejects(gate.run(token, 'request-001', { ...input, text: 'x'.repeat(6001) }), {
    code: 'INVALID_INPUT',
  })
  assert.equal(ledger.balance(token), 1)
  ledger.close()
})
test('successful response can be retried without a second debit', async () => {
  const ledger = createLedger(':memory:')
  const token = ledger.issue(2)
  const gate = createGateway({ ledger, provider: async () => output })
  assert.deepEqual(await gate.run(token, 'retry-0001', input), output)
  assert.deepEqual(await gate.run(token, 'retry-0001', input), output)
  assert.equal(ledger.balance(token), 1)
  await assert.rejects(gate.run(token, 'retry-0001', { ...input, text: 'different text' }), {
    code: 'DUPLICATE',
  })
  ledger.close()
})
test('failed providers are still rate limited', async () => {
  const ledger = createLedger(':memory:')
  const token = ledger.issue(1)
  const gate = createGateway({
    ledger,
    provider: async () => {
      throw Error('offline')
    },
    maxRequests: 2,
  })
  await assert.rejects(gate.run(token, 'failed-001', input), { code: 'UPSTREAM_FAILED' })
  await assert.rejects(gate.run(token, 'failed-002', input), { code: 'UPSTREAM_FAILED' })
  await assert.rejects(gate.run(token, 'failed-003', input), { code: 'RATE_LIMITED' })
  assert.equal(ledger.balance(token), 1)
  ledger.close()
})
