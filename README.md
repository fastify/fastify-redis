# fastify-redis

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/fastify/fastify-redis.svg?branch=master)](https://travis-ci.org/fastify/fastify-redis)

Fastify Redis connection plugin, with this you can share the same Redis connection in every part of your server.

Under the hood the official [redis](https://github.com/NodeRedis/node_redis) client is used, the options that you pass to `register` will be passed to the Redis client.

## Install
```
npm i fastify-redis --save
```
## Usage
Add it to you project with `register` and you are done!  
You can access the *Redis* client via `fastify.redis`.
```js
const fastify = require('fastify')

fastify.register(require('fastify-redis'), {
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

## Acknowledgements

This project is kindly sponsored by:
- [nearForm](http://nearform.com)
- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
