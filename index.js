'use strict'

const fp = require('fastify-plugin')
const Redis = require('ioredis')

function fastifyRedis (fastify, options, next) {
  const { namespace, url, ...redisOptions } = options

  let client = options.client || null

  if (namespace) {
    if (!fastify.redis) {
      fastify.decorate('redis', Object.create(null))
    }

    if (fastify.redis[namespace]) {
      return next(new Error(`Redis '${namespace}' instance namespace has already been registered`))
    }

    const closeNamedInstance = (fastify, done) => {
      const p = fastify.redis[namespace].quit(done)
      if (p && typeof p.then === 'function') {
        p.then(done, done)
      }
    }

    if (!client) {
      try {
        if (url) {
          client = new Redis(url, redisOptions)
        } else {
          client = new Redis(redisOptions)
        }
      } catch (err) {
        return next(err)
      }

      fastify.addHook('onClose', closeNamedInstance)
    }

    fastify.redis[namespace] = client
    if (options.closeClient === true) {
      fastify.addHook('onClose', closeNamedInstance)
    }
  } else {
    if (fastify.redis) {
      return next(new Error('@fastify/redis has already been registered'))
    } else {
      if (!client) {
        try {
          if (url) {
            client = new Redis(url, redisOptions)
          } else {
            client = new Redis(redisOptions)
          }
        } catch (err) {
          return next(err)
        }

        fastify.addHook('onClose', close)
      }

      fastify.decorate('redis', client)
      if (options.closeClient === true) {
        fastify.addHook('onClose', close)
      }
    }
  }

  if (redisOptions.lazyConnect) {
    const onEnd = function (err) {
      client
        .off('ready', onReady)
        .off('error', onError)
        .off('end', onEnd)
        .quit()

      next(err)
    }

    const onReady = function () {
      client
        .off('end', onEnd)
        .off('error', onError)
        .off('ready', onReady)

      next()
    }

    const onError = function (err) {
      if (err.code === 'ENOTFOUND') {
        onEnd(err)
        return
      }

      // Swallow network errors to allow ioredis
      // to perform reconnection and emit 'end'
      // event if reconnection eventually
      // fails.
      // Any other errors during startup will
      // trigger the 'end' event.
      if (err instanceof Redis.ReplyError) {
        onEnd(err)
      }
    }

    // ioredis provides it in a .status property
    if (client.status === 'ready') {
      // client is already connected, do not register event handlers
      // call next() directly to avoid ERR_AVVIO_PLUGIN_TIMEOUT
      next()
    } else {
      // ready event can still be emitted
      client
        .on('end', onEnd)
        .on('error', onError)
        .on('ready', onReady)
    }

    client.ping()
  } else {
    next()
  }
}

function close (fastify, done) {
  const p = fastify.redis.quit(done)
  if (p && typeof p.then === 'function') {
    p.then(done, done)
  }
}

module.exports = fp(fastifyRedis, {
  fastify: '4.x',
  name: '@fastify/redis'
})
