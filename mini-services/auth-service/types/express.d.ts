// Express type extensions
import { UserDocument } from './user.types';
import { SessionDocument } from './session.types';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      session?: SessionDocument;
      deviceId?: string;
      requestId?: string;
    }
  }
}

export {};
