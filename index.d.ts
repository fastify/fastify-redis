import { FastifyPluginCallback } from 'fastify';
import { Redis, RedisOptions } from 'ioredis';

export interface FastifyRedisNamespacedInstance {
  [namespace: string]: Redis;
}

export type FastifyRedis = FastifyRedisNamespacedInstance & Redis;

declare module 'fastify' {
  interface FastifyInstance {
    redis: FastifyRedis;
  }
}

export type FastifyRedisPlugin = (RedisOptions &
{
  url?: string;
  namespace?: string;
}) | {
  client: Redis;
  namespace?: string;
  closeClient?: boolean;
}

declare const fastifyRedis: FastifyPluginCallback<FastifyRedisPlugin>;
export default fastifyRedis;
