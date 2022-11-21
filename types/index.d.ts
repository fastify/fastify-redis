import { FastifyPluginCallback } from 'fastify';
import { Cluster, Redis, RedisOptions } from 'ioredis';

type FastifyRedis = FastifyPluginCallback<fastifyRedis.FastifyRedisPluginOptions>

declare module 'fastify' {
  interface FastifyInstance {
    redis: fastifyRedis.FastifyRedisInstance;
  }
}

declare namespace fastifyRedis {

  export interface FastifyRedisNamespacedInstance {
    [namespace: string]: Redis;
  }
  
  export type FastifyRedisInstance = FastifyRedisNamespacedInstance & Redis;
  
  export type FastifyRedisPluginOptions = (RedisOptions &
  {
    url?: string;
    namespace?: string;
  }) | {
    client: Redis | Cluster;
    namespace?: string;
    closeClient?: boolean;
  }


  export const fastifyRedis: FastifyRedis
  export { fastifyRedis as default }
}

declare function fastifyRedis(...params: Parameters<FastifyRedis>): ReturnType<FastifyRedis>
export = fastifyRedis
