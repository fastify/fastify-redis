'use strict'

const fp = require('fastify-plugin')
const Redis = require('ioredis')

function fastifyRedis (fastify, options, next) {
  const namespace = options.namespace
  delete options.namespace
  let redisUrl
  if (options.url) {
    redisUrl = options.url
    delete options.url
  }

  let client = options.client || null

  if (namespace) {
    if (!fastify.redis) {
      fastify.decorate('redis', {})
    }

    if (fastify.redis[namespace]) {
      return next(new Error(`Redis '${namespace}' instance namespace has already been registered`))
    }

    const closeNamedInstance = (fastify, done) => {
      fastify.redis[namespace].quit(done)
    }

    if (!client) {
      try {
        if (redisUrl) {
          client = new Redis(redisUrl, options)
        } else {
          client = new Redis(options)
        }
      } catch (err) {
        return next(err)
      }

      fastify.addHook('onClose', closeNamedInstance)
    }

    fastify.redis[namespace] = client
  } else {
    if (fastify.redis) {
      return next(new Error('fastify-redis has already been registered'))
    } else {
      if (!client) {
        try {
          if (redisUrl) {
            client = new Redis(redisUrl, options)
          } else {
            client = new Redis(options)
          }
        } catch (err) {
          return next(err)
        }

        fastify.addHook('onClose', close)
      }

      fastify.decorate('redis', client)
    }
  }

  next()
}

function close (fastify, done) {
  fastify.redis.quit(done)
}

module.exports = fp(fastifyRedis, {
  fastify: '>=1.x',
  name: 'fastify-redis'
})
