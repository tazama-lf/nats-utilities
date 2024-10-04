// SPDX-License-Identifier: Apache-2.0

export interface IConfig {
  nodeEnv: string;
  restPort: number;
  functionName: string;
  startupType: 'nats' | 'jetstream';
  serverUrl: string;
}
