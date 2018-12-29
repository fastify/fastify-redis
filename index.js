'use strict'

const fp = require('fastify-plugin')
const Redis = require('ioredis')

function fastifyRedis (fastify, options, next) {
  var client = options.client || null

  if (!client) {
    try {
      client = new Redis(options)
    } catch (err) {
      return next(err)
    }
    fastify.addHook('onClose', close)
  }

  fastify.decorate('redis', client)

  next()
}

function close (fastify, done) {
  fastify.redis.quit(done)
}

module.exports = fp(fastifyRedis, {
  fastify: '>=1.x',
  name: 'fastify-redis'
})
