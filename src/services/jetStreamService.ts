import { AckPolicy, Consumer, ConsumerConfig, StringCodec, connect } from 'nats';
import { config } from '../config';

export const jetStreamPublish = async (message: unknown, producerStreamName: string) => {
  const natsConn = await connect({
    servers: config.serverUrl,
  });

  // Jetstream setup
  const jsm = await natsConn.jetstreamManager();
  const js = natsConn.jetstream();

  await jsm.streams.find(producerStreamName).then(
    async (stream) => {
      const sc = StringCodec();
      const res = JSON.stringify(message);

      await js.publish(producerStreamName, sc.encode(res));
    },
    async (reason) => {
      console.log(JSON.stringify(reason, null, 4));
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


export const onJetStreamMessage = async (consumer: Consumer) => {
  // create a simple consumer and iterate over messages matching the subscription
  const sub = await consumer.consume({ max_messages: 1 });

  for await (const message of sub) {
    console.debug(`${Date.now().toLocaleString()} S:[${message?.seq}] Q:[${message.subject}]: ${message.data.length}`);
    const request = message.json<string>();
    message.ack();
    return request;
  }

}
