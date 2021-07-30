import { FastifyPluginCallback } from 'fastify';
import { Redis, RedisOptions } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis & Record<string, Redis>;
  }
}

export type FastifyRedisPlugin =
  | (RedisOptions & {
      url?: string;
      namespace?: string;
    })
  | {
      client: Redis;
      namespace?: string;
      closeClient?: boolean;
    };

declare const fastifyRedis: FastifyPluginCallback<FastifyRedisPlugin>;

export default fastifyRedis;
