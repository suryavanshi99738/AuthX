// Token utility - placeholder (Sprint 1)

export class TokenUtil {
  static generateAccessToken(payload: Record<string, unknown>): string {
    throw new Error('Not implemented in Sprint 1');
  }

  static generateRefreshToken(payload: Record<string, unknown>): string {
    throw new Error('Not implemented in Sprint 1');
  }

  static verifyAccessToken(token: string): Record<string, unknown> {
    throw new Error('Not implemented in Sprint 1');
  }

  static verifyRefreshToken(token: string): Record<string, unknown> {
    throw new Error('Not implemented in Sprint 1');
  }

  static decodeToken(token: string): Record<string, unknown> | null {
    throw new Error('Not implemented in Sprint 1');
  }
}
