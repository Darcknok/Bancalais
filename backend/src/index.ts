import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import competitionRoutes from './routes/competitions';
import feedbackRoutes from './routes/feedback';
import { liveffnRouter } from './liveffn/routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true }));
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

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Bancalais API running on http://0.0.0.0:${config.port}`);
});
