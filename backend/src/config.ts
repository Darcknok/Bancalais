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
  nodeEnv: process.env.NODE_ENV ?? 'development',
};

if (!config.supabaseUrl) throw new Error('SUPABASE_URL is required');
if (!config.supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
