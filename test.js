'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyRedis = require('./index')

t.beforeEach(done => {
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  }, (err) => {
    t.error(err)
  })

  fastify.ready(err => {
    t.error(err)

    fastify.redis.flushdb(() => {
      fastify.close()
      done()
    })
  })
})

test('fastify.redis should exist', t => {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  }, (err) => {
    t.error(err)
  })

  fastify.ready(err => {
    t.error(err)
    t.ok(fastify.redis)

    fastify.close()
  })
})

test('fastify.redis should be the redis client', t => {
  t.plan(5)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    host: '127.0.0.1'
  }, (err) => {
    t.error(err)
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

test('fastify.redis should exist when use the custom redis driver', t => {
  t.plan(3)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    driver: require('ioredis'),
    host: '127.0.0.1'
  }, (err) => {
    t.error(err)
  })

  fastify.ready(err => {
    t.error(err)
    t.ok(fastify.redis)

    fastify.close()
  })
})

test('fastify.redis should be the redis client when use the custom redis driver', t => {
  t.plan(5)
  const fastify = Fastify()

  fastify.register(fastifyRedis, {
    driver: require('ioredis'),
    host: '127.0.0.1'
  }, (err) => {
    t.error(err)
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
