import { type Context, type Next } from 'koa';

export const healthCheck = async (ctx: Context, next: Next): Promise<Context> => {
  ctx.status = 200;
  ctx.body = { status: 'UP' };
  await next();

  return ctx;
};
