// Session-related type definitions

export type SessionStatus = 'active' | 'expired' | 'revoked';

export interface SessionDocument {
  _id: string;
  userId: string;
  token: string;
  deviceInfo: DeviceInfo;
  authMethod: string;
  isActive: boolean;
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  fingerprint?: string;
}

export interface CreateSessionDTO {
  userId: string;
  token: string;
  deviceInfo: DeviceInfo;
  authMethod: string;
  expiresAt: Date;
}

export interface SessionInfo {
  id: string;
  deviceInfo: DeviceInfo;
  authMethod: string;
  isActive: boolean;
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
}
