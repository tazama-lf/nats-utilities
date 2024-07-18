// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'path';
import { config as dotenv } from 'dotenv';
import { type IConfig } from './interfaces';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv({
  path: path.resolve(__dirname, '../.env'),
});

const config: IConfig = {
  functionName: process.env.FUNCTION_NAME!,
  nodeEnv: process.env.NODE_ENV!,
  restPort: parseInt(process.env.REST_PORT!, 10) || 3000,
  apmLogging: process.env.APM_LOGGING === 'true',
  apmSecretToken: process.env.APM_SECRET_TOKEN!,
  apmURL: process.env.APM_URL!,
  startupType: process.env.STARTUP_TYPE as 'nats' | 'jetstream',
  serverUrl: process.env.SERVER_URL!,
};

export { config };
