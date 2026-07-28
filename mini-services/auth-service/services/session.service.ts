// Session service - placeholder (Sprint 1)

import { SessionDocument } from '../types/session.types';

export class SessionService {
  static async createSession(data: any): Promise<SessionDocument> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async getSessionById(sessionId: string): Promise<SessionDocument | null> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async getSessionsByUserId(userId: string): Promise<SessionDocument[]> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async updateLastActivity(sessionId: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async revokeSession(sessionId: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async revokeAllUserSessions(userId: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async cleanExpiredSessions(): Promise<number> {
    throw new Error('Not implemented in Sprint 1');
  }
}
