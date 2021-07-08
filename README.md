# fastify-redis

![CI](https://github.com/fastify/fastify-redis/workflows/CI/badge.svg)
[![NPM version](https://img.shields.io/npm/v/fastify-redis.svg?style=flat)](https://www.npmjs.com/package/fastify-redis)
[![Known Vulnerabilities](https://snyk.io/test/github/fastify/fastify-redis/badge.svg)](https://snyk.io/test/github/fastify/fastify-redis)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

Fastify Redis connection plugin; with this you can share the same Redis connection in every part of your server.

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
'use strict'

const fastify = require('fastify')()

fastify.register(require('fastify-redis'), { host: '127.0.0.1' })
// or
fastify.register(require('fastify-redis'), { url: 'redis://127.0.0.1', /* other redis options */ })

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
'use strict'

const fastify = require('fastify')()
const redis = require('redis').createClient({ host: 'localhost', port: 6379 })

fastify.register(require('fastify-redis'), { client: redis })
```

Note: by default, *fastify-redis* will **not** automatically close the client
connection when the Fastify server shuts down. To opt-in to this behavior,
register the client like so:

```js
fastify.register(require('fastify-redis'), {
  client: redis,
  closeClient: true
})
```

## Registering multiple Redis client instances

By using the `namespace` option you can register multiple Redis client instances.

```js
'use strict'

const fastify = require('fastify')()
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

## Redis streams (Redis 5.0 or greater is required)

`fastify-redis` supports Redis streams out of the box.

```js
'use strict'

const fastify = require('fastify')()

fastify.register(require('fastify-redis'), {
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

fastify.listen(3000, function (err) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
```
*NB you can find more information about Redis streams and the relevant commands [here](https://redis.io/topics/streams-intro) and [here](https://redis.io/commands#stream).*

## Redis connection error
Majority of errors are silent due to the `ioredis` silent error handling but during the plugin registration it will check that the connection with the redis instance is correctly estabilished.
In this case you can receive an `ERR_AVVIO_PLUGIN_TIMEOUT` error if the connection can't be estabilished in the expected time frame or a dedicated error for an invalid connection.

## Acknowledgements

This project is kindly sponsored by:
- [nearForm](https://nearform.com)
- [LetzDoIt](https://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
