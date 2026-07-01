import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import competitionRoutes from './routes/competitions';
import feedbackRoutes from './routes/feedback';
import { liveffnRouter } from './liveffn/routes';

const app = express();

// Global error handlers for uncaught rejections/exceptions
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Ensure upload directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const clubsDir = path.join(uploadsDir, 'clubs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(clubsDir)) fs.mkdirSync(clubsDir, { recursive: true });

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/competitions', competitionRoutes);

// ─── Feedback API — persistance des ressentis nageur ─────────────
app.use('/api/feedback', feedbackRoutes);

// ─── LiveFFN API — scraping layer for liveffn.com ────────────────
app.use('/api/liveffn', liveffnRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(config.port, config.host, () => {
  console.log(`✅ Bancalais API running on http://${config.host}:${config.port} (${config.nodeEnv})`);
});

// Graceful shutdown for Docker/PM2/systemd
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  const timeout = setTimeout(() => {
    console.error('⏱️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  server.close(() => {
    clearTimeout(timeout);
    console.log('✅ Server closed');
    process.exit(0);
  });
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
