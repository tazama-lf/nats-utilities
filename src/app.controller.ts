import { type Context } from 'koa';
import { config } from './config';
import { loggerService } from './server';
import { jetStreamConsume, jetStreamPublish } from './services/jetStreamService';
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
        returnMessage = jetStreamConsume(natsConsumer,functionName);
        await jetStreamPublish(request.message, natsDestination);
        await returnMessage.then((message) =>{
          returnMessage = message;
        });
        break;
    
      case "nats":
        returnMessage = natsServiceConsume(natsConsumer,functionName);
        await natsServicePublish(request.message, natsDestination);
        await returnMessage.then((message) =>{
          returnMessage = message;
        });
        break;

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