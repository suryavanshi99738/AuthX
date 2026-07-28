// User-related type definitions

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface UserDocument {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  authMethods: string[];
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  name?: string;
  phone?: string;
  authMethods?: string[];
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  authMethods?: string[];
  riskLevel?: RiskLevel;
  isActive?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  isVerified: boolean;
  riskLevel: RiskLevel;
  lastLogin?: Date;
  createdAt: Date;
}
