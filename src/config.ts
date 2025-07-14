// SPDX-License-Identifier: Apache-2.0

import path from 'node:path';
import { config as dotenv } from 'dotenv';
import type { IConfig } from './interfaces';
import { validateEnvVar } from '@tazama-lf/frms-coe-lib/lib/config';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv({
  path: path.resolve(__dirname, '../.env'),
});

const DEFAULT_PORT = 3000;

const config: IConfig = {
  functionName: validateEnvVar<string>('FUNCTION_NAME', 'string'),
  nodeEnv: validateEnvVar<string>('NODE_ENV', 'string'),
  restPort: validateEnvVar<number>('PORT', 'number', true) || DEFAULT_PORT,
  startupType: validateEnvVar<'nats' | 'jetstream'>('STARTUP_TYPE', 'string'),
  serverUrl: validateEnvVar<string>('SERVER_URL', 'string'),
};

export { config };
