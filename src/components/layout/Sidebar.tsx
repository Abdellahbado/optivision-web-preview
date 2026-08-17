import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/types';
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  LogOut,
  Package,
  Receipt,
  Settings,
  Shield,
  ShoppingBag,
  Sun,
  User,
  Users,
  Wrench,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Six entrees, dans l'ordre de la journee.
 * Tout le reste vit dans des onglets a l'interieur de ces pages.
 */
const menuItems = [
  { to: '/', icon: Sun, label: "Aujourd'hui", end: true },
  { to: '/vente', icon: ShoppingBag, label: 'Nouvelle vente' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/commandes', icon: Wrench, label: 'Commandes' },
  { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/argent', icon: Receipt, label: 'Argent' },
];

const adminMenuItems = [
  { to: '/rapports', icon: BarChart3, label: 'Rapports', permission: 'canAccessReports' as const },
  { to: '/sauvegarde', icon: Database, label: 'Sauvegarde', permission: 'canAccessBackup' as const },
  { to: '/parametres', icon: Settings, label: 'Paramètres', permission: 'canAccessSettings' as const },
];

const lienClasses = (isActive: boolean, collapsed: boolean) =>
  cn(
    'flex items-center h-10 px-2 text-sm font-medium transition-colors',
    'hover:bg-accent-light',
    isActive
      ? 'bg-accent-light text-accent border-l-2 border-accent'
      : 'text-text-secondary border-l-2 border-transparent',
    collapsed && 'justify-center px-0 border-l-0'
  );

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [adminOuvert, setAdminOuvert] = useState(false);

  const visibleAdminItems = adminMenuItems.filter((item) =>
    hasPermission(user?.role, item.permission)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-surface border-r border-surface-border',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-[220px]'
      )}
    >
      <div className="flex h-14 items-center border-b border-surface-border px-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">OV</span>
          </div>
          <span
            className={cn(
              'text-sm font-semibold text-text-primary whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}
          >
            OptiVision
          </span>
        </div>
      </div>

      <nav className="flex flex-col h-[calc(100vh-3.5rem)] justify-between py-2">
        <div className="space-y-0.5 px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => lienClasses(isActive, collapsed)}
              title={collapsed ? item.label : undefined}
            >
              <div className="w-9 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <span
                className={cn(
                  'whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200',
                  collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>

        <div className="space-y-0.5 px-2 border-t border-surface-border pt-2">
          {user && (
            <div
              className={cn(
                'flex items-center h-10 px-2 text-sm',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? `${user.prenom} ${user.nom}` : undefined}
            >
              <div className="w-9 flex items-center justify-center flex-shrink-0">
                {user.role === 'admin' ? (
                  <Shield className="h-[18px] w-[18px] text-accent" strokeWidth={1.75} />
                ) : (
                  <User className="h-[18px] w-[18px] text-text-secondary" strokeWidth={1.75} />
                )}
              </div>
              <div
                className={cn(
                  'whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200 min-w-0',
                  collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                )}
              >
                <p className="text-xs font-medium text-text-primary truncate">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-[10px] text-text-muted capitalize">{user.role}</p>
              </div>
            </div>
          )}

          {/* Administration: repliee par defaut, invisible pour un vendeur */}
          {visibleAdminItems.length > 0 && (
            <>
              <button
                onClick={() => (collapsed ? onToggle() : setAdminOuvert((open) => !open))}
                className={cn(
                  'flex items-center w-full h-10 px-2 text-sm font-medium transition-colors',
                  'text-text-secondary hover:bg-cream border-l-2 border-transparent',
                  collapsed && 'justify-center px-0 border-l-0'
                )}
                title={collapsed ? 'Administration' : undefined}
              >
                <div className="w-9 flex items-center justify-center flex-shrink-0">
                  <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </div>
                <span
                  className={cn(
                    'flex-1 text-left whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200',
                    collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  )}
                >
                  Administration
                </span>
                {!collapsed &&
                  (adminOuvert ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ))}
              </button>

              {adminOuvert &&
                !collapsed &&
                visibleAdminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(lienClasses(isActive, collapsed), 'pl-4 text-[13px]')
                    }
                  >
                    <div className="w-9 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center w-full h-10 px-2 text-sm font-medium transition-colors',
              'text-danger hover:bg-danger-light border-l-2 border-transparent',
              collapsed && 'justify-center px-0 border-l-0'
            )}
            title={collapsed ? 'Déconnexion' : undefined}
          >
            <div className="w-9 flex items-center justify-center flex-shrink-0">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}
            >
              Déconnexion
            </span>
          </button>

          <button
            onClick={onToggle}
            className={cn(
              'flex items-center w-full h-10 px-2 text-sm font-medium transition-colors',
              'text-text-muted hover:bg-cream hover:text-text-secondary border-l-2 border-transparent',
              collapsed && 'justify-center px-0 border-l-0'
            )}
          >
            <div className="w-9 flex items-center justify-center flex-shrink-0">
              {collapsed ? (
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
              ) : (
                <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
              )}
            </div>
            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}
            >
              Réduire
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
