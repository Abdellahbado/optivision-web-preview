import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { Produit } from '@/types';
import { Badge } from './Badge';

interface SearchableProductSelectProps {
  label?: string;
  products: Produit[];
  value: number | null;
  onChange: (productId: number | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function SearchableProductSelect({
  label,
  products,
  value,
  onChange,
  placeholder = 'Rechercher un produit...',
  emptyMessage = 'Aucun produit trouvé',
  disabled = false,
  error,
  className,
}: SearchableProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find(p => p.id === value);

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.toLowerCase();
    return products.filter(p => 
      p.nom.toLowerCase().includes(term) ||
      p.reference.toLowerCase().includes(term) ||
      p.marque?.toLowerCase().includes(term) ||
      p.modele?.toLowerCase().includes(term) ||
      p.couleur?.toLowerCase().includes(term)
    );
  }, [products, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (productId: number) => {
    onChange(productId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
      )}
      
      {/* Selected value display / trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full h-9 px-3 py-2',
          'border border-surface-border bg-surface text-sm text-left',
          'hover:border-accent/50 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cream',
          error && 'border-danger',
          isOpen && 'border-accent ring-1 ring-accent'
        )}
      >
        <span className={cn(
          'truncate',
          selectedProduct ? 'text-text-primary' : 'text-text-muted'
        )}>
          {selectedProduct 
            ? `${selectedProduct.nom} • ${formatCurrency(selectedProduct.prix_vente)}`
            : placeholder
          }
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedProduct && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-cream rounded transition-colors"
            >
              <X className="h-3.5 w-3.5 text-text-muted" />
            </span>
          )}
          <ChevronDown className={cn(
            'h-4 w-4 text-text-muted transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-surface-border shadow-lg max-h-72 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-surface-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className={cn(
                  'w-full h-8 pl-8 pr-3 text-sm',
                  'border border-surface-border bg-cream',
                  'placeholder:text-text-muted',
                  'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent'
                )}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="px-3 py-4 text-sm text-text-muted text-center">
                {emptyMessage}
              </div>
            ) : (
              filteredProducts.map(product => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product.id)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-left text-sm',
                    'hover:bg-cream transition-colors',
                    product.id === value && 'bg-accent-light'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary truncate">
                        {product.nom}
                      </span>
                      {product.id === value && (
                        <Check className="h-4 w-4 text-accent shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                      <span>{product.reference}</span>
                      {product.marque && <span>• {product.marque}</span>}
                      {product.couleur && <span>• {product.couleur}</span>}
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <div className="font-medium text-text-primary">
                      {formatCurrency(product.prix_vente)}
                    </div>
                    <div className={cn(
                      'text-xs',
                      product.quantite > product.stock_minimum 
                        ? 'text-success' 
                        : product.quantite > 0 
                          ? 'text-warning' 
                          : 'text-danger'
                    )}>
                      Stock: {product.quantite}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

// ===========================================================================
// Lens Search with Transposition Support
// ===========================================================================

/**
 * Optical transposition formula:
 * Original:   Sphere / Cylinder × Axis
 * Transposed: (Sphere + Cylinder) / (-Cylinder) × (Axis ± 90°)
 * 
 * Example: -2.00 / -1.00 × 180 ⟺ -3.00 / +1.00 × 90
 * 
 * Opticians may write the same prescription in either form.
 * When searching for lenses, we match BOTH representations.
 */

interface PrescriptionValues {
  sphere: number;
  cylinder: number;
  axis: number;
}

function transposeRx(rx: PrescriptionValues): PrescriptionValues {
  return {
    sphere: rx.sphere + rx.cylinder,
    cylinder: -rx.cylinder,
    axis: rx.axis >= 90 ? rx.axis - 90 : rx.axis + 90,
  };
}

export interface LensSearchFilters {
  type?: string;           // blue_block, photochromic, etc.
  sphere?: number;
  cylinder?: number;
  axis?: number;
  includeTransposed?: boolean;
}

interface LensSearchSelectProps {
  label?: string;
  products: Produit[];     // Should be VER category products
  value: number | null;
  onChange: (productId: number | null) => void;
  filters: LensSearchFilters;
  onFiltersChange: (filters: LensSearchFilters) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function LensSearchSelect({
  label,
  products,
  value,
  onChange,
  filters,
  onFiltersChange,
  placeholder = 'Rechercher un verre...',
  disabled = false,
  error,
  className,
}: LensSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [textSearch, setTextSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.id === value);

  // Filter products with transposition support
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Text search (name, brand, etc.)
    if (textSearch.trim()) {
      const term = textSearch.toLowerCase();
      result = result.filter(p =>
        p.nom.toLowerCase().includes(term) ||
        p.reference.toLowerCase().includes(term) ||
        p.marque?.toLowerCase().includes(term)
      );
    }

    // Type filter (from verre.traitements or notes)
    if (filters.type) {
      const typeTerm = filters.type.toLowerCase();
      result = result.filter(p => {
        const treatments = p.verre?.traitements?.join(' ').toLowerCase() || '';
        const notes = p.notes?.toLowerCase() || '';
        const name = p.nom.toLowerCase();
        return treatments.includes(typeTerm) || notes.includes(typeTerm) || name.includes(typeTerm);
      });
    }

    // Sphere/Cylinder search with transposition
    if (filters.sphere !== undefined && filters.cylinder !== undefined) {
      const searchRx: PrescriptionValues = {
        sphere: filters.sphere,
        cylinder: filters.cylinder,
        axis: filters.axis ?? 0,
      };
      const transposedRx = transposeRx(searchRx);

      result = result.filter(p => {
        const verre = p.verre;
        if (!verre) return true; // Include if no sphere/cylinder constraints

        const sphereMin = verre.sphere_min ?? -20;
        const sphereMax = verre.sphere_max ?? 20;
        const cylMax = verre.cylindre_max ?? 6;

        // Check if original Rx fits
        const originalFits = (
          searchRx.sphere >= sphereMin &&
          searchRx.sphere <= sphereMax &&
          Math.abs(searchRx.cylinder) <= cylMax
        );

        // Check if transposed Rx fits (only if enabled)
        const transposedFits = filters.includeTransposed && (
          transposedRx.sphere >= sphereMin &&
          transposedRx.sphere <= sphereMax &&
          Math.abs(transposedRx.cylinder) <= cylMax
        );

        return originalFits || transposedFits;
      });
    }

    return result;
  }, [products, textSearch, filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (productId: number) => {
    onChange(productId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setTextSearch('');
  };

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      {/* Filters row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value || undefined })}
            disabled={disabled}
            className="w-full h-8 px-2 text-xs border border-surface-border bg-surface focus:outline-none focus:border-accent"
          >
            <option value="">Tous</option>
            <option value="bluefilter">Filtre bleu</option>
            <option value="photochromique">Photochromique</option>
            <option value="antireflet">Anti-reflet</option>
            <option value="progressif">Progressif</option>
            <option value="unifocal">Unifocal</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Sphère</label>
          <input
            type="number"
            step="0.25"
            value={filters.sphere ?? ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              sphere: e.target.value ? parseFloat(e.target.value) : undefined
            })}
            placeholder="ex: -2.00"
            disabled={disabled}
            className="w-full h-8 px-2 text-xs border border-surface-border bg-surface focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Cylindre</label>
          <input
            type="number"
            step="0.25"
            value={filters.cylinder ?? ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              cylinder: e.target.value ? parseFloat(e.target.value) : undefined
            })}
            placeholder="ex: -1.00"
            disabled={disabled}
            className="w-full h-8 px-2 text-xs border border-surface-border bg-surface focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer h-8">
            <input
              type="checkbox"
              checked={filters.includeTransposed ?? true}
              onChange={(e) => onFiltersChange({ ...filters, includeTransposed: e.target.checked })}
              disabled={disabled}
              className="w-4 h-4 accent-accent"
            />
            <span>+ Transposition</span>
          </label>
        </div>
      </div>

      {/* Transposition explanation */}
      {filters.sphere !== undefined && filters.cylinder !== undefined && filters.includeTransposed && (
        <div className="text-xs text-text-muted bg-cream px-2 py-1 border border-surface-border">
          Recherche: {filters.sphere >= 0 ? '+' : ''}{filters.sphere?.toFixed(2)} / {filters.cylinder >= 0 ? '+' : ''}{filters.cylinder?.toFixed(2)}
          {' '}⟺{' '}
          {(filters.sphere + filters.cylinder) >= 0 ? '+' : ''}{(filters.sphere + filters.cylinder).toFixed(2)} / {(-filters.cylinder) >= 0 ? '+' : ''}{(-filters.cylinder).toFixed(2)}
          {' '}(transposé)
        </div>
      )}

      {/* Product selector */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full h-9 px-3 py-2',
          'border border-surface-border bg-surface text-sm text-left',
          'hover:border-accent/50 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cream',
          error && 'border-danger',
          isOpen && 'border-accent ring-1 ring-accent'
        )}
      >
        <span className={cn(
          'truncate',
          selectedProduct ? 'text-text-primary' : 'text-text-muted'
        )}>
          {selectedProduct
            ? `${selectedProduct.nom} • ${formatCurrency(selectedProduct.prix_vente)}`
            : placeholder
          }
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedProduct && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-cream rounded transition-colors"
            >
              <X className="h-3.5 w-3.5 text-text-muted" />
            </span>
          )}
          <ChevronDown className={cn(
            'h-4 w-4 text-text-muted transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="border border-surface-border bg-surface shadow-lg max-h-60 overflow-hidden">
          {/* Text search */}
          <div className="p-2 border-b border-surface-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                placeholder="Rechercher par nom, référence..."
                className={cn(
                  'w-full h-8 pl-8 pr-3 text-sm',
                  'border border-surface-border bg-cream',
                  'placeholder:text-text-muted',
                  'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent'
                )}
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-44 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="px-3 py-4 text-sm text-text-muted text-center">
                Aucun verre trouvé
              </div>
            ) : (
              <>
                <div className="px-3 py-1 text-xs text-text-muted bg-cream border-b border-surface-border">
                  {filteredProducts.length} verre{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
                </div>
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product.id)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-left text-sm',
                      'hover:bg-cream transition-colors border-b border-surface-border last:border-b-0',
                      product.id === value && 'bg-accent-light'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary truncate">
                          {product.nom}
                        </span>
                        {product.id === value && (
                          <Check className="h-4 w-4 text-accent shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {product.verre?.type_verre && (
                          <Badge variant="info" className="text-[10px] px-1.5 py-0">
                            {product.verre.type_verre}
                          </Badge>
                        )}
                        {product.verre?.indice && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            {product.verre.indice}
                          </Badge>
                        )}
                        {product.verre?.traitements?.map(t => (
                          <Badge key={t} variant="default" className="text-[10px] px-1.5 py-0">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="font-medium text-text-primary">
                        {formatCurrency(product.prix_vente)}
                      </div>
                      <div className={cn(
                        'text-xs',
                        product.quantite > product.stock_minimum
                          ? 'text-success'
                          : product.quantite > 0
                            ? 'text-warning'
                            : 'text-danger'
                      )}>
                        Stock: {product.quantite}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
