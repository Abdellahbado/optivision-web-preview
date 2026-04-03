// User roles and authentication types
export type UserRole = 'admin' | 'vendeur';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  username: string;
  role: UserRole;
  actif: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Role permissions
export const ROLE_PERMISSIONS = {
  admin: {
    canViewPurchasePrice: true,
    canViewMargins: true,
    canManageUsers: true,
    canDeleteData: true,
    canExportData: true,
    canAccessSettings: true,
    canAccessReports: true,
    canAccessBackup: true,
  },
  vendeur: {
    canViewPurchasePrice: false,
    canViewMargins: false,
    canManageUsers: false,
    canDeleteData: false,
    canExportData: false,
    canAccessSettings: false,
    canAccessReports: true, // Limited reports
    canAccessBackup: false,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[UserRole];

// Helper to check permission
export function hasPermission(role: UserRole | undefined, permission: keyof RolePermissions): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}
