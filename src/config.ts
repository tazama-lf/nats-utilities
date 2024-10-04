// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'path';
import { config as dotenv } from 'dotenv';
import { type IConfig } from './interfaces';
import { validateEnvVar } from '@tazama-lf/frms-coe-lib/lib/helpers/env';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv({
  path: path.resolve(__dirname, '../.env'),
});

const config: IConfig = {
  functionName: validateEnvVar<string>('FUNCTION_NAME', 'string'),
  nodeEnv: validateEnvVar<string>('NODE_ENV', 'string'),
  restPort: validateEnvVar<number>('PORT', 'number', true) || 3000,
  startupType: validateEnvVar<'nats' | 'jetstream'>('STARTUP_TYPE', 'string'),
  serverUrl: validateEnvVar<string>('SERVER_URL', 'string'),
};

export { config };
