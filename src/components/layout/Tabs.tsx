import { cn } from '@/lib/utils';

export interface TabDefinition {
  id: string;
  label: string;
  /** Pastille de comptage, par exemple le nombre de verres a commander. */
  badge?: number;
}

interface TabsProps {
  tabs: TabDefinition[];
  active: string;
  onChange: (id: string) => void;
}

/** Onglets d'un meme domaine: evite d'ajouter une entree de menu par ecran. */
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-surface-border">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 h-10 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  'text-[11px] px-1.5 py-0.5 leading-none',
                  isActive ? 'bg-accent text-white' : 'bg-cream text-text-secondary'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
