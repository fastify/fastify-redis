'use strict'

const whyIsNodeRunning = require('why-is-node-running')
const { test, before } = require('node:test')
const proxyquire = require('proxyquire')
const Fastify = require('fastify')
const fastifyRedis = require('..')

before(async () => {
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await fastify.ready()
  await fastify.redis.flushall()
  await fastify.close()
})

test('fastify.redis should exist', async (t) => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  try {
    await fastify.ready()

    t.assert.equal(fastify.redis !== undefined, true, 'fastify.redis exists')
    t.assert.equal(typeof fastify.redis.get, 'function', 'fastify.redis.get is a function')
  } finally {
    await fastify.close()
  }
})

test('fastify.redis should support url', async (t) => {
  t.plan(3)
  const fastify = Fastify()

  const fastifyRedis = proxyquire('..', {
    ioredis: function Redis (path, options) {
      t.assert.equal(path, 'redis://127.0.0.1')
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

  await new Promise((resolve) => {
    fastify.ready((err) => {
      t.assert.ifError(err)
      fastify.close(resolve)
    })
  })
})

test('fastify.redis should be the redis client', async (t) => {
  t.plan(4)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await new Promise((resolve) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.redis.set('key', 'value', (err) => {
        t.assert.ifError(err)
        fastify.redis.get('key', (err, val) => {
          t.assert.ifError(err)
          t.assert.equal(val, 'value')

          fastify.close(resolve)
        })
      })
    })
  })
})

test('fastify.redis.test namespace should exist', async (t) => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1',
    namespace: 'test'
  })

  await new Promise((resolve) => {
    fastify.ready((err) => {
      t.assert.ifError(err)
      t.assert.ok(fastify.redis)
      t.assert.ok(fastify.redis.test)

      fastify.close(resolve)
    })
  })
})

test('fastify.redis.test should be the redis client', async (t) => {
  t.plan(4)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1',
    namespace: 'test'
  })

  await new Promise((resolve) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.redis.test.set('key_namespace', 'value_namespace', (err) => {
        t.assert.ifError(err)
        fastify.redis.test.get('key_namespace', (err, val) => {
          t.assert.ifError(err)
          t.assert.equal(val, 'value_namespace')

          fastify.close(resolve)
        })
      })
    })
  })
})

test('promises support', async (t) => {
  t.plan(2)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  await new Promise((resolve, reject) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.redis
        .set('key', 'value')
        .then(() => {
          return fastify.redis.get('key')
        })
        .then((val) => {
          t.assert.equal(val, 'value')
          fastify.close(resolve)
        })
        .catch((err) => reject(err))
    })
  })
})

test('custom ioredis client that is already connected', async (t) => {
  t.plan(10)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  await new Promise((resolve, reject) => {
    redis.set('key', 'value', (err) => {
      t.assert.ifError(err)
      redis.get('key', (err, val) => {
        t.assert.ifError(err)
        t.assert.equal(val, 'value')

        fastify.register(fastifyRedis, {
          client: redis,
          lazyConnect: false
        })

        fastify.ready((err) => {
          t.assert.ifError(err)
          t.assert.equal(fastify.redis, redis)

          fastify.redis.set('key2', 'value2', (err) => {
            t.assert.ifError(err)
            fastify.redis.get('key2', (err, val) => {
              t.assert.ifError(err)
              t.assert.equal(val, 'value2')

              fastify.close(function (err) {
                t.assert.ifError(err)
                fastify.redis.quit(function (err) {
                  t.assert.ifError(err)
                  resolve()
                })
              })
            })
          })
        })
      })
    })
  })
})

test('custom ioredis client that is already connected with namespace', async (t) => {
  t.plan(10)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  await new Promise((resolve, reject) => {
    redis.set('key', 'value', (err) => {
      t.assert.ifError(err)
      redis.get('key', (err, val) => {
        t.assert.ifError(err)
        t.assert.equal(val, 'value')

        fastify.register(fastifyRedis, {
          client: redis,
          namespace: 'foo'
        })

        fastify.ready((err) => {
          t.assert.ifError(err)
          t.assert.equal(fastify.redis.foo, redis)

          fastify.redis.foo.set('key2', 'value2', (err) => {
            t.assert.ifError(err)
            fastify.redis.foo.get('key2', (err, val) => {
              t.assert.ifError(err)
              t.assert.equal(val, 'value2')

              fastify.close(function (err) {
                t.assert.ifError(err)
                fastify.redis.foo.quit(function (err) {
                  t.assert.ifError(err)
                  resolve()
                })
              })
            })
          })
        })
      })
    })
  })
})

