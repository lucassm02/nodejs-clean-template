import { sqlConnection } from '@/infra/db/mssql/util/connection';
import { logger } from '@/util';
import { MONGO, SERVER } from '@/util/constants';
import mongoose from 'mongoose';

import { application } from './application';
import { gracefulShutdownApplication } from './configs/graceful-shutdown';

application.onStart(async () => {
  try {
    mongoose.set('strictQuery', false);

    const mongoPromise = mongoose.connect(MONGO.URL(), {
      dbName: MONGO.NAME,
      authSource: MONGO.AUTH_SOURCE,
      authMechanism: 'SCRAM-SHA-1',
    });

    const sqlPromise = sqlConnection.raw('SELECT 1');

    await Promise.all([mongoPromise, sqlPromise]);
  } catch (error) {
    logger.log(error);
    throw error;
  }
});

application.listenAsync(SERVER.PORT, () => {
  logger.log({
    level: 'info',
    message: `Server is running on port: ${SERVER.PORT}`,
  });
});

['SIGTERM', 'SIGINT'].forEach((event) =>
  process.on(event, gracefulShutdownApplication)
);
