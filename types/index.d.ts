import { FastifyPluginCallback } from 'fastify'
import { Cluster, Redis, RedisOptions } from 'ioredis'

type FastifyRedisPluginType = FastifyPluginCallback<fastifyRedis.FastifyRedisPluginOptions>

declare module 'fastify' {
  interface FastifyInstance {
    redis: fastifyRedis.FastifyRedis;
  }
}

declare namespace fastifyRedis {

  export interface FastifyRedisNamespacedInstance {
    [namespace: string]: Redis;
  }

  export type FastifyRedis = FastifyRedisNamespacedInstance & Redis

  export type FastifyRedisPluginOptions = (RedisOptions &
  {
    url?: string;
    namespace?: string;
    /**
     * Tag to append to the library name in CLIENT SETINFO (e.g., "ioredis(fastify-redis_v7.1.0)").
     * This helps identify the framework using the Redis client library.
     * @link https://redis.io/docs/latest/commands/client-setinfo/
     * @default "fastify-redis_v{version}" (e.g., "fastify-redis_v7.1.0")
     */
    clientInfoTag?: string;
  }) | {
    client: Redis | Cluster;
    namespace?: string;
    /**
     * @default false
     */
    closeClient?: boolean;
  }
  /*
   * @deprecated Use `FastifyRedisPluginOptions` instead
   */
  export type FastifyRedisPlugin = FastifyRedisPluginOptions
  export const fastifyRedis: FastifyRedisPluginType
  export { fastifyRedis as default }
}

declare function fastifyRedis (...params: Parameters<FastifyRedisPluginType>): ReturnType<FastifyRedisPluginType>
export = fastifyRedis
