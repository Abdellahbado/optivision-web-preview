import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * Version d'essai en ligne: les donnees restent dans le navigateur du testeur.
 * A retirer dans la version Windows.
 */
function DemoBanner() {
  const [visible, setVisible] = useState(
    () => sessionStorage.getItem('optivision-demo-banner') !== 'ferme'
  );
  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 border border-info/30 bg-info-light px-4 py-3">
      <Info className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
      <p className="text-sm text-text-secondary flex-1">
        <strong className="text-text-primary">Version d’essai.</strong> Vous pouvez tout
        essayer librement : clients, ventes, factures, stock. Les données sont enregistrées
        dans ce navigateur uniquement. La version finale sera installée sur l’ordinateur du
        magasin, avec sa propre base de données et ses sauvegardes.
      </p>
      <button
        onClick={() => {
          sessionStorage.setItem('optivision-demo-banner', 'ferme');
          setVisible(false);
        }}
        className="text-text-muted hover:text-text-primary transition-colors"
        aria-label="Masquer ce message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header sidebarCollapsed={sidebarCollapsed} />
      
      <main
        className={cn(
          'pt-14 min-h-screen transition-[padding] duration-200 ease-out',
          sidebarCollapsed ? 'pl-16' : 'pl-[220px]'
        )}
      >
        <div className="p-6 space-y-4">
          <DemoBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
