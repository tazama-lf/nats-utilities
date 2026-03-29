// SPDX-License-Identifier: Apache-2.0

import { type NatsConnection, type Subscription, connect } from 'nats';
import { config } from '../config';
import { createMessageBuffer, decodeMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { loggerService } from '../';
import type { LocalSubscription } from '../interfaces/iNatsSubscription';

export const natsServicePublish = (natsConnection: NatsConnection, message: object, producerStreamName: string): void => {
  const messageBuffer = createMessageBuffer(message as Record<string, unknown>);
  if (!messageBuffer) {
    loggerService.error('Unable to serialize payload for NATS publish');
    return;
  }

  natsConnection.publish(producerStreamName, messageBuffer);
};

export const natsServiceSubscribe = async (consumerStreamName: string, functionName: string): Promise<LocalSubscription> => {
  const servUrl = config.serverUrl;
  const natsCon = await connect({
    servers: servUrl,
  });
  const subscription = natsCon.subscribe(consumerStreamName, { queue: functionName });
  return { natsCon, subscription };
};

export const onMessage = async (sub: Subscription): Promise<unknown> => {
  /* eslint-disable-next-line no-unreachable-loop -- one iteration */
  for await (const message of sub) {
    loggerService.debug(`${Date.now().toLocaleString()} sid:[${message.sid}] subject:[${message.subject}]: ${message.data.length}`);
    return decodeMessageBuffer(Buffer.from(message.data));
  }
};
