import * as Fastify from 'fastify';
import { Redis, RedisOptions } from 'ioredis';

import { Server, IncomingMessage, ServerResponse } from 'http';
import { Http2Server, Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from 'http2';

declare module 'fastify' {
  interface FastifyInstance<HttpServer, HttpRequest, HttpResponse> {
    redis: Redis;
  }
}

declare interface FastifyRedisPlugin<HttpServer, HttpRequest, HttpResponse>
  extends Fastify.Plugin<
    HttpServer,
    HttpRequest,
    HttpResponse,
    RedisOptions | { client: Redis }
  > {}


declare const fastifyRedis: FastifyRedisPlugin<
  Server | Http2Server | Http2SecureServer,
  IncomingMessage | Http2ServerRequest,
  ServerResponse | Http2ServerResponse
>;

export = fastifyRedis;
