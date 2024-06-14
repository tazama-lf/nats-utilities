// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */
import { LoggerService } from '@frmscoe/frms-coe-lib';
import apm from 'elastic-apm-node';
import App from './app';
import { config } from './config';

if (config.apmLogging) {
  apm.start({
    serviceName: config.functionName,
    secretToken: config.apmSecretToken,
    serverUrl: config.apmURL,
    usePathAsTransactionName: true,
    active: config.apmLogging,
    transactionIgnoreUrls: ['/health'],
    disableInstrumentations: ['log4js'],
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
