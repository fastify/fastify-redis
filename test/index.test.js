'use strict'

const whyIsNodeRunning = require('why-is-node-running')
const { test } = require('node:test')
const proxyquire = require('proxyquire')
const Fastify = require('fastify')
const Redis = require('ioredis')
const fastifyRedis = require('..')

test.beforeEach(async () => {
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await fastify.ready()
  await fastify.redis.flushall()
  await fastify.close()
})

test('fastify.redis should exist', async (t) => {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await fastify.ready()
  t.assert.ok(fastify.redis)

  await fastify.close()
})

test('fastify.redis should support url', async (t) => {
  t.plan(2)
  const fastify = Fastify()

  const fastifyRedis = proxyquire('..', {
    ioredis: function Redis (path, options) {
      t.assert.deepStrictEqual(path, 'redis://127.0.0.1')
      t.assert.deepStrictEqual(options, {
        otherOption: 'foo'
      })
      this.quit = () => {}
      this.info = cb => cb(null, 'info')
      this.on = function (name, handler) {
        if (name === 'ready') {
          handler(null, 'ready')
        }

        return this
      }
      this.status = 'ready'
      this.off = function () { return this }

      return this
    }
  })

  fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    otherOption: 'foo'
  })

  await fastify.ready()

  await fastify.close()
})

test('fastify.redis should be the redis client', async (t) => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await fastify.ready()

  await fastify.redis.set('key', 'value')
  const val = await fastify.redis.get('key')
  t.assert.deepStrictEqual(val, 'value')

  await fastify.close()
})

test('fastify.redis.test namespace should exist', async (t) => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1',
    namespace: 'test'
  })

  await fastify.ready()

  t.assert.ok(fastify.redis)
  t.assert.ok(fastify.redis.test)

  await fastify.close()
})

test('fastify.redis.test should be the redis client', async (t) => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1',
    namespace: 'test'
  })

  await fastify.ready()

  await fastify.redis.test.set('key_namespace', 'value_namespace')
  const val = await fastify.redis.test.get('key_namespace')
  t.assert.deepStrictEqual(val, 'value_namespace')

  await fastify.close()
})

test('promises support', async (t) => {
  t.plan(1)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await fastify.ready()

  await fastify.redis.set('key', 'value')
  const val = await fastify.redis.get('key')
  t.assert.deepStrictEqual(val, 'value')

  await fastify.close()
})

test('custom ioredis client that is already connected', async (t) => {
  t.plan(3)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  await redis.set('key', 'value')
  const val = await redis.get('key')
  t.assert.deepStrictEqual(val, 'value')

  fastify.register(fastifyRedis, {
    client: redis,
    lazyConnect: false
  })

  await fastify.ready()

  t.assert.deepStrictEqual(fastify.redis, redis)

  await fastify.redis.set('key2', 'value2')
  const val2 = await fastify.redis.get('key2')
  t.assert.deepStrictEqual(val2, 'value2')

  await fastify.close()
  await fastify.redis.quit()
})

test('If closeClient is enabled, close the client.', async (t) => {
  t.plan(4)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  await redis.set('key', 'value')
  const val = await redis.get('key')
  t.assert.deepStrictEqual(val, 'value')

  fastify.register(fastifyRedis, {
    client: redis,
    closeClient: true
  })

  await fastify.ready()

  t.assert.deepStrictEqual(fastify.redis, redis)

  await fastify.redis.set('key2', 'value2')
  const val2 = await fastify.redis.get('key2')
  t.assert.deepStrictEqual(val2, 'value2')

  const originalQuit = fastify.redis.quit
  fastify.redis.quit = (callback) => {
    t.assert.ok('redis client closed')
    originalQuit.call(fastify.redis, callback)
  }

  await fastify.close()
})

