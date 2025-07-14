// SPDX-License-Identifier: Apache-2.0

import { LoggerService } from '@tazama-lf/frms-coe-lib';
import App from './app';
import { config } from './config';

export const loggerService: LoggerService = new LoggerService({
  maxCPU: 1,
  functionName: config.functionName,
  nodeEnv: config.nodeEnv,
});
const runServer = (): App => {
  /**
   * KOA Rest Server
   */
  const app = new App();

  app.listen(config.restPort, () => {
    loggerService.log(`API restServer listening on PORT ${config.restPort}`);
  });

  return app;
};

process.on('uncaughtException', (err) => {
  loggerService.error('process on uncaughtException error: ', err);
});

process.on('unhandledRejection', (err) => {
  loggerService.error('process on unhandledRejection error: ', err);
});

try {
  runServer();
} catch (err) {
  loggerService.error(`Error while starting HTTP server on Worker ${process.pid}`, err);
}

export { runServer };
