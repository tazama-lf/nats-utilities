/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-unreachable-loop */
/* eslint-disable no-console */
import { type NatsConnection, type Subscription, connect } from 'nats';
import { config } from '../config';
import FRMSMessage from '@frmscoe/frms-coe-lib/lib/helpers/protobuf';

export const natsServicePublish = async (natsConnection: NatsConnection, message: object, producerStreamName: string) => {
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

export const onMessage = async (sub: Subscription) => {
  for await (const message of sub) {
    console.debug(`${Date.now().toLocaleString()} sid:[${message?.sid}] subject:[${message.subject}]: ${message.data.length}`);
    return message.json<string>();
  }
};
