// OTP service - placeholder (Sprint 1)

export class OTPService {
  static async generateOTP(email: string, method: string): Promise<{ otpId: string; expiresAt: Date }> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async verifyOTP(otpId: string, otp: string): Promise<boolean> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async invalidateOTP(otpId: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async getRemainingAttempts(otpId: string): Promise<number> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async resendOTP(otpId: string): Promise<{ otpId: string; expiresAt: Date }> {
    throw new Error('Not implemented in Sprint 1');
  }
}
