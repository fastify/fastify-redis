# fastify-redis

[![Greenkeeper badge](https://badges.greenkeeper.io/fastify/fastify-redis.svg)](https://greenkeeper.io/)

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/fastify/fastify-redis.svg?branch=master)](https://travis-ci.org/fastify/fastify-redis)

Fastify Redis connection plugin, with this you can share the same Redis connection in every part of your server.

Under the hood the official [redis](https://github.com/NodeRedis/node_redis) client is used, the ``options`` that you pass to `register` will be passed to the Redis client.

## Install
```
npm i fastify-redis --save
```
## Usage
Add it to your project with `register` and you are done!
You can access the *Redis* client via `fastify.redis`.

If needed, you can pass a custom ``driver`` option, such as [ioredis](https://github.com/luin/ioredis). By default the official [redis](https://github.com/NodeRedis/node_redis) client is used.


```js
const fastify = require('fastify')

fastify.register(require('fastify-redis'), {
  driver: require('ioredis'),
  host: '127.0.0.1'
}, err => {
  if (err) throw err
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

fastify.listen(3000, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```

You may also supply an existing *Redis* client instance by passing an options
object with the `client` property set to the instance.

```js
const fastify = Fastify()
const redis = require('redis').createClient({host: 'localhost', port: 6379})

fastify.register(fastifyRedis, {client: redis})

// ...
// ...
// ...
```

## Acknowledgements

This project is kindly sponsored by:
- [nearForm](http://nearform.com)
- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