test('If closeClient is enabled, close the client.', async (t) => {
  t.plan(10)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  await new Promise((resolve, reject) => {
    redis.set('key', 'value', (err) => {
      t.assert.ifError(err)
      redis.get('key', (err, val) => {
        t.assert.ifError(err)
        t.assert.equal(val, 'value')

        fastify.register(fastifyRedis, {
          client: redis,
          closeClient: true
        })

        fastify.ready((err) => {
          t.assert.ifError(err)
          t.assert.equal(fastify.redis, redis)

          fastify.redis.set('key2', 'value2', (err) => {
            t.assert.ifError(err)
            fastify.redis.get('key2', (err, val) => {
              t.assert.ifError(err)
              t.assert.equal(val, 'value2')

              const originalQuit = fastify.redis.quit
              fastify.redis.quit = (callback) => {
                t.assert.ok(true, 'redis client closed')
                originalQuit.call(fastify.redis, callback)
              }

              fastify.close(function (err) {
                t.assert.ifError(err)
                resolve()
              })
            })
          })
        })
      })
    })
  })
})

test('If closeClient is enabled, close the client namespace.', async (t) => {
  t.plan(10)
  const fastify = Fastify()
  const Redis = require('ioredis')
  const redis = new Redis({ host: 'localhost', port: 6379 })

  await new Promise((resolve, reject) => {
    redis.set('key', 'value', (err) => {
      t.assert.ifError(err)
      redis.get('key', (err, val) => {
        t.assert.ifError(err)
        t.assert.equal(val, 'value')

        fastify.register(fastifyRedis, {
          client: redis,
          namespace: 'foo',
          closeClient: true
        })

        fastify.ready((err) => {
          t.assert.ifError(err)
          t.assert.equal(fastify.redis.foo, redis)

          fastify.redis.foo.set('key2', 'value2', (err) => {
            t.assert.ifError(err)
            fastify.redis.foo.get('key2', (err, val) => {
              t.assert.ifError(err)
              t.assert.equal(val, 'value2')

              const originalQuit = fastify.redis.foo.quit
              fastify.redis.foo.quit = (callback) => {
                t.assert.ok(true, 'redis client closed')
                originalQuit.call(fastify.redis.foo, callback)
              }

              fastify.close(function (err) {
                t.assert.ifError(err)
                resolve()
              })
            })
          })
        })
      })
    })
  })
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

  try {
    await fastify.ready()
  } catch (err) {
    t.assert.equal(err.message, `Redis '${namespace}' instance namespace has already been registered`)
  }
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

  try {
    await fastify.ready()
  } catch (err) {
    t.assert.equal(err.message, '@fastify/redis has already been registered')
  }
})

test('Should not throw within different contexts', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

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

  try {
    await fastify.ready()
    t.assert.ok(true)
  } catch (error) {
    t.assert.ifError(error)
  }
})

test('Should throw when trying to connect on an invalid host', { skip: true }, async (t) => {
  t.plan(1)

  const fastify = Fastify({ pluginTimeout: 20000 })
  t.after(() => fastify.close())

  fastify
    .register(fastifyRedis, {
      host: 'invalid_host'
    })

  try {
    await fastify.ready()
  } catch (err) {
    t.assert.ok(err)
  }
})

test('Should successfully create a Redis client when registered with a `url` option and without a `client` option in a namespaced instance', async (t) => {
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

  try {
    await fastify.ready()
  } catch (err) {
    t.assert.ok(err)
  }
})

test('Should throw when @fastify/redis is initialized with a namespace and an option that makes Redis throw', async (t) => {
  const fastify = Fastify()
  t.after(() => fastify.close())

  // This will throw a `TypeError: this.options.Connector is not a constructor`
  fastify
    .register(fastifyRedis, {
      namespace: 'test',
      Connector: 'should_fail'
    })

  try {
    await fastify.ready()
  } catch (err) {
    t.assert.ok(err)
  }
})

test('catch .ping() errors', async (t) => {
  const fastify = Fastify()

  const fastifyRedis = proxyquire('..', {
    ioredis: function Redis (path, options) {
      this.ping = () => {
        return Promise.reject(new Redis.ReplyError('ping error'))
      }
      this.quit = () => {}
      this.info = cb => cb(null, 'info')
      this.on = function (name, handler) {
        return this
      }
      this.off = function () { return this }

      return this
    }
  })

  fastify.register(fastifyRedis)

  await new Promise((resolve) => {
    fastify.ready((err) => {
      t.assert.ok(err)
      t.assert.equal(err.message, 'ping error')
      fastify.close(resolve)
    })
  })
})

setInterval(() => {
  whyIsNodeRunning()
}, 5000).unref()
