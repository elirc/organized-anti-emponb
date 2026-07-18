import app from './app';
import env from './config/env';
import { startWorker } from './jobs/worker';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  // Boot the background job consumer worker
  startWorker();
});

// Handle graceful shutdown scenarios
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: shutting down Express server...');
  server.close(() => {
    console.log('Express HTTP server closed.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: shutting down Express server...');
  server.close(() => {
    console.log('Express HTTP server closed.');
  });
});
