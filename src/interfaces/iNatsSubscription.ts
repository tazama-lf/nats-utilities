import type { NatsConnection, Subscription } from 'nats';

interface LocalSubscription {
  subscription: Subscription;
  natsCon: NatsConnection;
}

export type { LocalSubscription };
