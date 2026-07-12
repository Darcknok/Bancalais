/**
 * Point d'entrée du serveur Express Bancalais Natation.
 * Configure les middlewares (CORS, Helmet, JSON parsing), monte les routes API,
 * et gère l'arrêt gracieux (SIGTERM/SIGINT).
 */
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
import { serverRouter } from './routes/server';

const app = express();

// Gestionnaires d'erreurs globaux pour les rejections/exceptions non attrapées
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Création des répertoires d'upload si inexistants (photos clubs, etc.)
const uploadsDir = path.join(process.cwd(), 'uploads');
const clubsDir = path.join(uploadsDir, 'clubs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(clubsDir)) fs.mkdirSync(clubsDir, { recursive: true });

// --- Middlewares de sécurité et utilitaires ---
// Helmet : protection HTTP (headers de sécurité). cross-origin pour servir les images.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS : autorise uniquement les origines listées dans la config (.env)
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
// Parsing du corps des requêtes en JSON
app.use(express.json());
// Fichiers statiques (photos de profils, logos clubs, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Montage des routes API ---
// Auth : inscription, connexion, profil
app.use('/api/auth', authRoutes);
// Administration : gestion des comptes, paramètres club
app.use('/api/admin', adminRoutes);
// Notifications push et in-app
app.use('/api/notifications', notificationRoutes);
// Compétitions et entraînements
app.use('/api/competitions', competitionRoutes);

// Feedback API — persistance des ressentis nageur
app.use('/api/feedback', feedbackRoutes);

// LiveFFN API — couche de cache/scraping pour les données FFN (liveffn.com)
app.use('/api/liveffn', liveffnRouter);

// Server monitoring — statut de la machine hôte (CPU, RAM, uptime)
app.use('/api/server', serverRouter);

// Endpoint de health check pour les sondes de surveillance (Docker, load balancer, etc.)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Démarrage du serveur ---
const server = app.listen(config.port, config.host, () => {
  console.log(`✅ Bancalais API running on http://${config.host}:${config.port} (${config.nodeEnv})`);
});

// Arrêt gracieux : ferme les connexions ouvertes avant de quitter (Docker, PM2, systemd)
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
