import { FastifyPluginCallback } from 'fastify';
import { Cluster, Redis, RedisOptions } from 'ioredis';

type FastifyRedisPlugin = FastifyPluginCallback<fastifyRedis.FastifyRedisPluginOptions>

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


  export const fastifyRedis: FastifyRedisPlugin
  export { fastifyRedis as default }
}

declare function fastifyRedis(...params: Parameters<FastifyRedisPlugin>): ReturnType<FastifyRedisPlugin>
export = fastifyRedis
