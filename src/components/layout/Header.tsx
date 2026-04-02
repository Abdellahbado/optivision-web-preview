import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-14 bg-surface border-b border-surface-border',
        'transition-[left] duration-200 ease-out',
        sidebarCollapsed ? 'left-16' : 'left-[220px]'
      )}
    >
      <div className="flex h-full items-center justify-between px-5">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher clients, commandes, produits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'h-9 w-full border border-surface-border bg-cream pl-9 pr-3 text-sm text-text-primary',
              'placeholder:text-text-muted',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent focus:bg-surface'
            )}
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>OptiVision v1.0</span>
        </div>
      </div>
    </header>
  );
}
