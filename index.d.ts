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

export type FastifyRedisPluginOptions = (RedisOptions &
{
  url?: string;
  namespace?: string;
}) | {
  client: Redis;
  namespace?: string;
  closeClient?: boolean;
}

/**
 * @deprecated Use `FastifyRedisPluginOptions` instead
 */
export type FastifyRedisPlugin = FastifyRedisPluginOptions;

declare const fastifyRedis: FastifyPluginCallback<FastifyRedisPluginOptions>;
export default fastifyRedis;
