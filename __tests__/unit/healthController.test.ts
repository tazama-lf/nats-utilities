// SPDX-License-Identifier: Apache-2.0

import { healthCheck } from '../../src/health.controller';

jest.mock('../../src/index', () => ({
  loggerService: {
    debug: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('healthCheck', () => {
  it('sets a 200 UP response and calls next', async () => {
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx = { status: 0, body: undefined } as never as { status: number; body: unknown };

    const result = await healthCheck(ctx as never, next);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ status: 'UP' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(result).toBe(ctx);
  });
});
