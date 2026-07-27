/**
 * Custom Hooks - Barrel Export
 *
 * Re-exports existing hooks and provides placeholders
 * for future custom hooks in the BankShield Auth application.
 */

// Re-export existing hooks
export { useToast, toast } from './use-toast';
export { useIsMobile } from './use-mobile';

// Future hooks placeholder exports:
// - useAuth: Authentication state and actions
// - useSession: Session management
// - useDevice: Device trust and management
// - useSecurityEvents: Security event tracking
// - useRiskAssessment: Risk level evaluation
// - useOTP: OTP verification flow
// - useAuthChallenge: Multi-step auth challenge handling
