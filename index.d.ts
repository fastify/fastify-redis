import { FastifyPluginCallback } from 'fastify';
import { Redis, RedisOptions } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export type FastifyRedisPlugin = RedisOptions & { url?: string } | { client: Redis }

declare const fastifyRedis: FastifyPluginCallback<FastifyRedisPlugin>;

export default fastifyRedis;
