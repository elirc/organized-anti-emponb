import express from 'express';
import cors from 'cors';
import path from 'path';
import requestLogger from './middleware/requestLogger.middleware';
import errorMiddleware from './middleware/error.middleware';
import env from './config/env';

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// Request payload parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP loggers
app.use(requestLogger);

// Mount folder for document uploads
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health Check API
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV
  });
});

// Stubs for Modules Router
import { apiRouter } from './routes';
app.use('/api', apiRouter);

// Centralized error handler middleware
app.use(errorMiddleware);

export default app;
export { app };
