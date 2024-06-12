// SPDX-License-Identifier: Apache-2.0

import { type Context } from 'koa';
import { config } from './config';
import { loggerService } from '.';
import { jetStreamConsume, jetStreamPublish, onJetStreamMessage } from './services/jetStreamService';
import { natsServiceSubscribe, natsServicePublish, onMessage } from './services/natsService';
import type { NatsConnection, Subscription } from 'nats';

export const natsPublish = async (ctx: Context): Promise<unknown> => {
  try {
    const request = ctx.request.body ?? JSON.parse('');
    const natsDestination = request.destination as string;
    const natsConsumer = request.consumer as string;
    const functionName = request.functionName as string;

    loggerService.log(`${String(natsConsumer)} sub - ${String(natsDestination)} pub - ${String(functionName)} Function name`);

    let returnMessage;
    let subscription: { subscription: Subscription, natsCon: NatsConnection };
    let consumer;

    switch (config.startupType) {
      case 'jetstream':
        consumer = await jetStreamConsume(natsConsumer, functionName);
        returnMessage = onJetStreamMessage(consumer);
        await jetStreamPublish(request.message, natsDestination);
        await returnMessage.then((message) => {
          returnMessage = message;
        });
        break;

      case 'nats':
        loggerService.log('nats communication was triggered');
        subscription = await natsServiceSubscribe(natsConsumer, functionName);
        loggerService.log(`Subscription to ${String(natsConsumer)} was done`);
        returnMessage = onMessage(subscription.subscription);
        natsServicePublish(subscription.natsCon, request.message as object, natsDestination);
        loggerService.log(`Publish to ${String(natsDestination)} was done`);
        await returnMessage.then((message) => {
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
