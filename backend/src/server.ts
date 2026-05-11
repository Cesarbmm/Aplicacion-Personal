import { env } from './config/env.js'
import { createPool } from './db/pool.js'
import { createPostgresTrainingRepository } from './repositories/postgres-training-repository.js'
import { createPostgresUserProfileRepository } from './repositories/postgres-user-profile-repository.js'
import { createApp } from './app.js'

const pool = createPool()
const repository = createPostgresUserProfileRepository(pool)
const trainingRepository = createPostgresTrainingRepository(pool)
const app = createApp({
  userProfileRepository: repository,
  trainingRepository,
  frontendOrigin: env.FRONTEND_ORIGIN,
})

const server = app.listen(env.PORT, () => {
  console.log(`SigmaFit backend running on http://0.0.0.0:${env.PORT}`)
})

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Closing SigmaFit backend.`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
