// Device service - placeholder (Sprint 1)

import { DeviceDocument } from '../types/device.types';

export class DeviceService {
  static async registerDevice(data: any): Promise<DeviceDocument> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async getDeviceByFingerprint(fingerprint: string): Promise<DeviceDocument | null> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async getDevicesByUserId(userId: string): Promise<DeviceDocument[]> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async updateDeviceTrust(deviceId: string, trustLevel: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async updateLastUsed(deviceId: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async deactivateDevice(deviceId: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }
}
