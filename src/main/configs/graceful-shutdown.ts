import { sqlConnection } from '@/infra/db/mssql/util';
import { rabbitMqServer } from '@/infra/mq/utils';
import { CONSUMER, logger, SCHEDULER, SERVER } from '@/util';
import mongoose from 'mongoose';
import { gracefulShutdown } from 'node-schedule';

import { application } from '../application';

export async function gracefulShutdownApplication() {
  logger.log({ level: 'info', message: 'Graceful shutdown initialized!' });

  if (SERVER.ENABLED) {
    if (!SERVER.GRACEFUL_SHUTDOWN_ENABLED) {
      process.exit(0);
    }

    application.close();
  }

  if (SCHEDULER.ENABLED) {
    if (!SCHEDULER.GRACEFUL_SHUTDOWN_ENABLED) process.exit(0);
    await gracefulShutdown();
  }

  if (CONSUMER.ENABLED) {
    if (!CONSUMER.GRACEFUL_SHUTDOWN_ENABLED) process.exit(0);
    const rabbitServer = rabbitMqServer();
    rabbitServer.cancelConsumers();
    await rabbitServer.verifyStillHaveMessage();
    await rabbitServer.closeChanel();
    await rabbitServer.close();
  }

  await sqlConnection.destroy();

  await mongoose.disconnect();

  process.exit(0);
}
