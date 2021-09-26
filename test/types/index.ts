import Fastify, { FastifyInstance } from 'fastify'
import IORedis, { Redis } from 'ioredis'
import { expectAssignable, expectError, expectType } from 'tsd'
import fastifyRedis, { FastifyRedis, FastifyRedisNamespacedInstance } from '../..'

const app: FastifyInstance = Fastify()
const redis: Redis = new IORedis({ host: 'localhost', port: 6379 })

app.register(fastifyRedis, { host: '127.0.0.1' })

app.register(fastifyRedis, {
  client: redis,
  closeClient: true,
  namespace: 'one'
})

app.register(fastifyRedis, {
  keepAlive: 0,
  namespace: 'two',
  url: 'redis://127.0.0.1:6379'
})

expectError(app.register(fastifyRedis, {
  namespace: 'three',
  unknownOption: 'this should trigger a typescript error'
}))

// Plugin property available
app.after(() => {
  expectAssignable<Redis>(app.redis)
  expectType<FastifyRedis>(app.redis)

  expectAssignable<FastifyRedisNamespacedInstance>(app.redis)
  expectType<Redis>(app.redis.one)
  expectType<Redis>(app.redis.two)
})
