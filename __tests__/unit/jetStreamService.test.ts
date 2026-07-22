// SPDX-License-Identifier: Apache-2.0

import { jetStreamConsume, jetStreamPublish, onJetStreamMessage } from '../../src/services/jetStreamService';

const mockConnect = jest.fn();
jest.mock('nats', () => ({
  AckPolicy: { Explicit: 'explicit' },
  StringCodec: () => ({
    encode: (value: string) => Buffer.from(value),
    decode: (value: Uint8Array) => Buffer.from(value).toString(),
  }),
  connect: (...args: unknown[]) => mockConnect(...args),
}));

const mockLog = jest.fn();
const mockDebug = jest.fn();
jest.mock('../../src/index', () => ({
  loggerService: {
    log: (...a: unknown[]) => mockLog(...a),
    debug: (...a: unknown[]) => mockDebug(...a),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../src/config', () => ({
  config: { serverUrl: 'nats://localhost:4222' },
}));

const buildConnection = (): { natsConn: unknown; jsm: Record<string, unknown>; js: Record<string, unknown> } => {
  const js = { publish: jest.fn(), consumers: { get: jest.fn() } };
  const jsm = { streams: { find: jest.fn() }, consumers: { add: jest.fn() } };
  const natsConn = {
    jetstreamManager: jest.fn().mockResolvedValue(jsm),
    jetstream: jest.fn().mockReturnValue(js),
  };
  return { natsConn, jsm, js };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('jetStreamPublish', () => {
  it('publishes an encoded message when the stream is found', async () => {
    const { natsConn, jsm, js } = buildConnection();
    (jsm.streams as { find: jest.Mock }).find.mockResolvedValue({ name: 'stream' });
    mockConnect.mockResolvedValue(natsConn);

    await jetStreamPublish({ hello: 'world' }, 'producer-stream');

    expect(mockConnect).toHaveBeenCalledWith({ servers: 'nats://localhost:4222' });
    expect(js.publish as jest.Mock).toHaveBeenCalledWith('producer-stream', Buffer.from(JSON.stringify({ hello: 'world' })));
  });

  it('logs the reason when the stream cannot be found', async () => {
    const { natsConn, jsm, js } = buildConnection();
    (jsm.streams as { find: jest.Mock }).find.mockRejectedValue('stream missing');
    mockConnect.mockResolvedValue(natsConn);

    await jetStreamPublish({ hello: 'world' }, 'producer-stream');

    expect(mockLog).toHaveBeenCalledWith('stream missing');
    expect(js.publish as jest.Mock).not.toHaveBeenCalled();
  });
});

describe('jetStreamConsume', () => {
  it('adds a durable consumer and returns it', async () => {
    const { natsConn, jsm, js } = buildConnection();
    const consumer = { id: 'consumer' };
    (js.consumers as { get: jest.Mock }).get.mockResolvedValue(consumer);
    mockConnect.mockResolvedValue(natsConn);

    const result = await jetStreamConsume('consumer-stream', 'test-function');

    expect((jsm.consumers as { add: jest.Mock }).add).toHaveBeenCalledWith('consumer-stream', {
      ack_policy: 'explicit',
      durable_name: 'test-function',
    });
    expect((js.consumers as { get: jest.Mock }).get).toHaveBeenCalledWith('consumer-stream', 'test-function');
    expect(result).toBe(consumer);
  });
});

describe('onJetStreamMessage', () => {
  it('acknowledges and returns the decoded message', async () => {
    const message = { seq: 1, subject: 'test', data: { length: 3 }, json: jest.fn().mockReturnValue('request'), ack: jest.fn() };
    const consumer = { next: jest.fn().mockResolvedValue(message) } as never;

    const result = await onJetStreamMessage(consumer);

    expect(message.json).toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalled();
    expect(result).toBe('request');
  });

  it('returns undefined when there is no message', async () => {
    const consumer = { next: jest.fn().mockResolvedValue(undefined) } as never;

    const result = await onJetStreamMessage(consumer);

    expect(result).toBeUndefined();
  });
});
