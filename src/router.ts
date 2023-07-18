import Router from 'koa-router';
import { healthCheck } from './health.controller';
import { natsPublish } from './app.controller';


const router = new Router();

// health checks
router.get('/', healthCheck);
router.get('/health', healthCheck);

// execute the service Pain001
router.post('/natsPublish', natsPublish);

export default router;
