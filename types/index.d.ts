import { FastifyPluginCallback } from 'fastify';
import { Cluster, Redis, RedisOptions } from 'ioredis';

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
  
  export type FastifyRedis = FastifyRedisNamespacedInstance & Redis;
  
  export type FastifyRedisPluginOptions = (RedisOptions &
  {
    url?: string;
    namespace?: string;
  }) | {
    client: Redis | Cluster;
    namespace?: string;
    closeClient?: boolean;
  }
  /*
   * @deprecated Use `FastifyRedisPluginOptions` instead
   */
  export type FastifyRedisPlugin = FastifyRedisPluginOptions;
  export const fastifyRedis: FastifyRedisPluginType
  export { fastifyRedis as default }
}

declare function fastifyRedis(...params: Parameters<FastifyRedisPluginType>): ReturnType<FastifyRedisPluginType>
export = fastifyRedis
