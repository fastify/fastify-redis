import * as Fastify from "fastify";
import * as fastifyRedis from "../..";
import * as ioredis from "ioredis";

const app = Fastify();
const redis = new ioredis({ host: "localhost", port: 6379 });

app.register(fastifyRedis, { host: "127.0.0.1" });
app.register(fastifyRedis, { client: redis });

app.get("/foo", (req, reply) => {
  const { redis } = app;
  redis.get(req.query.key, (err, val) => {
    reply.send(err || val);
  });
});

app.post("/foo", (req, reply) => {
  const { redis } = app;
  redis.set(req.body.key, req.body.value, err => {
    reply.send(err || { status: "ok" });
  });
});
