'use strict'

const t = require('tap')
const proxyquire = require('proxyquire')
const test = t.test
const Fastify = require('fastify')
const fastifyRedis = require('..')

const TEST_PASSWORD = 'my_secret_password'

const setRedisPassword = async (password) => {
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await fastify.ready()
  await fastify.redis.flushall()
  await fastify.redis.config(['set', 'requirepass', password])
  await fastify.close()
}

const unsetRedisPassword = async (currentPassword) => {
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1',
    password: currentPassword
  })

  await fastify.ready()
  await fastify.redis.flushall()
  await fastify.redis.config(['set', 'requirepass', ''])
  await fastify.close()
}

t.beforeEach(async () => {
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await fastify.ready()
  await fastify.redis.flushall()
  await fastify.close()
})

test('fastify.redis should exist', (t) => {
  t.plan(2)
  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  fastify.ready((err) => {
    t.error(err)
    t.ok(fastify.redis)

    fastify.close()
  })
})

test('fastify.redis should support url', (t) => {
  t.plan(3)
  const fastify = Fastify()

  const fastifyRedis = proxyquire('..', {
    ioredis: function Redis (path, options) {
      t.equal(path, 'redis://127.0.0.1')
      t.same(options, {
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
      this.off = function () { return this }

      return this
    }
  })

  fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    otherOption: 'foo'
  })

  fastify.ready((err) => {
    t.error(err)
    fastify.close()
  })
})

test('fastify.redis should be the redis client', (t) => {
  t.plan(4)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  fastify.ready((err) => {
    t.error(err)

    fastify.redis.set('key', 'value', (err) => {
      t.error(err)
      fastify.redis.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        fastify.close()
      })
    })
  })
})

test('fastify.redis.test namespace should exist', (t) => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1',
    namespace: 'test'
  })

  fastify.ready((err) => {
    t.error(err)
    t.ok(fastify.redis)
    t.ok(fastify.redis.test)

    fastify.close()
  })
})

test('fastify.redis.test should be the redis client', (t) => {
  t.plan(4)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1',
    namespace: 'test'
  })

  fastify.ready((err) => {
    t.error(err)

    fastify.redis.test.set('key_namespace', 'value_namespace', (err) => {
      t.error(err)
      fastify.redis.test.get('key_namespace', (err, val) => {
        t.error(err)
        t.equal(val, 'value_namespace')

        fastify.close()
      })
    })
  })
})

test('promises support', (t) => {
  t.plan(2)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  fastify.ready((err) => {
    t.error(err)

    fastify.redis
      .set('key', 'value')
      .then(() => {
        return fastify.redis.get('key')
      })
      .then((val) => {
        t.equal(val, 'value')
        fastify.close()
      })
      .catch((err) => t.fail(err))
  })
})

test('custom client', (t) => {
  t.plan(7)
  const fastify = Fastify()
  const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

  fastify.register(fastifyRedis, { client: redis })

  fastify.ready((err) => {
    t.error(err)
    t.equal(fastify.redis, redis)

    fastify.redis.set('key', 'value', (err) => {
      t.error(err)
      fastify.redis.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        fastify.close(function (err) {
          t.error(err)
          fastify.redis.quit(function (err) {
            t.error(err)
          })
        })
      })
    })
  })
})

test('custom ioredis client that is already connected', (t) => {
  t.plan(10)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  // use the client now, so that it is connected and ready
  redis.set('key', 'value', (err) => {
    t.error(err)
    redis.get('key', (err, val) => {
      t.error(err)
      t.equal(val, 'value')

      fastify.register(fastifyRedis, {
        client: redis,
        lazyConnect: false
      })

      fastify.ready((err) => {
        t.error(err)
        t.equal(fastify.redis, redis)

        fastify.redis.set('key2', 'value2', (err) => {
          t.error(err)
          fastify.redis.get('key2', (err, val) => {
            t.error(err)
            t.equal(val, 'value2')

            fastify.close(function (err) {
              t.error(err)
              fastify.redis.quit(function (err) {
                t.error(err)
              })
            })
          })
        })
      })
    })
  })
})

test('custom redis client that is already connected', (t) => {
  t.plan(10)
  const fastify = Fastify()
  const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

  // use the client now, so that it is connected and ready
  redis.set('key', 'value', (err) => {
    t.error(err)
    redis.get('key', (err, val) => {
      t.error(err)
      t.equal(val, 'value')

      fastify.register(fastifyRedis, {
        client: redis,
        lazyConnect: false
      })

      fastify.ready((err) => {
        t.error(err)
        t.equal(fastify.redis, redis)

        fastify.redis.set('key2', 'value2', (err) => {
          t.error(err)
          fastify.redis.get('key2', (err, val) => {
            t.error(err)
            t.equal(val, 'value2')

            fastify.close(function (err) {
              t.error(err)
              fastify.redis.quit(function (err) {
                t.error(err)
              })
            })
          })
        })
      })
    })
  })
})

test('custom client gets closed', (t) => {
  t.plan(7)
  const fastify = Fastify()
  const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

  fastify.register(fastifyRedis, { client: redis, closeClient: true })

  fastify.ready((err) => {
    t.error(err)
    t.equal(fastify.redis, redis)

    fastify.redis.set('key', 'value', (err) => {
      t.error(err)
      fastify.redis.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        const origQuit = fastify.redis.quit
        fastify.redis.quit = (cb) => {
          t.pass('redis client closed')
          origQuit.call(fastify.redis, cb)
        }

        fastify.close(function (err) {
          t.error(err)
        })
      })
    })
  })
})

