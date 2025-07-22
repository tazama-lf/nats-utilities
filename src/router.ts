// SPDX-License-Identifier: Apache-2.0

import { healthCheck } from './health.controller';
import { natsPublish, tms } from './app.controller';
import Router from '@koa/router';

const router = new Router();

// health checks
router.get('/', healthCheck);
router.get('/health', healthCheck);

// execute the service Pain001
router.post('/natsPublish', natsPublish);
router.post('/restPublish', tms);

export default router;
