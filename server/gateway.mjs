import { DatabaseSync } from 'node:sqlite'
import { createHash, randomBytes } from 'node:crypto'
const fail = (code) => Object.assign(new Error(code), { code })
const hash = (token) => createHash('sha256').update(token).digest('hex')
export function createLedger(path) {
  const db = new DatabaseSync(path)
  db.exec(
    `PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,credit INTEGER NOT NULL CHECK(credit>=0));CREATE TABLE IF NOT EXISTS requests(account TEXT NOT NULL,key TEXT NOT NULL,state TEXT NOT NULL,PRIMARY KEY(account,key));`,
  )
  // Single active process only: restore reservations left by an interrupted process.
  db.exec(
    `BEGIN IMMEDIATE; UPDATE accounts SET credit=credit+(SELECT COUNT(*) FROM requests WHERE account=accounts.id AND state='reserved');DELETE FROM requests WHERE state='reserved';COMMIT;`,
  )
  function account(token) {
    if (typeof token !== 'string' || token.length < 30 || token.length > 256)
      throw fail('UNAUTHORIZED')
    const id = hash(token)
    const row = db.prepare('SELECT credit FROM accounts WHERE id=?').get(id)
    if (!row) throw fail('UNAUTHORIZED')
    return { id, credit: row.credit }
  }
  return {
    issue(credit) {
      if (!Number.isSafeInteger(credit) || credit < 0) throw Error('Invalid credit')
      const token = randomBytes(32).toString('base64url')
      db.prepare('INSERT INTO accounts VALUES(?,?)').run(hash(token), credit)
      return token
    },
    balance(token) {
      return account(token).credit
    },
    reserve(token, key) {
      const { id } = account(token)
      db.exec('BEGIN IMMEDIATE')
      try {
        if (db.prepare('SELECT state FROM requests WHERE account=? AND key=?').get(id, key))
          throw fail('DUPLICATE')
        const update = db
          .prepare('UPDATE accounts SET credit=credit-1 WHERE id=? AND credit>0')
          .run(id)
        if (!update.changes) throw fail('NO_CREDIT')
        db.prepare('INSERT INTO requests VALUES(?,?,?)').run(id, key, 'reserved')
        db.exec('COMMIT')
        return id
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    },
    finish(id, key) {
      db.prepare(
        "UPDATE requests SET state='complete' WHERE account=? AND key=? AND state='reserved'",
      ).run(id, key)
    },
    refund(id, key) {
      db.exec('BEGIN IMMEDIATE')
      try {
        const change = db
          .prepare("DELETE FROM requests WHERE account=? AND key=? AND state='reserved'")
          .run(id, key)
        if (change.changes) db.prepare('UPDATE accounts SET credit=credit+1 WHERE id=?').run(id)
        db.exec('COMMIT')
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    },
    close() {
      db.close()
    },
  }
}
export function createGateway({
  ledger,
  provider,
  timeoutMs = 25000,
  maxRequests = 6,
  maxConcurrent = 2,
  now = Date.now,
}) {
  const cache = new Map(),
    rates = new Map(),
    active = new Map()
  const cacheTTL = 120000
  return {
    async run(token, key, input) {
      ledger.balance(token)
      if (
        !/^[A-Za-z0-9_-]{8,100}$/.test(key || '') ||
        !input ||
        typeof input.text !== 'string' ||
        !input.text.trim() ||
        input.text.length > 6000 ||
        !['tasks', 'medical', 'information', 'cost', 'support', 'remote'].includes(input.category)
      )
        throw fail('INVALID_INPUT')
      const time = now(),
        accountKey = hash(token),
        requestKey = accountKey + ':' + key
      const fingerprint = hash(JSON.stringify({ text: input.text, category: input.category }))
      for (const [k, v] of cache) if (v.expires <= time) cache.delete(k)
      for (const [k, v] of rates) if (v.start + 60000 <= time) rates.delete(k)
      const cached = cache.get(requestKey)
      if (cached) {
        if (cached.fingerprint !== fingerprint) throw fail('DUPLICATE')
        return structuredClone(cached.result)
      }
      // Reserve detects duplicate in-flight keys before applying account concurrency.
      const account = ledger.reserve(token, key)
      let rate = rates.get(accountKey)
      if (!rate) {
        if (rates.size >= 10000) {
          ledger.refund(account, key)
          throw fail('RATE_LIMITED')
        }
        rate = { start: time, count: 0 }
        rates.set(accountKey, rate)
      }
      if (rate.count >= maxRequests || (active.get(accountKey) || 0) >= maxConcurrent) {
        ledger.refund(account, key)
        throw fail('RATE_LIMITED')
      }
      rate.count++
      active.set(accountKey, (active.get(accountKey) || 0) + 1)
      const controller = new AbortController()
      let timer
      try {
        const output = await Promise.race([
          provider(input, controller.signal),
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              controller.abort()
              reject(fail('UPSTREAM_FAILED'))
            }, timeoutMs)
          }),
        ])
        const keys = ['facts', 'feelings', 'needs', 'gap', 'action']
        if (
          !output ||
          !keys.every(
            (k) =>
              typeof output[k] === 'string' &&
              output[k].trim().length > 0 &&
              output[k].length <= 2000,
          )
        )
          throw fail('INVALID_OUTPUT')
        const result = Object.fromEntries(keys.map((k) => [k, output[k]]))
        ledger.finish(account, key)
        if (cache.size >= 512) cache.delete(cache.keys().next().value)
        cache.set(requestKey, {
          fingerprint,
          result: structuredClone(result),
          expires: now() + cacheTTL,
        })
        const expiry = setTimeout(() => cache.delete(requestKey), cacheTTL)
        expiry.unref?.()
        // Raw outputs exist only in bounded volatile memory for retry recovery, never in SQLite.
        return result
      } catch (e) {
        ledger.refund(account, key)
        if (e.code === 'INVALID_OUTPUT') throw e
        throw fail('UPSTREAM_FAILED')
      } finally {
        clearTimeout(timer)
        const n = (active.get(accountKey) || 1) - 1
        if (n) active.set(accountKey, n)
        else active.delete(accountKey)
      }
    },
  }
}
