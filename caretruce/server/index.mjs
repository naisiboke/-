import { createServer } from 'node:http'
import { mkdirSync, chmodSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createGateway, createLedger } from './gateway.mjs'
import { openAIProvider, readBounded } from './provider.mjs'
const path = resolve(process.env.CARETRUCE_DB || '/tmp/caretruce-service/ledger.sqlite')
const configured = !!(
  process.env.MODEL_API_URL &&
  process.env.MODEL_API_KEY &&
  process.env.MODEL_NAME
)
mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
const ledger = createLedger(path)
chmodSync(path, 0o600)
const gateway = configured
  ? createGateway({
      ledger,
      provider: openAIProvider({
        url: process.env.MODEL_API_URL,
        key: process.env.MODEL_API_KEY,
        model: process.env.MODEL_NAME,
      }),
    })
  : null
const statuses = {
  UNAUTHORIZED: 401,
  INVALID_INPUT: 400,
  NO_CREDIT: 402,
  DUPLICATE: 409,
  RATE_LIMITED: 429,
  INVALID_OUTPUT: 502,
  UPSTREAM_FAILED: 502,
}
// Tokens are per installation; no shared client secret or public credit-issuance route.
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  const send = (code, body) => {
    res.statusCode = code
    res.end(JSON.stringify(body))
  }
  const origin = req.headers.origin
  if (origin) {
    if (origin !== process.env.CARETRUCE_ALLOWED_ORIGIN) return send(403, { code: 'ORIGIN_DENIED' })
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key')
    return send(204, {})
  }
  if (req.method === 'GET' && req.url === '/health')
    return send(200, { status: 'ok', aiConfigured: configured })
  if (req.url !== '/v1/reflections' || req.method !== 'POST')
    return send(404, { code: 'NOT_FOUND' })
  if (!gateway) return send(503, { code: 'NOT_CONFIGURED' })
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  try {
    if (!req.headers['content-type']?.startsWith('application/json'))
      return send(415, { code: 'JSON_REQUIRED' })
    ledger.balance(token)
    const body = JSON.parse(await readBounded(req, 24000))
    const output = await gateway.run(token, req.headers['idempotency-key'], body)
    send(200, { result: output, remaining: ledger.balance(token) })
  } catch (e) {
    const code = statuses[e.code]
      ? e.code
      : e instanceof SyntaxError
        ? 'INVALID_INPUT'
        : 'REQUEST_FAILED'
    send(statuses[code] || 400, { code })
  }
})
server.requestTimeout = 30000
server.headersTimeout = 10000
server.maxConnections = 100
server.listen(Number(process.env.PORT || 8787), '127.0.0.1', () =>
  console.log('CareTruce gateway listening; model configured:', configured),
)
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () =>
    server.close(() => {
      ledger.close()
      process.exit(0)
    }),
  )
