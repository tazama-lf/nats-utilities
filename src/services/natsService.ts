// SPDX-License-Identifier: Apache-2.0

import { type NatsConnection, type Subscription, connect } from 'nats';
import { config } from '../config';
import { createMessageBuffer, decodeMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { loggerService } from '../';
import type { LocalSubscription } from '../interfaces/iNatsSubscription';

export const natsServicePublish = (natsConnection: NatsConnection, message: object, producerStreamName: string): void => {
  const messageBuffer = createMessageBuffer(message as Record<string, unknown>);
  if (!messageBuffer) throw new Error('Failed to encode message for NATS publish');
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

export const onMessage = async (sub: Subscription): Promise<string | undefined> => {
  /* eslint-disable-next-line no-unreachable-loop -- one iteration */
  for await (const message of sub) {
    loggerService.debug(`${Date.now().toLocaleString()} sid:[${message.sid}] subject:[${message.subject}]: ${message.data.length}`);
    const objMessages = decodeMessageBuffer(Buffer.from(message.data));
    return objMessages as unknown as string;
  }
};
