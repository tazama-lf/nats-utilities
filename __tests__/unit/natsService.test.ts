// SPDX-License-Identifier: Apache-2.0

import { natsServicePublish, natsServiceSubscribe, onMessage } from '../../src/services/natsService';

// Mock nats
const mockSubscribe = jest.fn();
const mockNatsConnect = jest.fn();
jest.mock('nats', () => ({
  connect: (...args: unknown[]) => mockNatsConnect(...args),
}));

// Mock protobuf helpers
const mockCreateMessageBuffer = jest.fn();
const mockDecodeMessageBuffer = jest.fn();
jest.mock('@tazama-lf/frms-coe-lib/lib/helpers/protobuf', () => ({
  createMessageBuffer: (...args: unknown[]) => mockCreateMessageBuffer(...args),
  decodeMessageBuffer: (...args: unknown[]) => mockDecodeMessageBuffer(...args),
}));

// Mock loggerService
jest.mock('../../src/index', () => ({
  loggerService: {
    debug: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock config
jest.mock('../../src/config', () => ({
  config: {
    serverUrl: 'nats://localhost:4222',
    functionName: 'test-function',
    startupType: 'nats',
    nodeEnv: 'test',
    restPort: 3000,
  },
}));

describe('natsServicePublish', () => {
  const mockPublish = jest.fn();
  const mockConnection = { publish: mockPublish } as never;

  it('encodes the message and publishes it', () => {
    const buffer = Buffer.from('encoded');
    mockCreateMessageBuffer.mockReturnValue(buffer);

    const message = { TxTp: 'pacs.002.001.12', TenantId: 'DEFAULT' };
    natsServicePublish(mockConnection, message, 'test-subject');

    expect(mockCreateMessageBuffer).toHaveBeenCalledWith(message);
    expect(mockPublish).toHaveBeenCalledWith('test-subject', buffer);
  });

  it('throws if createMessageBuffer returns undefined', () => {
    mockCreateMessageBuffer.mockReturnValue(undefined);

    expect(() => natsServicePublish(mockConnection, {}, 'test-subject')).toThrow('Failed to encode message for NATS publish');
    expect(mockPublish).not.toHaveBeenCalled();
  });
});

describe('natsServiceSubscribe', () => {
  it('connects to the configured server URL and returns a LocalSubscription', async () => {
    const mockSub = { queue: 'test-function' };
    mockSubscribe.mockReturnValue(mockSub);
    const mockConn = { subscribe: mockSubscribe };
    mockNatsConnect.mockResolvedValue(mockConn);

    const result = await natsServiceSubscribe('consumer-stream', 'test-function');

    expect(mockNatsConnect).toHaveBeenCalledWith({ servers: 'nats://localhost:4222' });
    expect(mockSubscribe).toHaveBeenCalledWith('consumer-stream', { queue: 'test-function' });
    expect(result).toEqual({ natsCon: mockConn, subscription: mockSub });
  });
});

describe('onMessage', () => {
  it('decodes and returns the first message from the subscription', async () => {
    const rawData = Buffer.from('raw');
    const decoded = { TxTp: 'pacs.002.001.12' };
    mockDecodeMessageBuffer.mockReturnValue(decoded);

    const fakeMessage = { sid: 1, subject: 'test', data: rawData };
    const fakeSub = (async function* () {
      yield fakeMessage;
    })() as never;

    const result = await onMessage(fakeSub);

    expect(mockDecodeMessageBuffer).toHaveBeenCalledWith(Buffer.from(rawData));
    expect(result).toBe(decoded);
  });

  it('returns undefined when subscription yields no messages', async () => {
    const fakeSub = (async function* () {
      // yields nothing
    })() as never;

    const result = await onMessage(fakeSub);

    expect(result).toBeUndefined();
    expect(mockDecodeMessageBuffer).not.toHaveBeenCalled();
  });
});