test('custom client inside a namespace', (t) => {
  t.plan(7)
  const fastify = Fastify()
  const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

  fastify.register(fastifyRedis, {
    namespace: 'test',
    client: redis
  })

  fastify.ready((err) => {
    t.error(err)
    t.equal(fastify.redis.test, redis)

    fastify.redis.test.set('key', 'value', (err) => {
      t.error(err)
      fastify.redis.test.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        fastify.close(function (err) {
          t.error(err)
          fastify.redis.test.quit(function (err) {
            t.error(err)
          })
        })
      })
    })
  })
})

test('custom client inside a namespace gets closed', (t) => {
  t.plan(7)
  const fastify = Fastify()
  const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

  fastify.register(fastifyRedis, {
    namespace: 'test',
    client: redis,
    closeClient: true
  })

  fastify.ready((err) => {
    t.error(err)
    t.equal(fastify.redis.test, redis)

    fastify.redis.test.set('key', 'value', (err) => {
      t.error(err)
      fastify.redis.test.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        const origQuit = fastify.redis.test.quit
        fastify.redis.test.quit = (cb) => {
          t.pass('redis client closed')
          origQuit.call(fastify.redis.test, cb)
        }

        fastify.close(function (err) {
          t.error(err)
        })
      })
    })
  })
})

test('fastify.redis.test should throw with duplicate connection namespaces', (t) => {
  t.plan(1)

  const namespace = 'test'

  const fastify = Fastify()
  t.teardown(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: '127.0.0.1',
      namespace
    })
    .register(fastifyRedis, {
      host: '127.0.0.1',
      namespace
    })

  fastify.ready((err) => {
    t.equal(err.message, `Redis '${namespace}' instance namespace has already been registered`)
  })
})

test('Should throw when trying to register multiple instances without giving a namespace', (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.teardown(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: '127.0.0.1'
    })
    .register(fastifyRedis, {
      host: '127.0.0.1'
    })

  fastify.ready((err) => {
    t.equal(err.message, 'fastify-redis has already been registered')
  })
})

test('Should not throw within different contexts', (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.teardown(() => fastify.close())

  fastify.register(function (instance, options, next) {
    instance.register(fastifyRedis, {
      host: '127.0.0.1'
    })
    next()
  })

  fastify.register(function (instance, options, next) {
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

  fastify.ready((error) => {
    t.error(error)
  })
})

test('Should throw when trying to connect on an invalid host', (t) => {
  t.plan(1)

  const fastify = Fastify({ pluginTimeout: 20000 })
  t.teardown(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: 'invalid_host'
    })

  fastify.ready((err) => {
    t.ok(err)
  })
})

test('Should not throw when trying to connect on an invalid host but the lazyConnect option has been provided', (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.teardown(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: 'invalid_host',
      lazyConnect: true
    })

  fastify.ready((err) => {
    t.error(err)
  })
})

test('Should throw authentication error when trying to connect on a valid host with a wrong password', (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.teardown(async () => {
    fastify.close()
    await unsetRedisPassword(TEST_PASSWORD)
  })

  setRedisPassword(TEST_PASSWORD)
    .then(_ => {
      fastify.register(fastifyRedis, {
        host: '127.0.0.1',
        password: 'my_wrong_secret_password'
      })

      fastify.ready(err => {
        t.ok(err)
      })
    })
})

test('Should throw authentication error when trying to connect on a valid host without a password', (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.teardown(async () => {
    fastify.close()
    await unsetRedisPassword(TEST_PASSWORD)
  })

  setRedisPassword(TEST_PASSWORD)
    .then(_ => {
      fastify.register(fastifyRedis, {
        host: '127.0.0.1'
      })

      fastify.ready(err => {
        t.ok(err)
      })
    })
})

test('Should successfully create a Redis client when registered with a `url` option and without a `client` option in a namespaced instance', async t => {
  t.plan(2)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  await fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    namespace: 'test'
  })

  await fastify.ready()
  t.ok(fastify.redis)
  t.ok(fastify.redis.test)
})

test('Should be able to register multiple namespaced fastify-redis instances', async t => {
  t.plan(3)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  await fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    namespace: 'one'
  })

  await fastify.register(fastifyRedis, {
    url: 'redis://127.0.0.1',
    namespace: 'two'
  })

  await fastify.ready()
  t.ok(fastify.redis)
  t.ok(fastify.redis.one)
  t.ok(fastify.redis.two)
})

test('Should throw when fastify-redis is initialized with an option that makes Redis throw', (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  // This will throw a `TypeError: this.options.Connector is not a constructor`
  fastify.register(fastifyRedis, {
    Connector: 'should_fail'
  })

  fastify.ready(err => {
    t.ok(err)
  })
})

test('Should throw when fastify-redis is initialized with a namespace and an option that makes Redis throw', (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  // This will throw a `TypeError: this.options.Connector is not a constructor`
  fastify.register(fastifyRedis, {
    Connector: 'should_fail',
    namespace: 'fail'
  })

  fastify.ready(err => {
    t.ok(err)
  })
})
