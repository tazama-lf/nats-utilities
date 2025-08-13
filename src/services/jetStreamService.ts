// SPDX-License-Identifier: Apache-2.0

import { AckPolicy, type Consumer, type ConsumerConfig, StringCodec, connect } from 'nats';
import { config } from '../config';
import { loggerService } from '..';

export const jetStreamPublish = async (message: unknown, producerStreamName: string): Promise<void> => {
  const natsConn = await connect({
    servers: config.serverUrl,
  });

  // Jetstream setup
  const jsm = await natsConn.jetstreamManager();
  const js = natsConn.jetstream();

  await jsm.streams.find(producerStreamName).then(
    async (_stream) => {
      const sc = StringCodec();
      const res = JSON.stringify(message);

      await js.publish(producerStreamName, sc.encode(res));
    },
    (reason: unknown) => {
      loggerService.log(reason as string);
    },
  );
};

export const jetStreamConsume = async (consumerStreamName: string, functionName: string): Promise<Consumer> => {
  const natsConn = await connect({
    servers: config.serverUrl,
  });

  // Jetstream setup
  const jsm = await natsConn.jetstreamManager();
  const js = natsConn.jetstream();

  const consumerCfg: Partial<ConsumerConfig> = {
    ack_policy: AckPolicy.Explicit,
    durable_name: functionName,
  };
  await jsm.consumers.add(consumerStreamName, consumerCfg);

  // Get the consumer to listen to messages for
  return await js.consumers.get(consumerStreamName, functionName);
};

export const onJetStreamMessage = async (consumer: Consumer): Promise<string | undefined> => {
  // consume a single message
  const message = await consumer.next();
  if (message) {
    loggerService.debug(`${Date.now().toLocaleString()} S:[${message.seq}] Q:[${message.subject}]: ${message.data.length}`);
    const request = message.json<string>();
    message.ack();
    return request;
  }
};
