'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Smartphone,
  Laptop,
  Globe,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { InfoCallout } from '@/components/ui/info-callout';
import { trustDevice } from '@/services/auth-client';

interface NewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  sessionToken?: string;
  deviceInfo?: {
    deviceName: string;
    browser: string;
    ipAddress: string;
    location: string;
  };
  onTrustSuccess?: () => void;
  onRevokeSuccess?: () => void;
}

export function NewDeviceModal({
  isOpen,
  onClose,
  userId,
  sessionToken,
  deviceInfo = {
    deviceName: 'Mobile Device',
    browser: 'Chrome 124',
    ipAddress: '10.17.87.25',
    location: 'Local Network (Wi-Fi)',
  },
  onTrustSuccess,
  onRevokeSuccess,
}: NewDeviceModalProps) {
  const [step, setStep] = useState<'initial' | 'trust_confirm'>('initial');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const handleYesItsMe = () => {
    setStep('trust_confirm');
  };

  const handleConfirmTrust = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await trustDevice(
        userId,
        deviceInfo.deviceName,
        deviceInfo.browser,
        `${deviceInfo.deviceName}-${deviceInfo.browser}`
      );
      if (res.success) {
        setActionMessage('Device added to Trusted Devices!');
        if (onTrustSuccess) onTrustSuccess();
        setTimeout(() => {
          onClose();
          setStep('initial');
        }, 1200);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleNoItsNotMe = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/devices/trust', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentToken: sessionToken }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Unauthorized device session revoked!');
        if (onRevokeSuccess) onRevokeSuccess();
        setTimeout(() => {
          onClose();
          setStep('initial');
        }, 1500);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 mx-4"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-semibold mt-4">New Login Detected</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Unregistered device accessed your account</p>
            <StatusBadge variant="warning">Action Needed</StatusBadge>
          </div>

          {/* Device Details Card */}
          <div className="mt-6 bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Smartphone className="w-4 h-4" /> Device</span>
              <span className="text-sm font-medium">{deviceInfo.deviceName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Globe className="w-4 h-4" /> Browser</span>
              <span className="text-sm font-medium">{deviceInfo.browser}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Globe className="w-4 h-4" /> IP Address</span>
              <span className="text-sm font-medium">{deviceInfo.ipAddress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Location</span>
              <span className="text-sm font-medium">{deviceInfo.location}</span>
            </div>
          </div>

          {/* Action Message feedback */}
          {actionMessage && (
            <div className="mt-4">
              <InfoCallout variant="success" title={actionMessage} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6">
            {step === 'initial' ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-center">Did you just log in from this device?</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleNoItsNotMe}
                    disabled={loading}
                    className="flex-1 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 rounded-lg h-11 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    No, It's Not Me
                  </button>
                  <button
                    onClick={handleYesItsMe}
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground rounded-lg h-11 text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Yes, It's Me
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                <p className="text-sm text-muted-foreground text-center">
                  Would you like to add <strong className="text-foreground">{deviceInfo.deviceName}</strong> to your Trusted Devices list for faster logins?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="flex-1 rounded-lg h-11 text-sm"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={handleConfirmTrust}
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground rounded-lg h-11 text-sm gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Trust Device'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
