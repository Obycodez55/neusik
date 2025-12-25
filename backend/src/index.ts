/**
 * Neusik Backend API Server
 * Express.js server with TypeScript for audio separation API
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import separationRoutes from './routes/separation';
import { formatErrorResponse, getStatusCode, logError } from './utils/errors';
import { ensureDirectoryExists } from './utils/storage';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload and output directories exist
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const outputDir = process.env.OUTPUT_DIR || 'outputs';

(async () => {
  await ensureDirectoryExists(uploadDir);
  await ensureDirectoryExists(outputDir);
})();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Neusik API is running',
    version: '1.0.0',
  });
});

// API routes
app.use('/api/separation', separationRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  logError(err, { path: req.path, method: req.method });
  const errorResponse = formatErrorResponse(err);
  const statusCode = getStatusCode(err);

  res.status(statusCode).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Neusik API server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

