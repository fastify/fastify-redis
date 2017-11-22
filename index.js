'use strict'

const fp = require('fastify-plugin')
const redis = require('redis')

function fastifyRedis (fastify, options, next) {
  var client = null
  try {
    // if custom redis module, default is redis.
    var Redis = options.driver
    client = Redis ? new Redis(options.redis) : redis.createClient(options.redis)
  } catch (err) {
    return next(err)
  }

  fastify
    .decorate('redis', client)
    .addHook('onClose', close)

  next()
}

function close (fastify, done) {
  fastify.redis.quit(done)
}

module.exports = fp(fastifyRedis, '>=0.13.1')
