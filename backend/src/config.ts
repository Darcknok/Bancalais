import dotenv from 'dotenv';
dotenv.config();

export const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  jwtSecret: process.env.JWT_SECRET ?? (() => {
    console.warn('⚠️  WARNING: Using fallback JWT secret. Set JWT_SECRET in .env for production.');
    return 'fallback-dev-secret-do-not-use-in-prod';
  })(),
  port: parseInt(process.env.PORT ?? '4000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : (process.env.NODE_ENV === 'production'
      ? ['https://bancalais.fr', 'https://www.bancalais.fr']
      : ['http://localhost:8081', 'http://192.168.1.60:8081', 'http://localhost:4000']),
};

if (!config.supabaseUrl) throw new Error('SUPABASE_URL is required');
if (!config.supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
