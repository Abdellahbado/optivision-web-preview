import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, AuthState } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';

// Default users for demo (in production, this would come from the database)
const DEFAULT_USERS: (User & { password: string })[] = [
  {
    id: 1,
    nom: 'Admin',
    prenom: 'OptiVision',
    username: 'admin',
    password: 'admin123', // In production: hashed
    role: 'admin',
    actif: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    nom: 'Vendeur',
    prenom: 'Test',
    username: 'vendeur',
    password: 'vendeur123', // In production: hashed
    role: 'vendeur',
    actif: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

interface AuthStore extends AuthState {
  users: (User & { password: string })[];
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateLastLogin: () => void;
  addUser: (user: Omit<User, 'id' | 'created_at'> & { password: string }) => void;
  updateUser: (id: number, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: number) => void;
  getCurrentUserRole: () => UserRole | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: DEFAULT_USERS,

      login: (username: string, password: string) => {
        const { users } = get();
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );

        if (!user) {
          return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
        }

        if (!user.actif) {
          return { success: false, error: 'Ce compte est désactivé' };
        }

        const { password: _, ...safeUser } = user;
        set({
          user: safeUser,
          isAuthenticated: true,
        });

        // Update last login
        get().updateLastLogin();

        return { success: true };
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateLastLogin: () => {
        const { user, users } = get();
        if (!user) return;

        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
        );
        set({ users: updatedUsers });
      },

      addUser: (userData) => {
        const { users } = get();
        const newId = Math.max(...users.map((u) => u.id), 0) + 1;
        const newUser = {
          ...userData,
          id: newId,
          created_at: new Date().toISOString(),
        };
        set({ users: [...users, newUser] });
      },

      updateUser: (id, updates) => {
        const { users, user } = get();
        const updatedUsers = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
        set({ users: updatedUsers });

        // If current user is updated, update the session too
        if (user?.id === id) {
          const { password: _, ...safeUpdates } = updates as Partial<User & { password?: string }>;
          set({ user: { ...user, ...safeUpdates } });
        }
      },

      deleteUser: (id) => {
        const { users, user } = get();
        if (user?.id === id) {
          // Can't delete yourself
          return;
        }
        set({ users: users.filter((u) => u.id !== id) });
      },

      getCurrentUserRole: () => {
        const { user } = get();
        return user?.role ?? null;
      },
    }),
    {
      name: 'optivision-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        users: state.users,
      }),
    }
  )
);

// Hook for checking permissions
export function usePermission(permission: keyof typeof import('@/types').ROLE_PERMISSIONS['admin']): boolean {
  const { user } = useAuthStore();
  if (!user) return false;

  return ROLE_PERMISSIONS[user.role]?.[permission] ?? false;
}
