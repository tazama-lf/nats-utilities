import { type Context } from 'koa';
import { connect } from 'nats';
import { loggerService } from './server';
import { jetStreamConsume, jetStreamPublish } from './services/jetStreamService';
import { config } from './config';
import { natsServiceConsume, natsServicePublish } from './services/natsService';

export const natsPublish = async (ctx: Context): Promise<any> => {
  try {
    const request = ctx.request.body ?? JSON.parse('');
    const natsDestination = request.destination;
    const natsConsumer = request.consumer;
    const functionName = request.functionName;

    let returnMessage;

    switch (config.startupType) {
      case "jetstream":
        await jetStreamPublish(request.message, natsDestination);
        returnMessage = await jetStreamConsume(natsConsumer,functionName);
        break;
    
      case "nats":
        await natsServicePublish(request.message, natsDestination);
        returnMessage = await natsServiceConsume(natsConsumer,functionName);

      default:
        break;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Transaction is valid',
      data: returnMessage,
    };
  } catch (error) {
    loggerService.log(error as string);

    ctx.status = 500;
    ctx.body = {
      error,
    };
  }
  return ctx;
};