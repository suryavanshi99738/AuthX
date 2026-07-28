// Mongoose SecurityEvent model schema - DEFINED

import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityEvent extends Document {
  userId: mongoose.Types.ObjectId;
  eventType:
    | 'login'
    | 'logout'
    | 'login_failed'
    | 'otp_sent'
    | 'otp_verified'
    | 'device_added'
    | 'device_removed'
    | 'session_expired'
    | 'password_reset'
    | 'account_locked'
    | 'suspicious_activity';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  ip?: string;
  userAgent?: string;
  location?: {
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  metadata?: unknown;
  createdAt: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    eventType: {
      type: String,
      enum: [
        'login',
        'logout',
        'login_failed',
        'otp_sent',
        'otp_verified',
        'device_added',
        'device_removed',
        'session_expired',
        'password_reset',
        'account_locked',
        'suspicious_activity',
      ],
      required: [true, 'Event type is required'],
    },
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
    },
    ip: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    location: {
      city: { type: String },
      country: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for faster lookups
SecurityEventSchema.index({ userId: 1, eventType: 1 });
SecurityEventSchema.index({ severity: 1 });
SecurityEventSchema.index({ createdAt: -1 });

export const SecurityEvent = mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);
