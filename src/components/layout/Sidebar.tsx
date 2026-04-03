import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/types';
import {
  LayoutDashboard,
  Search,
  UserRoundSearch,
  Users,
  FileText,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  Shield,
  User,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/recherche-stock', icon: Search, label: 'Recherche stock' },
  { to: '/accueil-client', icon: UserRoundSearch, label: 'Accueil client' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/ordonnances', icon: FileText, label: 'Ordonnances' },
  { to: '/produits', icon: Package, label: 'Produits' },
  { to: '/commandes', icon: ShoppingCart, label: 'Commandes' },
  { to: '/liste-verres', icon: ClipboardList, label: 'Liste verres' },
  { to: '/factures', icon: Receipt, label: 'Factures' },
  { to: '/rapports', icon: BarChart3, label: 'Rapports' },
];

// Admin-only menu items
const adminMenuItems = [
  { to: '/sauvegarde', icon: Database, label: 'Sauvegarde', permission: 'canAccessBackup' as const },
  { to: '/parametres', icon: Settings, label: 'Paramètres', permission: 'canAccessSettings' as const },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const userRole = user?.role;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter admin items based on permissions
  const visibleAdminItems = adminMenuItems.filter(
    (item) => hasPermission(userRole, item.permission)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-surface border-r border-surface-border',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-[220px]'
      )}
    >
      {/* Logo */}
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

      {/* Navigation */}
      <nav className="flex flex-col h-[calc(100vh-3.5rem)] justify-between py-2">
        <div className="space-y-0.5 px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center h-10 px-2 text-sm font-medium transition-colors',
                  'hover:bg-accent-light',
                  isActive
                    ? 'bg-accent-light text-accent border-l-2 border-accent'
                    : 'text-text-secondary border-l-2 border-transparent',
                  collapsed && 'justify-center px-0 border-l-0'
                )
              }
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
          {/* User info */}
          {user && (
            <div
              className={cn(
                'flex items-center h-10 px-2 text-sm',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? `${user.prenom} ${user.nom} (${user.role})` : undefined}
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

          {/* Admin-only menu items */}
          {visibleAdminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center h-10 px-2 text-sm font-medium transition-colors',
                  'hover:bg-accent-light',
                  isActive
                    ? 'bg-accent-light text-accent border-l-2 border-accent'
                    : 'text-text-secondary border-l-2 border-transparent',
                  collapsed && 'justify-center px-0 border-l-0'
                )
              }
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

          {/* Logout button */}
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

          {/* Collapse Toggle */}
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
