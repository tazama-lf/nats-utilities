export interface RequestBody {
  transaction: Record<string, unknown>;
  endpoint: string;
  natsConsumer: string;
  functionName: string;
  awaitReply?: boolean;
}
