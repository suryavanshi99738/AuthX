export const corsConfig = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Device-Fingerprint'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400, // 24 hours
} as const;

export type CorsConfig = typeof corsConfig;
