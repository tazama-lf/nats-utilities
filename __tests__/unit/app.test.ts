// SPDX-License-Identifier: Apache-2.0

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import App from '../../src/app';

const mockLog = jest.fn();
jest.mock('../../src/index', () => ({
  loggerService: { log: (...a: unknown[]) => mockLog(...a), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../src/router', () => ({
  __esModule: true,
  default: {
    routes: () => async (ctx: { status: number }, next: () => Promise<void>) => {
      ctx.status = 200;
      await next();
    },
    allowedMethods: () => async (_ctx: unknown, next: () => Promise<void>) => {
      await next();
    },
  },
}));

const get = (port: number, path: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path }, (res) => {
      res.on('data', () => undefined);
      res.on('end', () => {
        resolve();
      });
    });
    req.on('error', reject);
  });

describe('App', () => {
  let app: App;

  afterEach(() => {
    app.terminate();
  });

  it('constructs with an empty server list', () => {
    app = new App();
    expect(app.servers).toEqual([]);
  });

  it('listens, logs non-health requests and skips health requests', async () => {
    app = new App();
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => {
      if (server.listening) resolve();
      else server.once('listening', () => resolve());
    });
    const port = (server.address() as AddressInfo).port;

    expect(app.servers).toHaveLength(1);

    await get(port, '/resource');
    await get(port, '/health');

    const logged = mockLog.mock.calls.map((c) => String(c[0]));
    expect(logged.some((line) => line.includes('/resource'))).toBe(true);
    expect(logged.some((line) => line.includes('GET /health'))).toBe(false);
  });

  it('terminate closes all tracked servers', () => {
    app = new App();
    const server = app.listen(0, '127.0.0.1');
    const closeSpy = jest.spyOn(server, 'close');

    app.terminate();

    expect(closeSpy).toHaveBeenCalled();
  });
});
