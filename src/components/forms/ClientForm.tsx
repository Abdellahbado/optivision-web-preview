import { useState, useEffect, useCallback } from 'react';
import { Search, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { Button, Input, Textarea, Modal } from '@/components/ui';
import type { ClientInput, Client } from '@/types';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientInput) => Promise<void>;
  initialData?: Partial<Client>;
  title?: string;
  existingClients?: Client[]; // For duplicate checking
  onClientFound?: (client: Client) => void; // Callback when existing client found
}

// Normalize phone number for comparison (remove spaces, dashes, etc.)
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\.\(\)]/g, '');
}

// Simple similarity check for names (Levenshtein-like)
function nameSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Check common variations (Mohamed/Mohammed, Amine/Amin, etc.)
  const variations: Record<string, string[]> = {
    'mohamed': ['mohammed', 'mouhamed', 'mouhammed', 'muhamed', 'muhammad'],
    'ahmed': ['ahmad', 'ahmet'],
    'amine': ['amin', 'ameen'],
    'youssef': ['youssouf', 'yousef', 'yusuf', 'yousf'],
    'karim': ['kareem', 'kerim'],
    'fatima': ['fatma', 'fatouma'],
    'khadija': ['khadidja', 'khadidga'],
  };
  
  for (const [base, vars] of Object.entries(variations)) {
    const allVariants = [base, ...vars];
    if (allVariants.includes(s1) && allVariants.includes(s2)) {
      return 0.9;
    }
  }
  
  // Simple character overlap
  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  const intersection = [...set1].filter(c => set2.has(c)).length;
  return intersection / Math.max(set1.size, set2.size);
}

interface DuplicateCandidate {
  client: Client;
  matchType: 'phone_exact' | 'phone_similar' | 'name_similar';
  confidence: number;
}

