// SPDX-License-Identifier: Apache-2.0

import { type Context } from 'koa';
import { config } from './config';
import { loggerService } from '.';
import { jetStreamConsume, jetStreamPublish, onJetStreamMessage } from './services/jetStreamService';
import { natsServiceSubscribe, natsServicePublish, onMessage } from './services/natsService';
import axios from 'axios';
import { type NatsConnection, type Subscription } from 'nats';
import { type RequestBody } from './interfaces/iRequestBody';

export const tms = async (ctx: Context): Promise<unknown> => {
  const responseHttp: Record<string, unknown> = {};
  try {
    const { transaction, endpoint, natsConsumer, functionName, awaitReply } = ctx.request.body as RequestBody;

    let returnMessage;
    let subscription;
    let consumer;
    let httpReponseJetStream;
    let httpResponseNATS;
    let reply;

    switch (config.startupType) {
      case 'jetstream':
        consumer = await jetStreamConsume(natsConsumer, functionName);
        returnMessage = onJetStreamMessage(consumer);
        httpReponseJetStream = await axios.post(endpoint, transaction);

        reply = returnMessage.then((message) => {
          returnMessage = message;
        });

        if (awaitReply) {
          loggerService.log('Awaiting response');
          await reply;
        } else {
          loggerService.log('Not waiting for response');
        }

        responseHttp.tmsResponse = httpReponseJetStream.data;
        responseHttp.edResponse = returnMessage;
        responseHttp.status = httpReponseJetStream.status;
        break;

      case 'nats':
        loggerService.log('nats communication was triggered');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- NATS is returning Promise<any>
        subscription = await natsServiceSubscribe(natsConsumer, functionName);
        loggerService.log(`Subscription to ${String(natsConsumer)} was done`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- NATS is returning Promise<any>
        returnMessage = onMessage(subscription.subscription);
        httpResponseNATS = await axios.post(endpoint, transaction);
        loggerService.log(`REST Publish to ${String(endpoint)} was done`);
        reply = returnMessage.then((message) => {
          returnMessage = message;
        });

        if (awaitReply) {
          loggerService.log('Awaiting response');
          await reply;
        } else {
          loggerService.log('Not waiting for response');
        }

        responseHttp.tmsResponse = httpResponseNATS.data;
        responseHttp.edResponse = returnMessage;
        responseHttp.status = httpResponseNATS.status;
        break;
      default:
        break;
    }

    ctx.body = responseHttp;
  } catch (error) {
    loggerService.log(error as string);

    ctx.status = 500;
    ctx.body = {
      error,
    };
  }
  return ctx;
};

export const natsPublish = async (ctx: Context): Promise<unknown> => {
  try {
    const request = ctx.request.body ?? JSON.parse('');
    const natsDestination = request.destination as string;
    const natsConsumer = request.consumer as string;
    const functionName = request.functionName as string;

    const awaitReply: boolean | undefined = request.awaitReply;

    loggerService.log(`${String(natsConsumer)} sub - ${String(natsDestination)} pub - ${String(functionName)} Function name`);

    let returnMessage;
    let subscription: { subscription: Subscription; natsCon: NatsConnection };
    let consumer;
    let reply;

    switch (config.startupType) {
      case 'jetstream':
        consumer = await jetStreamConsume(natsConsumer, functionName);
        returnMessage = onJetStreamMessage(consumer);
        await jetStreamPublish(request.message, natsDestination);
        reply = returnMessage.then((message) => {
          returnMessage = message;
        });
        if (awaitReply) {
          loggerService.log('Awaiting response');
          await reply;
        } else {
          loggerService.log('Not waiting for response');
        }
        break;

      case 'nats':
        loggerService.log('nats communication was triggered');
        subscription = await natsServiceSubscribe(natsConsumer, functionName);
        loggerService.log(`Subscription to ${String(natsConsumer)} was done`);
        returnMessage = onMessage(subscription.subscription);
        natsServicePublish(subscription.natsCon, request.message as object, natsDestination);
        loggerService.log(`Publish to ${String(natsDestination)} was done`);
        reply = returnMessage.then((message) => {
          returnMessage = message;
        });

        if (awaitReply) {
          loggerService.log('Awaiting response');
          await reply;
        } else {
          loggerService.log('Not waiting for response');
        }
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
