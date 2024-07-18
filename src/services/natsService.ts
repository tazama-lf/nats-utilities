// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-unreachable-loop */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { type NatsConnection, type Subscription, connect } from 'nats';
import { config } from '../config';
import FRMSMessage from '@frmscoe/frms-coe-lib/lib/helpers/protobuf';
import { loggerService } from '../';

export const natsServicePublish = (natsConnection: NatsConnection, message: object, producerStreamName: string): void => {
  const messageFrms = FRMSMessage.create(message);
  const messageBuffer = FRMSMessage.encode(messageFrms).finish();

  if (producerStreamName && natsConnection) {
    natsConnection.publish(producerStreamName, messageBuffer);
  }
};

export const natsServiceSubscribe = async (consumerStreamName: string, functionName: string): Promise<any> => {
  const servUrl = config.serverUrl;
  const natsCon = await connect({
    servers: servUrl,
  });
  const subscription = natsCon.subscribe(consumerStreamName, { queue: `${functionName}` });
  return { natsCon, subscription };
};

export const onMessage = async (sub: Subscription): Promise<string | undefined> => {
  for await (const message of sub) {
    loggerService.debug(`${Date.now().toLocaleString()} sid:[${message?.sid}] subject:[${message.subject}]: ${message.data.length}`);
    const decodedMessage = FRMSMessage.decode(message.data);
    const objMessages = FRMSMessage.toObject(decodedMessage) as unknown;
    return objMessages as string;
  }
};
