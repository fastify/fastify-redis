import fastify = require('fastify');
import ioredis = require('ioredis');

import * as http from 'http';
import * as http2 from 'http2';

declare module 'fastify' {
  interface FastifyInstance<HttpServer, HttpRequest, HttpResponse> {
    redis: ioredis.Redis;
  }
}

declare const fastifyRedis: fastify.Plugin<
  http.Server | http2.Http2Server,
  http.IncomingMessage | http2.Http2ServerRequest,
  http.ServerResponse | http2.Http2ServerResponse,
  ioredis.RedisOptions | { client: ioredis.Redis }
>;

export = fastifyRedis;
