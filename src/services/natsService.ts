// SPDX-License-Identifier: Apache-2.0

import { type NatsConnection, type Subscription, connect } from 'nats';
import { config } from '../config';
import FRMSMessage from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { loggerService } from '../';
import type { LocalSubscription } from '../interfaces/iNatsSubscription';

export const natsServicePublish = (natsConnection: NatsConnection, message: object, producerStreamName: string): void => {
  const messageFrms = FRMSMessage.create(message);
  const messageBuffer = FRMSMessage.encode(messageFrms).finish();

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
    const decodedMessage = FRMSMessage.decode(message.data);
    const objMessages = FRMSMessage.toObject(decodedMessage) as unknown;
    return objMessages as string;
  }
};
