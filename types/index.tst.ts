import Fastify, { FastifyInstance } from 'fastify'
import IORedis, { Redis } from 'ioredis'
import { expect } from 'tstyche'
import fastifyRedis, { FastifyRedis, FastifyRedisNamespacedInstance, FastifyRedisPluginOptions } from '.'

const app: FastifyInstance = Fastify()
const redis: Redis = new IORedis({ host: 'localhost', port: 6379 })
const redisCluster = new IORedis.Cluster([{ host: 'localhost', port: 6379 }])

app.register(fastifyRedis, { host: '127.0.0.1' })

app.register(fastifyRedis, {
  client: redis,
  closeClient: true,
  namespace: 'one'
})

app.register(fastifyRedis, {
  namespace: 'two',
  url: 'redis://127.0.0.1:6379'
})

expect<FastifyRedisPluginOptions>().type.toBeAssignableFrom({
  client: redisCluster
})

expect(app.register).type.not.toBeCallableWith(fastifyRedis, {
  namespace: 'three',
  unknownOption: 'this should trigger a typescript error'
})

// Plugin property available
app.after(() => {
  expect(app.redis).type.toBeAssignableTo<Redis>()
  expect(app.redis).type.toBe<FastifyRedis>()

  expect(app.redis).type.toBeAssignableTo<FastifyRedisNamespacedInstance>()
  expect(app.redis.one).type.toBe<Redis | undefined>()
  expect(app.redis.two).type.toBe<Redis | undefined>()
})
