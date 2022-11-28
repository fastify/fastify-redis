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

    const closeNamedInstance = (fastify) => {
      return fastify.redis[namespace].quit()
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
    }
  }

  // Testing this make the process crash on latest TAP :(
  /* istanbul ignore next */
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

  // Testing this make the process crash on latest TAP :(
  /* istanbul ignore next */
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

    client.ping()
  }
}

function close (fastify) {
  return fastify.redis.quit()
}

module.exports = fp(fastifyRedis, {
  fastify: '4.x',
  name: '@fastify/redis'
})
module.exports.default = fastifyRedis
module.exports.fastifyRedis = fastifyRedis
