'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyRedis = require('./index')

t.beforeEach(done => {
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  fastify.ready(err => {
    t.error(err)

    fastify.redis.flushall(() => {
      fastify.close()
      done()
    })
  })
})

test('fastify.redis should exist', t => {
  t.plan(2)
  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  fastify.ready(err => {
    t.error(err)
    t.ok(fastify.redis)

    fastify.close()
  })
})

test('fastify.redis should be the redis client', t => {
  t.plan(4)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  fastify.ready(err => {
    t.error(err)

    fastify.redis.set('key', 'value', err => {
      t.error(err)
      fastify.redis.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        fastify.close()
      })
    })
  })
})

test('promises support', t => {
  t.plan(2)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  })

  fastify.ready(err => {
    t.error(err)

    fastify.redis.set('key', 'value')
      .then(() => {
        return fastify.redis.get('key')
      })
      .then(val => {
        t.equal(val, 'value')
        fastify.close()
      })
      .catch(err => t.fail(err))
  })
})

test('custom client', t => {
  t.plan(5)
  const fastify = Fastify()
  const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

  fastify.register(fastifyRedis, { client: redis })

  fastify.ready(err => {
    t.error(err)
    t.is(fastify.redis, redis)

    fastify.redis.set('key', 'value', err => {
      t.error(err)
      fastify.redis.get('key', (err, val) => {
        t.error(err)
        t.equal(val, 'value')

        fastify.close()
      })
    })
  })
})
