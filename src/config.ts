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
  functionName: validateEnvVar('FUNCTION_NAME', 'string') as string,
  nodeEnv: validateEnvVar('NODE_ENV', 'string') as string,
  restPort: (validateEnvVar('PORT', 'number', true) as number) || DEFAULT_PORT,
  startupType: validateEnvVar('STARTUP_TYPE', 'string') as 'nats' | 'jetstream',
  serverUrl: validateEnvVar('SERVER_URL', 'string') as string,
};

export { config };
