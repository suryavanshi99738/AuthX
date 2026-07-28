// Mongoose Device model schema - DEFINED

import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  deviceFingerprint: string;
  deviceName?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  os?: string;
  browser?: string;
  trustLevel: 'untrusted' | 'verified' | 'trusted';
  lastUsed: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    deviceFingerprint: {
      type: String,
      required: [true, 'Device fingerprint is required'],
      unique: true,
    },
    deviceName: {
      type: String,
      required: false,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown',
    },
    os: {
      type: String,
      required: false,
    },
    browser: {
      type: String,
      required: false,
    },
    trustLevel: {
      type: String,
      enum: ['untrusted', 'verified', 'trusted'],
      default: 'untrusted',
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
DeviceSchema.index({ userId: 1 });
DeviceSchema.index({ deviceFingerprint: 1 });
DeviceSchema.index({ trustLevel: 1 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
