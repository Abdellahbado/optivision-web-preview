import { useState, useEffect } from 'react';
import { Button, Input, Textarea, Modal, Select } from '@/components/ui';
import type { 
  ProduitInput, 
  CategorieType, 
  MontureFields, 
  VerreFields, 
  LentilleFields, 
  AccessoireFields, 
  ServiceFields 
} from '@/types';
import {
  MONTURE_MATERIAUX,
  MONTURE_FORMES,
  MONTURE_GENRES,
  VERRE_TYPES,
  VERRE_INDICES,
  VERRE_MATIERES,
  VERRE_TRAITEMENTS,
  LENTILLE_TYPES,
  ACCESSOIRE_TYPES,
  SERVICE_TYPES,
} from '@/types/produit';

interface ProduitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProduitInput) => Promise<void>;
  initialData?: Partial<ProduitInput>;
}

const categorieOptions = [
  { value: 'MON', label: 'Monture' },
  { value: 'VER', label: 'Verre' },
  { value: 'LEN', label: 'Lentille' },
  { value: 'ACC', label: 'Accessoire' },
  { value: 'SRV', label: 'Service' },
];

export function ProduitForm({ isOpen, onClose, onSubmit, initialData }: ProduitFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProduitInput>({
    reference: initialData?.reference || '',
    nom: initialData?.nom || '',
    categorie: initialData?.categorie || 'MON',
    marque: initialData?.marque || '',
    modele: initialData?.modele || '',
    couleur: initialData?.couleur || '',
    taille: initialData?.taille || '',
    matiere: initialData?.matiere || '',
    prix_achat: initialData?.prix_achat,
    prix_vente: initialData?.prix_vente || 0,
    quantite: initialData?.quantite || 0,
    stock_minimum: initialData?.stock_minimum || 5,
    notes: initialData?.notes || '',
    monture: initialData?.monture || {},
    verre: initialData?.verre || {},
    lentille: initialData?.lentille || {},
    accessoire: initialData?.accessoire || {},
    service: initialData?.service || {},
  });

  const [selectedTraitements, setSelectedTraitements] = useState<string[]>(
    initialData?.verre?.traitements || []
  );

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        reference: initialData.reference || '',
        nom: initialData.nom || '',
        categorie: initialData.categorie || 'MON',
        marque: initialData.marque || '',
        modele: initialData.modele || '',
        couleur: initialData.couleur || '',
        taille: initialData.taille || '',
        matiere: initialData.matiere || '',
        prix_achat: initialData.prix_achat,
        prix_vente: initialData.prix_vente || 0,
        quantite: initialData.quantite || 0,
        stock_minimum: initialData.stock_minimum || 5,
        notes: initialData.notes || '',
        monture: initialData.monture || {},
        verre: initialData.verre || {},
        lentille: initialData.lentille || {},
        accessoire: initialData.accessoire || {},
        service: initialData.service || {},
      });
      setSelectedTraitements(initialData.verre?.traitements || []);
    } else if (isOpen && !initialData) {
      setFormData({
        reference: '',
        nom: '',
        categorie: 'MON',
        marque: '',
        modele: '',
        couleur: '',
        taille: '',
        matiere: '',
        prix_achat: undefined,
        prix_vente: 0,
        quantite: 0,
        stock_minimum: 5,
        notes: '',
        monture: {},
        verre: {},
        lentille: {},
        accessoire: {},
        service: {},
      });
      setSelectedTraitements([]);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof ProduitInput, value: string | number | CategorieType | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleMontureChange = (field: keyof MontureFields, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      monture: { ...prev.monture, [field]: value }
    }));
  };

  const handleVerreChange = (field: keyof VerreFields, value: string | number | string[] | undefined) => {
    setFormData(prev => ({
      ...prev,
      verre: { ...prev.verre, [field]: value }
    }));
  };

  const handleLentilleChange = (field: keyof LentilleFields, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      lentille: { ...prev.lentille, [field]: value }
    }));
  };

  const handleAccessoireChange = (field: keyof AccessoireFields, value: AccessoireFields[keyof AccessoireFields]) => {
    setFormData(prev => ({
      ...prev,
      accessoire: { ...prev.accessoire, [field]: value } as AccessoireFields
    }));
  };

  const handleServiceChange = (field: keyof ServiceFields, value: ServiceFields[keyof ServiceFields]) => {
    setFormData(prev => ({
      ...prev,
      service: { ...prev.service, [field]: value } as ServiceFields
    }));
  };

  const toggleTraitement = (traitement: string) => {
    const newTraitements = selectedTraitements.includes(traitement)
      ? selectedTraitements.filter(t => t !== traitement)
      : [...selectedTraitements, traitement];
    setSelectedTraitements(newTraitements);
    handleVerreChange('traitements', newTraitements);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reference.trim()) {
      setError('La référence est obligatoire');
      return;
    }
    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!formData.prix_vente || formData.prix_vente <= 0) {
      setError('Le prix de vente doit être supérieur à 0');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderMontureFields = () => (
    <div className="space-y-3 pt-3 border-t border-surface-border">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Caractéristiques monture</p>
      <div className="grid grid-cols-3 gap-3">
        <Select
          label="Matériau"
          value={formData.monture?.materiau || ''}
          onChange={(e) => handleMontureChange('materiau', e.target.value || undefined)}
          options={[{ value: '', label: 'Sélectionner' }, ...MONTURE_MATERIAUX]}
        />
        <Select
          label="Forme"
          value={formData.monture?.forme || ''}
          onChange={(e) => handleMontureChange('forme', e.target.value || undefined)}
          options={[{ value: '', label: 'Sélectionner' }, ...MONTURE_FORMES]}
        />
        <Select
          label="Genre"
          value={formData.monture?.genre || ''}
          onChange={(e) => handleMontureChange('genre', e.target.value || undefined)}
          options={[{ value: '', label: 'Sélectionner' }, ...MONTURE_GENRES]}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Largeur verre (mm)"
          type="number"
          value={formData.monture?.largeur_verre ?? ''}
          onChange={(e) => handleMontureChange('largeur_verre', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="52"
        />
        <Input
          label="Largeur pont (mm)"
          type="number"
          value={formData.monture?.largeur_pont ?? ''}
          onChange={(e) => handleMontureChange('largeur_pont', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="18"
        />
        <Input
          label="Longueur branche (mm)"
          type="number"
          value={formData.monture?.longueur_branche ?? ''}
          onChange={(e) => handleMontureChange('longueur_branche', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="140"
        />
      </div>
    </div>
  );

  const renderVerreFields = () => (
    <div className="space-y-3 pt-3 border-t border-surface-border">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Caractéristiques verre</p>
      <div className="grid grid-cols-3 gap-3">
        <Select
          label="Type de verre"
          value={formData.verre?.type_verre || ''}
          onChange={(e) => handleVerreChange('type_verre', e.target.value || undefined)}
          options={[{ value: '', label: 'Sélectionner' }, ...VERRE_TYPES]}
        />
        <Select
          label="Indice"
          value={formData.verre?.indice?.toString() || ''}
          onChange={(e) => handleVerreChange('indice', e.target.value ? parseFloat(e.target.value) : undefined)}
          options={[{ value: '', label: 'Sélectionner' }, ...VERRE_INDICES.map(i => ({ value: i.value.toString(), label: i.label }))]}
        />
        <Select
          label="Matière"
          value={formData.verre?.matiere_verre || ''}
          onChange={(e) => handleVerreChange('matiere_verre', e.target.value || undefined)}
          options={[{ value: '', label: 'Sélectionner' }, ...VERRE_MATIERES]}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Diamètre (mm)"
          type="number"
          value={formData.verre?.diametre ?? ''}
          onChange={(e) => handleVerreChange('diametre', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="65"
        />
        <Input
          label="Sphère min"
          type="number"
          step="0.25"
          value={formData.verre?.sphere_min ?? ''}
          onChange={(e) => handleVerreChange('sphere_min', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="-12.00"
        />
        <Input
          label="Sphère max"
          type="number"
          step="0.25"
          value={formData.verre?.sphere_max ?? ''}
          onChange={(e) => handleVerreChange('sphere_max', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="+8.00"
        />
      </div>
      <div>
        <p className="text-xs font-medium text-text-secondary mb-2">Traitements</p>
        <div className="flex flex-wrap gap-2">
          {VERRE_TRAITEMENTS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTraitement(t.value)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                selectedTraitements.includes(t.value)
                  ? 'bg-text-primary border-text-primary text-white'
                  : 'border-surface-border text-text-secondary hover:bg-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLentilleFields = () => (
    <div className="space-y-3 pt-3 border-t border-surface-border">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Caractéristiques lentille</p>
      <div className="grid grid-cols-3 gap-3">
        <Select
          label="Type de lentille"
          value={formData.lentille?.type_lentille || ''}
          onChange={(e) => handleLentilleChange('type_lentille', e.target.value || undefined)}
          options={[{ value: '', label: 'Sélectionner' }, ...LENTILLE_TYPES]}
        />
        <Input
          label="Rayon courbure (BC)"
          type="number"
          step="0.1"
          value={formData.lentille?.rayon_courbure ?? ''}
          onChange={(e) => handleLentilleChange('rayon_courbure', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="8.6"
        />
        <Input
          label="Diamètre (mm)"
          type="number"
          step="0.1"
          value={formData.lentille?.diametre_lentille ?? ''}
          onChange={(e) => handleLentilleChange('diametre_lentille', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="14.2"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Teneur eau (%)"
          type="number"
          value={formData.lentille?.teneur_eau ?? ''}
          onChange={(e) => handleLentilleChange('teneur_eau', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="58"
        />
        <Input
          label="Sphère min"
          type="number"
          step="0.25"
          value={formData.lentille?.sphere_min ?? ''}
          onChange={(e) => handleLentilleChange('sphere_min', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="-12.00"
        />
        <Input
          label="Sphère max"
          type="number"
          step="0.25"
          value={formData.lentille?.sphere_max ?? ''}
          onChange={(e) => handleLentilleChange('sphere_max', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="+8.00"
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={formData.lentille?.cylindre_disponible || false}
            onChange={(e) => handleLentilleChange('cylindre_disponible', e.target.checked)}
            className="w-4 h-4 rounded border-surface-border"
          />
          Cylindre disponible
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={formData.lentille?.multifocale || false}
            onChange={(e) => handleLentilleChange('multifocale', e.target.checked)}
            className="w-4 h-4 rounded border-surface-border"
          />
          Multifocale
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={formData.lentille?.couleur_disponible || false}
            onChange={(e) => handleLentilleChange('couleur_disponible', e.target.checked)}
            className="w-4 h-4 rounded border-surface-border"
          />
          Couleurs disponibles
        </label>
      </div>
    </div>
  );

  const renderAccessoireFields = () => (
    <div className="space-y-3 pt-3 border-t border-surface-border">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Caractéristiques accessoire</p>
      <Select
        label="Type d'accessoire"
        value={formData.accessoire?.type_accessoire || ''}
        onChange={(e) => handleAccessoireChange('type_accessoire', (e.target.value || undefined) as AccessoireFields['type_accessoire'])}
        options={[{ value: '', label: 'Sélectionner' }, ...ACCESSOIRE_TYPES]}
      />
    </div>
  );

  const renderServiceFields = () => (
    <div className="space-y-3 pt-3 border-t border-surface-border">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Caractéristiques service</p>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type de service"
          value={formData.service?.type_service || ''}
          onChange={(e) => handleServiceChange('type_service', (e.target.value || undefined) as ServiceFields['type_service'])}
          options={[{ value: '', label: 'Sélectionner' }, ...SERVICE_TYPES]}
        />
        <Input
          label="Durée (minutes)"
          type="number"
          value={formData.service?.duree_minutes ?? ''}
          onChange={(e) => handleServiceChange('duree_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="30"
        />
      </div>
    </div>
  );

  const renderCategoryFields = () => {
    switch (formData.categorie) {
      case 'MON':
        return renderMontureFields();
      case 'VER':
        return renderVerreFields();
      case 'LEN':
        return renderLentilleFields();
      case 'ACC':
        return renderAccessoireFields();
      case 'SRV':
        return renderServiceFields();
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Modifier produit' : 'Nouveau produit'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-danger-light text-danger text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Référence *"
            value={formData.reference}
            onChange={(e) => handleChange('reference', e.target.value)}
            placeholder="REF-001"
          />
          <Select
            label="Catégorie *"
            value={formData.categorie}
            onChange={(e) => handleChange('categorie', e.target.value as CategorieType)}
            options={categorieOptions}
          />
        </div>

        <Input
          label="Nom *"
          value={formData.nom}
          onChange={(e) => handleChange('nom', e.target.value)}
          placeholder="Nom du produit"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Marque"
            value={formData.marque || ''}
            onChange={(e) => handleChange('marque', e.target.value)}
            placeholder="Marque"
          />
          <Input
            label="Couleur"
            value={formData.couleur || ''}
            onChange={(e) => handleChange('couleur', e.target.value)}
            placeholder="Couleur"
          />
        </div>

        {/* Category-specific fields */}
        {renderCategoryFields()}

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-border">
          <Input
            label="Prix d'achat (DA)"
            type="number"
            value={formData.prix_achat ?? ''}
            onChange={(e) => handleChange('prix_achat', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0.00"
          />
          <Input
            label="Prix de vente (DA) *"
            type="number"
            value={formData.prix_vente || ''}
            onChange={(e) => handleChange('prix_vente', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantité en stock"
            type="number"
            value={formData.quantite}
            onChange={(e) => handleChange('quantite', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
          <Input
            label="Stock minimum"
            type="number"
            value={formData.stock_minimum}
            onChange={(e) => handleChange('stock_minimum', parseInt(e.target.value) || 5)}
            placeholder="5"
          />
        </div>

        <Textarea
          label="Notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Notes supplémentaires..."
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : initialData ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
