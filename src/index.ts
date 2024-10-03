// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import apm from 'elastic-apm-node';
import App from './app';
import { config } from './config';
import { validateAPMConfig } from '@tazama-lf/frms-coe-lib/lib/helpers/env';

const apmConfig = validateAPMConfig();
if (apmConfig.apmActive) {
  apm.start({
    serviceName: apmConfig.apmServiceName,
    secretToken: apmConfig.apmSecretToken,
    serverUrl: apmConfig.apmUrl,
    usePathAsTransactionName: true,
    active: apmConfig.apmActive,
    transactionIgnoreUrls: ['/health'],
  });
}

export const loggerService: LoggerService = new LoggerService();
const runServer = async (): Promise<App> => {
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

(async () => {
  try {
    await runServer();
  } catch (err) {
    loggerService.error(`Error while starting HTTP server on Worker ${process.pid}`, err);
  }
})();

export { runServer };
