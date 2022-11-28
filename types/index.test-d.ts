import Fastify, { FastifyInstance } from 'fastify'
import IORedis, { Redis } from 'ioredis'
import { expectAssignable, expectDeprecated, expectError, expectType } from 'tsd'
import fastifyRedis, { FastifyRedis, FastifyRedisPlugin, FastifyRedisNamespacedInstance, FastifyRedisPluginOptions } from '..'

const app: FastifyInstance = Fastify()
const redis: Redis = new IORedis({ host: 'localhost', port: 6379 })
const redisCluster= new IORedis.Cluster([{ host: 'localhost', port: 6379 }])

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

expectAssignable<FastifyRedisPluginOptions>({
  client: redisCluster
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

expectDeprecated({} as FastifyRedisPlugin)
