import * as Fastify from 'fastify';
import * as fastifyRedis from '../..';
import * as IORedis from 'ioredis';

import * as http from 'http';
import * as http2 from 'http2';

const app: Fastify.FastifyInstance<
    http.Server | http2.Http2Server | http2.Http2SecureServer,
    http.IncomingMessage | http2.Http2ServerRequest,
    http.ServerResponse | http2.Http2ServerResponse
    > = Fastify();
const redis = new IORedis({ host: 'localhost', port: 6379 });

app.register(fastifyRedis, { host: '127.0.0.1' });
app.register(fastifyRedis, { client: redis });

app.get('/foo', (req, reply) => {
  const { redis } = app;
  redis.get(req.query.key, (err, val) => {
    reply.send(err || val);
  });
});

app.post('/foo', (req, reply) => {
  const { redis } = app;
  redis.set(req.body.key, req.body.value, err => {
    reply.send(err || { status: 'ok' });
  });
});
