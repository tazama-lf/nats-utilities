// SPDX-License-Identifier: Apache-2.0

import { natsPublish, tms } from '../../src/app.controller';
import { config } from '../../src/config';

const mockLog = jest.fn();
jest.mock('../../src/index', () => ({
  loggerService: { log: (...a: unknown[]) => mockLog(...a), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../src/config', () => ({
  config: { startupType: 'nats', serverUrl: 'nats://localhost:4222', functionName: 'test' },
}));

const mockJetStreamConsume = jest.fn();
const mockJetStreamPublish = jest.fn();
const mockOnJetStreamMessage = jest.fn();
jest.mock('../../src/services/jetStreamService', () => ({
  jetStreamConsume: (...a: unknown[]) => mockJetStreamConsume(...a),
  jetStreamPublish: (...a: unknown[]) => mockJetStreamPublish(...a),
  onJetStreamMessage: (...a: unknown[]) => mockOnJetStreamMessage(...a),
}));

const mockNatsServiceSubscribe = jest.fn();
const mockNatsServicePublish = jest.fn();
const mockOnMessage = jest.fn();
jest.mock('../../src/services/natsService', () => ({
  natsServiceSubscribe: (...a: unknown[]) => mockNatsServiceSubscribe(...a),
  natsServicePublish: (...a: unknown[]) => mockNatsServicePublish(...a),
  onMessage: (...a: unknown[]) => mockOnMessage(...a),
}));

const mockPost = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: { post: (...a: unknown[]) => mockPost(...a) } }));

const makeCtx = (body: unknown): { request: { body: unknown }; status: number; body: unknown } => ({
  request: { body },
  status: 0,
  body: undefined,
});

beforeEach(() => {
  jest.clearAllMocks();
  (config as { startupType: string }).startupType = 'nats';
});

describe('tms', () => {
  it('handles the nats path and awaits the reply', async () => {
    (config as { startupType: string }).startupType = 'nats';
    mockNatsServiceSubscribe.mockResolvedValue({ natsCon: {}, subscription: 'sub' });
    mockOnMessage.mockResolvedValue('ed-response');
    mockPost.mockResolvedValue({ data: 'tms-data', status: 200 });

    const ctx = makeCtx({ transaction: { a: 1 }, endpoint: 'http://tms', natsConsumer: 'con', functionName: 'fn', awaitReply: true });
    await tms(ctx as never);

    expect(mockNatsServiceSubscribe).toHaveBeenCalledWith('con', 'fn');
    expect(mockPost).toHaveBeenCalledWith('http://tms', { a: 1 });
    expect(ctx.body).toEqual({ tmsResponse: 'tms-data', edResponse: 'ed-response', status: 200 });
  });

  it('handles the nats path without awaiting the reply', async () => {
    (config as { startupType: string }).startupType = 'nats';
    mockNatsServiceSubscribe.mockResolvedValue({ natsCon: {}, subscription: 'sub' });
    mockOnMessage.mockResolvedValue('ed-response');
    mockPost.mockResolvedValue({ data: 'tms-data', status: 202 });

    const ctx = makeCtx({ transaction: {}, endpoint: 'http://tms', natsConsumer: 'con', functionName: 'fn', awaitReply: false });
    await tms(ctx as never);

    expect((ctx.body as { status: number }).status).toBe(202);
    expect(mockLog).toHaveBeenCalledWith('Not waiting for response');
  });

  it('handles the jetstream path and awaits the reply', async () => {
    (config as { startupType: string }).startupType = 'jetstream';
    mockJetStreamConsume.mockResolvedValue('consumer');
    mockOnJetStreamMessage.mockResolvedValue('ed-response');
    mockPost.mockResolvedValue({ data: 'js-data', status: 200 });

    const ctx = makeCtx({ transaction: {}, endpoint: 'http://tms', natsConsumer: 'con', functionName: 'fn', awaitReply: true });
    await tms(ctx as never);

    expect(mockJetStreamConsume).toHaveBeenCalledWith('con', 'fn');
    expect(ctx.body).toEqual({ tmsResponse: 'js-data', edResponse: 'ed-response', status: 200 });
  });

  it('returns a 500 when the handler throws', async () => {
    (config as { startupType: string }).startupType = 'nats';
    const error = new Error('boom');
    mockNatsServiceSubscribe.mockRejectedValue(error);

    const ctx = makeCtx({ transaction: {}, endpoint: 'http://tms', natsConsumer: 'con', functionName: 'fn', awaitReply: true });
    await tms(ctx as never);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toEqual({ error });
  });
});

describe('natsPublish', () => {
  it('handles the nats path and awaits the reply', async () => {
    (config as { startupType: string }).startupType = 'nats';
    mockNatsServiceSubscribe.mockResolvedValue({ natsCon: { id: 'conn' }, subscription: 'sub' });
    mockOnMessage.mockResolvedValue('reply-data');

    const ctx = makeCtx({ destination: 'dest', consumer: 'con', functionName: 'fn', awaitReply: true, message: { m: 1 } });
    await natsPublish(ctx as never);

    expect(mockNatsServiceSubscribe).toHaveBeenCalledWith('con', 'fn');
    expect(mockNatsServicePublish).toHaveBeenCalledWith({ id: 'conn' }, { m: 1 }, 'dest');
    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ message: 'Transaction is valid', data: 'reply-data' });
  });

  it('handles the jetstream path without awaiting the reply', async () => {
    (config as { startupType: string }).startupType = 'jetstream';
    mockJetStreamConsume.mockResolvedValue('consumer');
    mockOnJetStreamMessage.mockResolvedValue('reply-data');
    mockJetStreamPublish.mockResolvedValue(undefined);

    const ctx = makeCtx({ destination: 'dest', consumer: 'con', functionName: 'fn', awaitReply: false, message: { m: 1 } });
    await natsPublish(ctx as never);

    expect(mockJetStreamPublish).toHaveBeenCalledWith({ m: 1 }, 'dest');
    expect(ctx.status).toBe(200);
    expect(mockLog).toHaveBeenCalledWith('Not waiting for response');
  });

  it('returns a 500 when the handler throws', async () => {
    (config as { startupType: string }).startupType = 'nats';
    const error = new Error('boom');
    mockNatsServiceSubscribe.mockRejectedValue(error);

    const ctx = makeCtx({ destination: 'dest', consumer: 'con', functionName: 'fn', awaitReply: true, message: {} });
    await natsPublish(ctx as never);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toEqual({ error });
  });
});
