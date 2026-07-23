// SPDX-License-Identifier: Apache-2.0

const mockValidateEnvVar = jest.fn();

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

jest.mock('@tazama-lf/frms-coe-lib/lib/config', () => ({
  validateEnvVar: (...args: unknown[]) => mockValidateEnvVar(...args),
}));

describe('config', () => {
  beforeEach(() => {
    jest.resetModules();
    mockValidateEnvVar.mockReset();
  });

  const buildMock = (port: unknown): void => {
    mockValidateEnvVar.mockImplementation((name: string) => {
      switch (name) {
        case 'FUNCTION_NAME':
          return 'nats-utilities';
        case 'NODE_ENV':
          return 'test';
        case 'PORT':
          return port;
        case 'STARTUP_TYPE':
          return 'nats';
        case 'SERVER_URL':
          return '0.0.0.0:4222';
        default:
          return undefined;
      }
    });
  };

  it('maps validated environment variables onto the config object', () => {
    buildMock(4100);
    const { config } = require('../../src/config') as typeof import('../../src/config');

    expect(config).toEqual({
      functionName: 'nats-utilities',
      nodeEnv: 'test',
      restPort: 4100,
      startupType: 'nats',
      serverUrl: '0.0.0.0:4222',
    });
  });

  it('falls back to the default port when PORT is not provided', () => {
    buildMock(0);
    const { config } = require('../../src/config') as typeof import('../../src/config');

    expect(config.restPort).toBe(3000);
  });
});
