import Fastify, { FastifyRequest } from 'fastify';
import fastifyRedis from '../..';
import * as IORedis from 'ioredis';

const app = Fastify();
const redis = new IORedis({ host: 'localhost', port: 6379 });

app.register(fastifyRedis, { host: '127.0.0.1' });
app.register(fastifyRedis, { client: redis });
app.register(fastifyRedis, { url: 'redis://127.0.0.1:6379', keepAlive: 0 });

app.get('/foo', (req: FastifyRequest, reply) => {
  const { redis } = app;
  const query = req.query as {
    key: string
  }
  redis.get(query.key, (err, val) => {
    reply.send(err || val);
  });
});

app.post('/foo', (req, reply) => {
  const { redis } = app;
  const body = req.body as {
    key: string,
    value: string
  }
  redis.set(body.key, body.value, err => {
    reply.send(err || { status: 'ok' });
  });
});
