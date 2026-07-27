export const databaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bankshield-auth',
  options: {
    dbName: 'bankshield-auth',
  },
} as const;

export type DatabaseConfig = typeof databaseConfig;
