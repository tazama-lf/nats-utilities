// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Server } from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import router from './router';
import { loggerService } from '.';

class App extends Koa {
  public servers: Server[];

  constructor() {
    super();
    // bodyparser needs to be loaded first in order to work - in fact, order for all the below is very import!
    this.servers = [];
    this.use(bodyParser());
    this.configureMiddlewares();
    this.configureRoutes();
  }

  configureMiddlewares(): void {
    this.use(async (ctx, next) => {
      await next();
      const rt = ctx.response.get('X-Response-Time');
      if (ctx.path !== '/health') {
        loggerService.log(`${ctx.method} ${ctx.url} - ${rt}`);
      }
    });

    // x - response - time
    this.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      ctx.set('x-response-time', `${ms}ms`);
    });
  }

  configureRoutes(): void {
    // Bootstrap application router
    this.use(router.routes());
    this.use(router.allowedMethods());
  }

  listen(...args: any[]): Server {
    const server = super.listen(...args);
    this.servers.push(server);
    return server;
  }

  terminate(): void {
    for (const server of this.servers) {
      server.close();
    }
  }
}

export default App;
