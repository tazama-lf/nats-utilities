import { StringCodec, connect } from 'nats';
import { config } from '../config';

export const natsServicePublish = async (message: unknown, producerStreamName: string) => {
  const natsConn = await connect({
    servers: config.serverUrl,
  });

  const sc = StringCodec();
  const res = JSON.stringify(message);

  if (producerStreamName && natsConn) {
    natsConn.publish(producerStreamName, sc.encode(res));
  }
};

export const natsServiceConsume = async (consumerStreamName: string, functionName: string) => {
  const natsConn = await connect({
    servers: config.serverUrl,
  });

  const sub = natsConn.subscribe(consumerStreamName, { queue: `${functionName}` });

  for await (const message of sub) {
    console.debug(`${Date.now().toLocaleString()} sid:[${message?.sid}] subject:[${message.subject}]: ${message.data.length}`);
    return message.json<string>();
  }
};