export function ClientForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  title = 'Nouveau client',
  existingClients = [],
  onClientFound
}: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [phoneLookupDone, setPhoneLookupDone] = useState(false);
  const [showForm, setShowForm] = useState(!!initialData); // Show form immediately if editing
  
  const [formData, setFormData] = useState<ClientInput>({
    prenom: initialData?.prenom || '',
    nom: initialData?.nom || '',
    telephone: initialData?.telephone || '',
    telephone2: initialData?.telephone2 || '',
    email: initialData?.email || '',
    adresse: initialData?.adresse || '',
    ville: initialData?.ville || '',
    date_naissance: initialData?.date_naissance || '',
    notes: initialData?.notes || '',
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        prenom: initialData?.prenom || '',
        nom: initialData?.nom || '',
        telephone: initialData?.telephone || '',
        telephone2: initialData?.telephone2 || '',
        email: initialData?.email || '',
        adresse: initialData?.adresse || '',
        ville: initialData?.ville || '',
        date_naissance: initialData?.date_naissance || '',
        notes: initialData?.notes || '',
      });
      setDuplicates([]);
      setError(null);
      setPhoneLookupDone(!!initialData);
      setShowForm(!!initialData);
    }
  }, [isOpen, initialData]);

  // Check for duplicates when phone changes
  const checkDuplicates = useCallback((phone: string, firstName: string, lastName: string) => {
    if (!phone || phone.length < 6) {
      setDuplicates([]);
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const candidates: DuplicateCandidate[] = [];

    for (const client of existingClients) {
      // Skip if editing the same client
      if (initialData?.id && client.id === initialData.id) continue;

      const clientPhone = normalizePhone(client.telephone);
      const clientPhone2 = client.telephone2 ? normalizePhone(client.telephone2) : '';

      // Exact phone match
      if (clientPhone === normalizedPhone || clientPhone2 === normalizedPhone) {
        candidates.push({
          client,
          matchType: 'phone_exact',
          confidence: 1
        });
        continue;
      }

      // Similar phone (one digit difference or partial match)
      if (normalizedPhone.length >= 8) {
        if (clientPhone.includes(normalizedPhone.slice(-8)) || 
            normalizedPhone.includes(clientPhone.slice(-8))) {
          candidates.push({
            client,
            matchType: 'phone_similar',
            confidence: 0.7
          });
          continue;
        }
      }

      // Name similarity check (only if names are provided)
      if (firstName && lastName) {
        const firstNameSim = nameSimilarity(firstName, client.prenom);
        const lastNameSim = nameSimilarity(lastName, client.nom);
        const avgSim = (firstNameSim + lastNameSim) / 2;
        
        if (avgSim >= 0.7) {
          candidates.push({
            client,
            matchType: 'name_similar',
            confidence: avgSim
          });
        }
      }
    }

    // Sort by confidence
    candidates.sort((a, b) => b.confidence - a.confidence);
    setDuplicates(candidates.slice(0, 3)); // Show top 3
  }, [existingClients, initialData?.id]);

  const handlePhoneLookup = () => {
    if (!formData.telephone.trim()) {
      setError('Entrez un numéro de téléphone pour rechercher');
      return;
    }
    
    checkDuplicates(formData.telephone, formData.prenom, formData.nom);
    setPhoneLookupDone(true);
    
    // If exact match found, show it prominently
    const exactMatch = duplicates.find(d => d.matchType === 'phone_exact');
    if (exactMatch && onClientFound) {
      // Don't auto-redirect, let user decide
    }
    
    setShowForm(true);
  };

  const handleChange = (field: keyof ClientInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    // Re-check duplicates when name changes (if phone already entered)
    if ((field === 'prenom' || field === 'nom') && phoneLookupDone) {
      const newFirst = field === 'prenom' ? value : formData.prenom;
      const newLast = field === 'nom' ? value : formData.nom;
      checkDuplicates(formData.telephone, newFirst, newLast);
    }
  };

  const handleUseExisting = (client: Client) => {
    if (onClientFound) {
      onClientFound(client);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prenom.trim()) {
      setError('Le prénom est obligatoire');
      return;
    }
    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!formData.telephone.trim()) {
      setError('Le téléphone est obligatoire');
      return;
    }

    // Warn about exact phone duplicate
    const exactDupe = duplicates.find(d => d.matchType === 'phone_exact');
    if (exactDupe && !initialData) {
      setError(`Ce numéro appartient déjà à ${exactDupe.client.prenom} ${exactDupe.client.nom}. Utilisez le client existant ou changez le numéro.`);
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
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-light text-danger text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Phone Lookup (for new clients only) */}
        {!initialData && !showForm && (
          <div className="space-y-4">
            <div className="p-4 bg-info-light border border-info/20">
              <p className="text-sm text-info font-medium mb-1">Étape 1: Recherche par téléphone</p>
              <p className="text-sm text-text-secondary">
                Entrez le numéro de téléphone pour vérifier si le client existe déjà.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                label="Numéro de téléphone"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                placeholder="0555 12 34 56"
                className="flex-1"
              />
              <Button 
                onClick={handlePhoneLookup}
                className="mt-6"
              >
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        )}

        {/* Duplicate warnings */}
        {duplicates.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-warning flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Client(s) similaire(s) trouvé(s):
            </p>
            {duplicates.map((dup) => (
              <div 
                key={dup.client.id}
                className="p-3 border border-warning/30 bg-warning-light flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-warning p-1.5 bg-warning/20" />
                  <div>
                    <p className="font-medium text-text-primary">
                      {dup.client.prenom} {dup.client.nom}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {dup.client.telephone}
                      {dup.matchType === 'phone_exact' && (
                        <span className="ml-2 text-danger font-medium">• Même numéro</span>
                      )}
                      {dup.matchType === 'name_similar' && (
                        <span className="ml-2 text-warning">• Nom similaire</span>
                      )}
                    </p>
                  </div>
                </div>
                {onClientFound && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUseExisting(dup.client)}
                  >
                    Utiliser ce client
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No duplicates found message */}
        {phoneLookupDone && duplicates.length === 0 && !initialData && (
          <div className="p-3 bg-success-light border border-success/20 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-success">Aucun client existant trouvé. Vous pouvez créer un nouveau client.</span>
          </div>
        )}

        {/* Main Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                value={formData.prenom}
                onChange={(e) => handleChange('prenom', e.target.value)}
                placeholder="Prénom du client"
              />
              <Input
                label="Nom *"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Nom du client"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Téléphone *"
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                placeholder="0555 12 34 56"
                disabled={!initialData && phoneLookupDone} // Lock phone after lookup
              />
              <Input
                label="Téléphone 2 (optionnel)"
                value={formData.telephone2 || ''}
                onChange={(e) => handleChange('telephone2', e.target.value)}
                placeholder="Téléphone secondaire"
              />
            </div>

            <Input
              label="Email (optionnel)"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemple.com"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Adresse (optionnel)"
                value={formData.adresse || ''}
                onChange={(e) => handleChange('adresse', e.target.value)}
                placeholder="Adresse"
              />
              <Input
                label="Ville (optionnel)"
                value={formData.ville || ''}
                onChange={(e) => handleChange('ville', e.target.value)}
                placeholder="Ville"
              />
            </div>

            <Input
              label="Date de naissance (optionnel)"
              type="date"
              value={formData.date_naissance || ''}
              onChange={(e) => handleChange('date_naissance', e.target.value)}
            />

            <Textarea
              label="Notes (optionnel)"
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
                {loading ? 'Enregistrement...' : initialData?.id ? 'Modifier' : 'Créer le client'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
