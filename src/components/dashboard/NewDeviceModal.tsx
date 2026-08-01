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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-5 shadow-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                <ShieldAlert className="w-5 h-5 text-warning animate-pulse" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">New Login Detected</h3>
                <p className="text-xs text-muted-foreground">Unregistered device accessed your account</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-warning/30 text-warning font-semibold">
              Action Needed
            </Badge>
          </div>

          {/* Device Details Card */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <span>{deviceInfo.deviceName}</span>
              </div>
              <span className="text-muted-foreground font-normal">{deviceInfo.browser}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{deviceInfo.ipAddress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{deviceInfo.location}</span>
              </div>
            </div>
          </div>

          {/* Action Message feedback */}
          {actionMessage && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          {step === 'initial' ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-foreground text-center">Did you just log in from this device?</p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleNoItsNotMe}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1 rounded-xl text-xs font-semibold h-10 gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  No, It's Not Me
                </Button>
                <Button
                  onClick={handleYesItsMe}
                  disabled={loading}
                  className="flex-1 rounded-xl text-xs font-semibold h-10 gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Yes, It's Me
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1 animate-fadeIn">
              <p className="text-xs text-muted-foreground text-center">
                Would you like to add <strong className="text-foreground">{deviceInfo.deviceName}</strong> to your Trusted Devices list for faster logins?
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleConfirmTrust}
                  disabled={loading}
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-9 gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Trust Device'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
