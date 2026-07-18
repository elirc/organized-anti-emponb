import { Worker } from 'bullmq';
import env from '../config/env';
import { NotificationService } from '../modules/notifications/notification.service';
import IORedis from 'ioredis';

let worker: Worker | null = null;

export const startWorker = () => {
  try {
    const redisConnection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
    });

    redisConnection.on('error', () => {
      // Gracefully capture offline redis events
    });

    worker = new Worker(
      'notifications',
      async (job) => {
        if (job.name === 'sendEmail') {
          const { emailId } = job.data;
          await NotificationService.deliverEmailMock(emailId);
        }
      },
      {
        connection: redisConnection,
        concurrency: 2,
      }
    );

    worker.on('completed', (job) => {
      console.log(`✅ BullMQ job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ BullMQ job ${job?.id} failed:`, err);
    });

    console.log('👷 BullMQ Background Worker successfully configured.');
  } catch (error) {
    console.warn('⚠️ BullMQ worker bypass: Redis is offline. Running in direct in-memory fallback mode.');
  }
};

export default startWorker;
