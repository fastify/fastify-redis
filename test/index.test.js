'use strict'

const whyIsNodeRunning = require('why-is-node-running')
const t = require('tap')
const proxyquire = require('proxyquire')
const test = t.test
const Fastify = require('fastify')
const fastifyRedis = require('..')

const decoratorNames = ['redis', 'dragonfly']

decoratorNames.forEach(decoratorName => {
  const isDragonfly = decoratorName === 'dragonfly'

  t.beforeEach(async () => {
    const fastify = Fastify()

    fastify.register(fastifyRedis, {
      host: '127.0.0.1',
      isDragonfly
    })

    await fastify.ready()
    await fastify[decoratorName].flushall()
    await fastify.close()
  })

  test(`fastify.${decoratorName} should exist`, (t) => {
    t.plan(2)
    const fastify = Fastify()
    fastify.register(fastifyRedis, {
      host: '127.0.0.1',
      isDragonfly
    })

    fastify.ready((err) => {
      t.error(err)
      t.ok(fastify[decoratorName])

      fastify.close()
    })
  })

  test(`fastify.${decoratorName} should support url`, (t) => {
    t.plan(3)
    const fastify = Fastify()

    const fastifyRedis = proxyquire('..', {
      ioredis: function Redis(path, options) {
        t.equal(path, 'redis://127.0.0.1')
        t.same(options, {
          otherOption: 'foo'
        })
        this.quit = () => { }
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
      otherOption: 'foo',
      isDragonfly
    })

    fastify.ready((err) => {
      t.error(err)
      fastify.close()
    })
  })

  test(`fastify.${decoratorName} should be the redis client`, (t) => {
    t.plan(4)
    const fastify = Fastify()

    fastify.register(fastifyRedis, {
      host: '127.0.0.1',
      isDragonfly
    })

    fastify.ready((err) => {
      t.error(err)

      fastify[decoratorName].set('key', 'value', (err) => {
        t.error(err)
        fastify[decoratorName].get('key', (err, val) => {
          t.error(err)
          t.equal(val, 'value')

          fastify.close()
        })
      })
    })
  })

  test(`fastify.${decoratorName}.test namespace should exist`, (t) => {
    t.plan(3)

    const fastify = Fastify()
    fastify.register(fastifyRedis, {
      host: '127.0.0.1',
      namespace: 'test',
      isDragonfly
    })

    fastify.ready((err) => {
      t.error(err)
      t.ok(fastify[decoratorName])
      t.ok(fastify[decoratorName].test)

      fastify.close()
    })
  })

  test(`fastify.${decoratorName}.test should be the redis client`, (t) => {
    t.plan(4)
    const fastify = Fastify()

    fastify.register(fastifyRedis, {
      host: '127.0.0.1',
      namespace: 'test',
      isDragonfly
    })

    fastify.ready((err) => {
      t.error(err)

      fastify[decoratorName].test.set('key_namespace', 'value_namespace', (err) => {
        t.error(err)
        fastify[decoratorName].test.get('key_namespace', (err, val) => {
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
      host: '127.0.0.1',
      isDragonfly
    })

    fastify.ready((err) => {
      t.error(err)

      fastify[decoratorName]
        .set('key', 'value')
        .then(() => {
          return fastify[decoratorName].get('key')
        })
        .then((val) => {
          t.equal(val, 'value')
          fastify.close()
        })
        .catch((err) => t.fail(err))
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
          lazyConnect: false,
          isDragonfly
        })

        fastify.ready((err) => {
          t.error(err)
          t.equal(fastify[decoratorName], redis)

          fastify[decoratorName].set('key2', 'value2', (err) => {
            t.error(err)
            fastify[decoratorName].get('key2', (err, val) => {
              t.error(err)
              t.equal(val, 'value2')

              fastify.close(function (err) {
                t.error(err)
                fastify[decoratorName].quit(function (err) {
                  t.error(err)
                })
              })
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
          namespace: 'foo',
          isDragonfly
        })

        fastify.ready((err) => {
          t.error(err)
          t.equal(fastify[decoratorName].foo, redis)

          fastify[decoratorName].foo.set('key2', 'value2', (err) => {
            t.error(err)
            fastify[decoratorName].foo.get('key2', (err, val) => {
              t.error(err)
              t.equal(val, 'value2')

              fastify.close(function (err) {
                t.error(err)
                fastify[decoratorName].foo.quit(function (err) {
                  t.error(err)
                })
              })
            })
          })
        })
      })
    })
  })

  test('If closeClient is enabled, close the client.', (t) => {
    t.plan(10)
    const fastify = Fastify()
    const Redis = require('ioredis')
    const redis = new Redis({ host: 'localhost', port: 6379 })

    redis.set('key', 'value', (err) => {
      t.error(err)
      redis.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        fastify.register(fastifyRedis, {
          client: redis,
          closeClient: true,
          isDragonfly
        })

        fastify.ready((err) => {
          t.error(err)
          t.equal(fastify[decoratorName], redis)

          fastify[decoratorName].set('key2', 'value2', (err) => {
            t.error(err)
            fastify[decoratorName].get('key2', (err, val) => {
              t.error(err)
              t.equal(val, 'value2')

              const originalQuit = fastify[decoratorName].quit
              fastify[decoratorName].quit = (callback) => {
                t.pass('redis client closed')
                originalQuit.call(fastify[decoratorName], callback)
              }

              fastify.close(function (err) {
                t.error(err)
              })
            })
          })
        })
      })
    })
  })

  test('If closeClient is enabled, close the client namespace.', (t) => {
    t.plan(10)
    const fastify = Fastify()
    const Redis = require('ioredis')
    const redis = new Redis({ host: 'localhost', port: 6379 })

    redis.set('key', 'value', (err) => {
      t.error(err)
      redis.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        fastify.register(fastifyRedis, {
          client: redis,
          namespace: 'foo',
          closeClient: true,
          isDragonfly
        })

        fastify.ready((err) => {
          t.error(err)
          t.equal(fastify[decoratorName].foo, redis)

          fastify[decoratorName].foo.set('key2', 'value2', (err) => {
            t.error(err)
            fastify[decoratorName].foo.get('key2', (err, val) => {
              t.error(err)
              t.equal(val, 'value2')

              const originalQuit = fastify[decoratorName].foo.quit
              fastify[decoratorName].foo.quit = (callback) => {
                t.pass('redis client closed')
                originalQuit.call(fastify[decoratorName].foo, callback)
              }

              fastify.close(function (err) {
                t.error(err)
              })
            })
          })
        })
      })
    })
  })

  test(`fastify.${decoratorName}.test should throw with duplicate connection namespaces`, (t) => {
    t.plan(1)

    const namespace = 'test'

    const fastify = Fastify()
    t.teardown(() => fastify.close())

    fastify
      .register(fastifyRedis, {
        host: '127.0.0.1',
        namespace,
        isDragonfly
      })
      .register(fastifyRedis, {
        host: '127.0.0.1',
        namespace,
        isDragonfly
      })

    fastify.ready((err) => {
      t.equal(err.message, `${decoratorName} '${namespace}' instance namespace has already been registered`)
    })
  })

  test('Should throw when trying to register multiple instances without giving a namespace', (t) => {
    t.plan(1)

    const fastify = Fastify()
    t.teardown(() => fastify.close())

    fastify
      .register(fastifyRedis, {
        host: '127.0.0.1',
        isDragonfly
      })
      .register(fastifyRedis, {
        host: '127.0.0.1',
        isDragonfly
      })

    fastify.ready((err) => {
      t.equal(err.message, '@fastify/redis has already been registered')
    })
  })

  test('Should not throw within different contexts', (t) => {
    t.plan(1)

    const fastify = Fastify()
    t.teardown(() => fastify.close())

    fastify.register(function (instance, options, next) {
      instance.register(fastifyRedis, {
        host: '127.0.0.1',
        isDragonfly
      })
      next()
    })

    fastify.register(function (instance, options, next) {
      instance
        .register(fastifyRedis, {
          host: '127.0.0.1',
          namespace: 'test1',
          isDragonfly
        })
        .register(fastifyRedis, {
          host: '127.0.0.1',
          namespace: 'test2',
          isDragonfly
        })
      next()
    })

    fastify.ready((error) => {
      t.error(error)
    })
  })

  // Skipped because it makes TAP crash
  test('Should throw when trying to connect on an invalid host', { skip: true }, (t) => {
    t.plan(1)

    const fastify = Fastify({ pluginTimeout: 20000 })
    t.teardown(() => fastify.close())

    fastify
      .register(fastifyRedis, {
        host: 'invalid_host',
        isDragonfly
      })

    fastify.ready((err) => {
      t.ok(err)
    })
  })

  test('Should successfully create a Redis client when registered with a `url` option and without a `client` option in a namespaced instance', async t => {
    t.plan(2)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    await fastify.register(fastifyRedis, {
      url: 'redis://127.0.0.1',
      namespace: 'test',
      isDragonfly
    })

    await fastify.ready()
    t.ok(fastify[decoratorName])
    t.ok(fastify[decoratorName].test)
  })

  test('Should be able to register multiple namespaced @fastify/redis instances', async t => {
    t.plan(3)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    await fastify.register(fastifyRedis, {
      url: 'redis://127.0.0.1',
      namespace: 'one',
      isDragonfly
    })

    await fastify.register(fastifyRedis, {
      url: 'redis://127.0.0.1',
      namespace: 'two',
      isDragonfly
    })

    await fastify.ready()
    t.ok(fastify[decoratorName])
    t.ok(fastify[decoratorName].one)
    t.ok(fastify[decoratorName].two)
  })

  test('Should throw when @fastify/redis is initialized with an option that makes Redis throw', (t) => {
    t.plan(1)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    // This will throw a `TypeError: this.options.Connector is not a constructor`
    fastify.register(fastifyRedis, {
      Connector: 'should_fail',
      isDragonfly
    })

    fastify.ready(err => {
      t.ok(err)
    })
  })

  test('Should throw when @fastify/redis is initialized with a namespace and an option that makes Redis throw', (t) => {
    t.plan(1)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    // This will throw a `TypeError: this.options.Connector is not a constructor`
    fastify.register(fastifyRedis, {
      Connector: 'should_fail',
      namespace: 'fail',
      isDragonfly
    })

    fastify.ready(err => {
      t.ok(err)
    })
  })
})

setInterval(() => {
  whyIsNodeRunning()
}, 5000).unref()
