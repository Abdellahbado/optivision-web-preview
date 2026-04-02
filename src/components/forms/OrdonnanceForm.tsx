import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button, Input, Textarea, Modal, Select } from '@/components/ui';
import type { OrdonnanceInput } from '@/types';

interface OrdonnanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrdonnanceInput) => Promise<void>;
  clientId: number;
  clientName: string;
  initialData?: Partial<OrdonnanceInput>;
}

export function OrdonnanceForm({ isOpen, onClose, onSubmit, clientId, clientName, initialData }: OrdonnanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<OrdonnanceInput>({
    client_id: clientId,
    date_prescription: initialData?.date_prescription || today,
    medecin: initialData?.medecin || '',
    od_sphere: initialData?.od_sphere,
    od_cylindre: initialData?.od_cylindre,
    od_axe: initialData?.od_axe,
    od_addition: initialData?.od_addition,
    og_sphere: initialData?.og_sphere,
    og_cylindre: initialData?.og_cylindre,
    og_axe: initialData?.og_axe,
    og_addition: initialData?.og_addition,
    ecart_pupillaire: initialData?.ecart_pupillaire,
    ecart_vl: initialData?.ecart_vl,
    ecart_vp: initialData?.ecart_vp,
    type_vision: initialData?.type_vision,
    notes: initialData?.notes || '',
  });

  const handleChange = (field: keyof OrdonnanceInput, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof OrdonnanceInput, value: string) => {
    const num = value === '' ? undefined : parseFloat(value);
    handleChange(field, num);
  };

  const handleIntChange = (field: keyof OrdonnanceInput, value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    handleChange(field, num);
  };

  const copyOdToOg = () => {
    setFormData(prev => ({
      ...prev,
      og_sphere: prev.od_sphere,
      og_cylindre: prev.od_cylindre,
      og_axe: prev.od_axe,
      og_addition: prev.od_addition,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date_prescription) {
      setError('La date est obligatoire');
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle ordonnance" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-[10px] bg-danger-light text-danger text-sm">
            {error}
          </div>
        )}

        <div className="p-3 rounded-[10px] bg-accent-light">
          <p className="text-sm text-accent">
            Client: <strong>{clientName}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de prescription *"
            type="date"
            value={formData.date_prescription}
            onChange={(e) => handleChange('date_prescription', e.target.value)}
          />
          <Input
            label="Médecin prescripteur"
            value={formData.medecin || ''}
            onChange={(e) => handleChange('medecin', e.target.value)}
            placeholder="Dr. ..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-primary">Œil Droit (OD)</h3>
            <Button type="button" variant="ghost" size="sm" onClick={copyOdToOg}>
              <Copy className="h-4 w-4 mr-1" />
              Copier vers OG
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input
              label="Sphère"
              type="number"
              step="0.25"
              value={formData.od_sphere ?? ''}
              onChange={(e) => handleNumberChange('od_sphere', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Cylindre"
              type="number"
              step="0.25"
              value={formData.od_cylindre ?? ''}
              onChange={(e) => handleNumberChange('od_cylindre', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Axe (°)"
              type="number"
              min="0"
              max="180"
              value={formData.od_axe ?? ''}
              onChange={(e) => handleIntChange('od_axe', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Addition"
              type="number"
              step="0.25"
              min="0"
              max="4"
              value={formData.od_addition ?? ''}
              onChange={(e) => handleNumberChange('od_addition', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-text-primary">Œil Gauche (OG)</h3>
          <div className="grid grid-cols-4 gap-3">
            <Input
              label="Sphère"
              type="number"
              step="0.25"
              value={formData.og_sphere ?? ''}
              onChange={(e) => handleNumberChange('og_sphere', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Cylindre"
              type="number"
              step="0.25"
              value={formData.og_cylindre ?? ''}
              onChange={(e) => handleNumberChange('og_cylindre', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Axe (°)"
              type="number"
              min="0"
              max="180"
              value={formData.og_axe ?? ''}
              onChange={(e) => handleIntChange('og_axe', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Addition"
              type="number"
              step="0.25"
              min="0"
              max="4"
              value={formData.og_addition ?? ''}
              onChange={(e) => handleNumberChange('og_addition', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Input
            label="Écart pupillaire"
            type="number"
            step="0.5"
            value={formData.ecart_pupillaire ?? ''}
            onChange={(e) => handleNumberChange('ecart_pupillaire', e.target.value)}
            placeholder="63"
          />
          <Input
            label="EP Vision Loin"
            type="number"
            step="0.5"
            value={formData.ecart_vl ?? ''}
            onChange={(e) => handleNumberChange('ecart_vl', e.target.value)}
            placeholder="32"
          />
          <Input
            label="EP Vision Près"
            type="number"
            step="0.5"
            value={formData.ecart_vp ?? ''}
            onChange={(e) => handleNumberChange('ecart_vp', e.target.value)}
            placeholder="30"
          />
          <Select
            label="Type de vision"
            value={formData.type_vision || ''}
            onChange={(e) => handleChange('type_vision', e.target.value as 'VL' | 'VP' | 'VL+VP' | undefined)}
            options={[
              { value: '', label: '-- Sélectionner --' },
              { value: 'VL', label: 'Vision de loin (VL)' },
              { value: 'VP', label: 'Vision de près (VP)' },
              { value: 'VL+VP', label: 'Progressif (VL+VP)' },
            ]}
          />
        </div>

        <Textarea
          label="Notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Notes supplémentaires..."
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
