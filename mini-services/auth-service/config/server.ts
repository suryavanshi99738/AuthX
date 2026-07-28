export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: '/api',
} as const;

export type ServerConfig = typeof serverConfig;
