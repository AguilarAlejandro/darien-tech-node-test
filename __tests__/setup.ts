// Global Jest setup: ensure environment variables are defined before any module loads them
import * as dotenv from 'dotenv'
import { resolve } from 'node:path'

dotenv.config({ path: resolve(__dirname, '../.env') })

// Use test DB if available, otherwise fall back to dev DB
// (for local development both can share the same DB)
if (process.env.DATABASE_URL_TEST) {
  // Only switch if the test DB URL is explicitly different
  // and we've verified it exists — for simplicity we keep dev DB in local env
  // process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
}

// Suppress pino pretty output in tests — already handled by config but belt-and-suspenders
process.env.NODE_ENV = 'test'
