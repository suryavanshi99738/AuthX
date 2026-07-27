// Mongoose Session model schema - DEFINED

import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  deviceInfo: {
    userAgent?: string;
    ip?: string;
    fingerprint?: string;
  };
  authMethod: string;
  isActive: boolean;
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
    },
    deviceInfo: {
      userAgent: { type: String },
      ip: { type: String },
      fingerprint: { type: String },
    },
    authMethod: {
      type: String,
      required: [true, 'Auth method is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ token: 1 });
SessionSchema.index({ expiresAt: 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
