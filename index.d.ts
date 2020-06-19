import Fastify, { FastifyPlugin } from 'fastify';
import { Redis, RedisOptions } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export type FastifyRedisPlugin = RedisOptions | { client: Redis } | { url: string }

declare const fastifyRedis: FastifyPlugin<FastifyRedisPlugin>;

export default fastifyRedis;
