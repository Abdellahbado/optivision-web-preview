/**
 * Vocabulaire affiche a l'ecran.
 *
 * Regle: les codes (NEW, ORD, MON, ESP...) restent dans les donnees,
 * jamais dans l'interface. Un seul endroit pour les traduire.
 */
import type {
  CategorieType,
  CommandeStatut,
  FactureStatut,
  PaymentMethod,
} from '@/types';

type Ton = 'neutre' | 'attente' | 'action' | 'pret' | 'termine' | 'alerte';

export const STATUT_COMMANDE: Record<
  CommandeStatut,
  { label: string; court: string; ton: Ton }
> = {
  NEW: { label: 'À préparer', court: 'À préparer', ton: 'attente' },
  ORD: { label: 'Verres commandés', court: 'Commandés', ton: 'action' },
  RCV: { label: 'Verres reçus', court: 'Reçus', ton: 'action' },
  ASM: { label: 'Au montage', court: 'Montage', ton: 'action' },
  RDY: { label: 'Prête — prévenir le client', court: 'Prête', ton: 'pret' },
  DLV: { label: 'Livrée', court: 'Livrée', ton: 'termine' },
  CAN: { label: 'Annulée', court: 'Annulée', ton: 'neutre' },
};

/** Ordre reel du travail en magasin. */
export const PARCOURS_COMMANDE: CommandeStatut[] = [
  'NEW',
  'ORD',
  'RCV',
  'ASM',
  'RDY',
  'DLV',
];

export const STATUT_FACTURE: Record<FactureStatut, { label: string; ton: Ton }> = {
  DRAFT: { label: 'À encaisser', ton: 'attente' },
  SENT: { label: 'À encaisser', ton: 'attente' },
  PARTIAL: { label: 'Payée en partie', ton: 'action' },
  PAID: { label: 'Payée', ton: 'termine' },
  OVERDUE: { label: 'Impayée', ton: 'alerte' },
  CANCELLED: { label: 'Annulée', ton: 'neutre' },
};

export const CATEGORIE: Record<CategorieType, { label: string; pluriel: string }> = {
  MON: { label: 'Monture', pluriel: 'Montures' },
  VER: { label: 'Verre', pluriel: 'Verres' },
  LEN: { label: 'Lentille', pluriel: 'Lentilles' },
  ACC: { label: 'Accessoire', pluriel: 'Accessoires' },
  SRV: { label: 'Service', pluriel: 'Services' },
};

export const MODE_PAIEMENT: Record<PaymentMethod, string> = {
  ESP: 'Espèces',
  CB: 'Carte',
  CHQ: 'Chèque',
  VIR: 'Virement',
  AUT: 'Autre',
};

export const MODE_PAIEMENT_OPTIONS = (
  Object.keys(MODE_PAIEMENT) as PaymentMethod[]
).map((value) => ({ value, label: MODE_PAIEMENT[value] }));

const BADGE_PAR_TON: Record<Ton, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  neutre: 'default',
  attente: 'warning',
  action: 'info',
  pret: 'success',
  termine: 'success',
  alerte: 'danger',
};

export function badgeVariant(ton: Ton) {
  return BADGE_PAR_TON[ton];
}
