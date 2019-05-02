# fastify-redis

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/fastify/fastify-redis.svg?branch=master)](https://travis-ci.org/fastify/fastify-redis) [![Greenkeeper badge](https://badges.greenkeeper.io/fastify/fastify-redis.svg)](https://greenkeeper.io/)

Fastify Redis connection plugin, with this you can share the same Redis connection in every part of your server.

Under the hood [ioredis](https://github.com/luin/ioredis) is used as client, the ``options`` that you pass to `register` will be passed to the Redis client.

## Install
```
npm i fastify-redis --save
```
## Usage
Add it to your project with `register` and you are done!
You can access the *Redis* client via `fastify.redis`. The client is
automatically closed when the fastify instance is closed.

```js
const fastify = require('fastify')

fastify.register(require('fastify-redis'), { host: '127.0.0.1' })

fastify.get('/foo', (req, reply) => {
  const { redis } = fastify
  redis.get(req.query.key, (err, val) => {
    reply.send(err || val)
  })
})

fastify.post('/foo', (req, reply) => {
  const { redis } = fastify
  redis.set(req.body.key, req.body.value, (err) => {
    reply.send(err || { status: 'ok' })
  })
})

fastify.listen(3000, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```

You may also supply an existing *Redis* client instance by passing an options
object with the `client` property set to the instance. In this case,
the client is not automatically closed when the Fastify instance is
closed.

```js
const fastify = Fastify()
const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

fastify.register(fastifyRedis, { client: redis })

// ...
// ...
// ...
```

## Registering multiple Redis client instances

By using the `namespace` option you can register multiple Redis client instances.

```js
const fastify = require('fastify')
const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

fastify
  .register(require('fastify-redis'), {
    host: '127.0.0.1',
    port: 6380,
    namespace: 'hello'
  })
  .register(require('fastify-redis'), {
    client: redis,
    namespace: 'world'
  })

// Here we will use the `hello` named instance
fastify.get('/hello', (req, reply) => {
  const { redis } = fastify

  redis.hello.get(req.query.key, (err, val) => {
    reply.send(err || val)
  })
})

fastify.post('/hello', (req, reply) => {
  const { redis } = fastify

  redis['hello'].set(req.body.key, req.body.value, (err) => {
    reply.send(err || { status: 'ok' })
  })
})

// Here we will use the `world` named instance
fastify.get('/world', (req, reply) => {
  const { redis } = fastify

  redis['world'].get(req.query.key, (err, val) => {
    reply.send(err || val)
  })
})

fastify.post('/world', (req, reply) => {
  const { redis } = fastify

  redis.world.set(req.body.key, req.body.value, (err) => {
    reply.send(err || { status: 'ok' })
  })
})

fastify.listen(3000, function (err) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

```

## Acknowledgements

This project is kindly sponsored by:
- [nearForm](http://nearform.com)
- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
