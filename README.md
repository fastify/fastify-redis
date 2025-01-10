# @fastify/redis

[![CI](https://github.com/fastify/fastify-redis/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/fastify/fastify-redis/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/redis.svg?style=flat)](https://www.npmjs.com/package/@fastify/redis)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

Fastify Redis connection plugin; with this you can share the same Redis connection in every part of your server.

## Install

```
npm i @fastify/redis
```

### Compatibility
| Plugin version | Fastify version |
| ---------------|-----------------|
| `^7.x`         | `^5.x`          |
| `^6.x`         | `^4.x`          |
| `^4.x`         | `^3.x`          |
| `^3.x`         | `^2.x`          |
| `^1.x`         | `^1.x`          |


Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.

## Usage

Add it to your project with `register` and you are done!

### Create a new Redis Client

Under the hood [ioredis](https://github.com/luin/ioredis) is used as client, the ``options`` that you pass to `register` will be passed to the Redis client.

```js
const fastify = require('fastify')()

// create by specifying host
fastify.register(require('@fastify/redis'), { host: '127.0.0.1' })

// OR by specifying Redis URL
fastify.register(require('@fastify/redis'), { url: 'redis://127.0.0.1', /* other redis options */ })

// OR with more options
fastify.register(require('@fastify/redis'), {
  host: '127.0.0.1',
  password: '***',
  port: 6379, // Redis port
  family: 4   // 4 (IPv4) or 6 (IPv6)
})
```

### Accessing the Redis Client

Once you have registered your plugin, you can access the Redis client via `fastify.redis`.

The client is automatically closed when the fastify instance is closed.

```js
'use strict'

const Fastify = require('fastify')
const fastifyRedis = require('@fastify/redis')

const fastify = Fastify({ logger: true })

fastify.register(fastifyRedis, {
  host: '127.0.0.1',
  password: 'your strong password here',
  port: 6379, // Redis port
  family: 4   // 4 (IPv4) or 6 (IPv6)
})

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

fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```

### Using an existing Redis client

You may also supply an existing *Redis* client instance by passing an options
object with the `client` property set to the instance. In this case,
the client is not automatically closed when the Fastify instance is
closed.

```js
'use strict'

const fastify = require('fastify')()
const Redis = require('ioredis')

const client = new Redis({ host: 'localhost', port: 6379 })

fastify.register(require('@fastify/redis'), { client })
```

Note: by default, *@fastify/redis* will **not** automatically close the client
connection when the Fastify server shuts down.

To automatically close the client connection, set clientClose to true.

```js
fastify.register(require('@fastify/redis'), { client, closeClient: true })
```

## Registering multiple Redis client instances

By using the `namespace` option you can register multiple Redis client instances.

```js
'use strict'

const fastify = require('fastify')()

fastify
  .register(require('@fastify/redis'), {
    host: '127.0.0.1',
    port: 6380,
    namespace: 'hello'
  })
  .register(require('@fastify/redis'), {
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

fastify.listen({ port: 3000 }, function (err) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

```

## Redis streams (Redis 5.0 or greater is required)

`@fastify/redis` supports Redis streams out of the box.

```js
'use strict'

const fastify = require('fastify')()

fastify.register(require('@fastify/redis'), {
  host: '127.0.0.1',
  port: 6380
})

fastify.get('/streams', async (request, reply) => {
  // We write an event to the stream 'my awesome fastify stream name', setting 'key' to 'value'
  await fastify.redis.xadd(['my awesome fastify stream name', '*', 'hello', 'fastify is awesome'])

  // We read events from the beginning of the stream called 'my awesome fastify stream name'
  let redisStream = await fastify.redis.xread(['STREAMS', 'my awesome fastify stream name', 0])

  // We parse the results
  let response = []
  let events = redisStream[0][1]

  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    response.push(`#LOG: id is ${e[0].toString()}`)

    // We log each key
    for (const key in e[1]) {
      response.push(e[1][key].toString())
    }
  }

  reply.status(200)
  return { output: response }
  // Will return something like this :
  // { "output": ["#LOG: id is 1559985742035-0", "hello", "fastify is awesome"] }
})

fastify.listen({ port: 3000 }, function (err) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
```
*NB you can find more information about Redis streams and the relevant commands [here](https://redis.io/topics/streams-intro) and [here](https://redis.io/commands#stream).*

## Redis connection error
The majority of errors are silent due to the `ioredis` silent error handling but during the plugin registration it will check that the connection with the redis instance is correctly estabilished.
In this case, you can receive an `ERR_AVVIO_PLUGIN_TIMEOUT` error if the connection cannot be established in the expected time frame or a dedicated error for an invalid connection.

## Acknowledgments

This project is kindly sponsored by:
- [nearForm](https://nearform.com)
- [LetzDoIt](https://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