test('If closeClient is enabled, close the client namespace.', async (t) => {
  t.plan(4)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  await redis.set('key', 'value')
  const val = await redis.get('key')
  t.assert.deepStrictEqual(val, 'value')

  fastify.register(fastifyRedis, {
    client: redis,
    namespace: 'foo',
    closeClient: true
  })

  await fastify.ready()

  t.assert.deepStrictEqual(fastify.redis.foo, redis)

  await fastify.redis.foo.set('key2', 'value2')
  const val2 = await fastify.redis.foo.get('key2')
  t.assert.deepStrictEqual(val2, 'value2')

  const originalQuit = fastify.redis.foo.quit
  fastify.redis.foo.quit = (callback) => {
    t.assert.ok('redis client closed')
    originalQuit.call(fastify.redis.foo, callback)
  }

  await fastify.close()
})

test('fastify.redis.test should throw with duplicate connection namespaces', async (t) => {
  t.plan(1)

  const namespace = 'test'

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: '127.0.0.1',
      namespace
    })
    .register(fastifyRedis, {
      host: '127.0.0.1',
      namespace
    })

  await t.assert.rejects(fastify.ready(), new Error(`Redis '${namespace}' instance namespace has already been registered`))
})

test('Should throw when trying to register multiple instances without giving a namespace', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: '127.0.0.1'
    })
    .register(fastifyRedis, {
      host: '127.0.0.1'
    })

  await t.assert.rejects(fastify.ready(), new Error('@fastify/redis has already been registered'))
})

test('Should not throw within different contexts', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(function (instance, _options, next) {
    instance.register(fastifyRedis, {
      host: '127.0.0.1'
    })
    next()
  })

  fastify.register(function (instance, _options, next) {
    instance
      .register(fastifyRedis, {
        host: '127.0.0.1',
        namespace: 'test1'
      })
      .register(fastifyRedis, {
        host: '127.0.0.1',
        namespace: 'test2'
      })
    next()
  })

  await fastify.ready()
  t.assert.ok(fastify)
})

// Skipped because it makes TAP crash
test('Should throw when trying to connect on an invalid host', { skip: true }, async (t) => {
  t.plan(1)

  const fastify = Fastify({ pluginTimeout: 20000 })
  t.after(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: 'invalid_host'
    })

  await t.assert.rejects(fastify.ready())
})

test('Should successfully create a Redis client when registered with a `url` option and without a `client` option in a namespaced instance', async t => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  await fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    namespace: 'test'
  })

  await fastify.ready()
  t.assert.ok(fastify.redis)
  t.assert.ok(fastify.redis.test)
})

test('Should be able to register multiple namespaced @fastify/redis instances', async t => {
  t.plan(3)

  const fastify = Fastify()
  t.after(() => fastify.close())

  await fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    namespace: 'one'
  })

  await fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    namespace: 'two'
  })

  await fastify.ready()
  t.assert.ok(fastify.redis)
  t.assert.ok(fastify.redis.one)
  t.assert.ok(fastify.redis.two)
})

test('Should throw when @fastify/redis is initialized with an option that makes Redis throw', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  // This will throw a `TypeError: this.options.Connector is not a constructor`
  fastify.register(fastifyRedis, {
    Connector: 'should_fail'
  })

  await t.assert.rejects(fastify.ready())
})

test('Should throw when @fastify/redis is initialized with a namespace and an option that makes Redis throw', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  // This will throw a `TypeError: this.options.Connector is not a constructor`
  fastify.register(fastifyRedis, {
    Connector: 'should_fail',
    namespace: 'fail'
  })

  await t.assert.rejects(fastify.ready())
})

test('catch .ping() errors', async (t) => {
  t.plan(1)
  const fastify = Fastify()
  t.after(() => fastify.close())

  const fastifyRedis = proxyquire('..', {
    ioredis: function Redis () {
      this.ping = () => {
        return Promise.reject(new Redis.ReplyError('ping error'))
      }
      this.quit = () => {}
      this.info = cb => cb(null, 'info')
      this.on = function () {
        return this
      }
      this.off = function () { return this }

      return this
    }
  })

  fastify.register(fastifyRedis)

  await t.assert.rejects(fastify.ready(), new Redis.ReplyError('ping error'))
})

setInterval(() => {
  whyIsNodeRunning()
}, 5000).unref()
