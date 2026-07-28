// Device-related type definitions

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';
export type TrustLevel = 'untrusted' | 'verified' | 'trusted';

export interface DeviceDocument {
  _id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
  deviceType: DeviceType;
  os?: string;
  browser?: string;
  trustLevel: TrustLevel;
  lastUsed: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterDeviceDTO {
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
  deviceType?: DeviceType;
  os?: string;
  browser?: string;
}

export interface UpdateDeviceDTO {
  deviceName?: string;
  trustLevel?: TrustLevel;
  isActive?: boolean;
}

export interface DeviceInfo {
  id: string;
  deviceName?: string;
  deviceType: DeviceType;
  os?: string;
  browser?: string;
  trustLevel: TrustLevel;
  lastUsed: Date;
  isActive: boolean;
}
