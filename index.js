'use strict'

const fp = require('fastify-plugin')
const redis = require('redis')

function fastifyRedis (fastify, options, next) {
  var client = null
  try {
    // if custom redis module, default is redis.
    const Driver = options.driver
    delete options.driver
    client = Driver ? new Driver(options) : redis.createClient(options)
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
