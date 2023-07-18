export interface IConfig {
  nodeEnv: string;
  restPort: number;
  apmLogging: boolean;
  apmSecretToken: string;
  apmURL: string;
  functionName: string;
  startupType: "nats" | "jetstream"
  serverUrl: string;
}
