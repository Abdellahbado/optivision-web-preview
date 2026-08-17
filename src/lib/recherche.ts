import type { Client } from '@/types';

/** Ne garde que les chiffres: «0770 88 44 22» et «0770884422» doivent se valoir. */
export function chiffresSeuls(valeur?: string): string {
  return (valeur || '').replace(/\D/g, '');
}

export function dateFr(valeur?: string): string {
  if (!valeur) return '';
  const [annee, mois, jour] = valeur.split('-');
  if (!annee || !mois || !jour) return valeur;
  return `${jour}/${mois}/${annee}`;
}

/**
 * Un seul comportement de recherche client dans toute l'application:
 * nom, prenom, code, telephone (avec ou sans espaces) et date de naissance
 * (12/05/1980, 1980-05-12 ou 1980).
 */
export function clientCorrespond(client: Client, recherche: string): boolean {
  const terme = recherche.trim().toLowerCase();
  if (!terme) return true;

  const chiffres = chiffresSeuls(recherche);
  const complet = `${client.prenom} ${client.nom}`.toLowerCase();
  const inverse = `${client.nom} ${client.prenom}`.toLowerCase();

  if (
    client.nom.toLowerCase().includes(terme) ||
    client.prenom.toLowerCase().includes(terme) ||
    complet.includes(terme) ||
    inverse.includes(terme) ||
    (client.code || '').toLowerCase().includes(terme) ||
    (client.email || '').toLowerCase().includes(terme) ||
    (client.ville || '').toLowerCase().includes(terme)
  ) {
    return true;
  }

  if (chiffres.length >= 3) {
    const tel = chiffresSeuls(client.telephone);
    const tel2 = chiffresSeuls(client.telephone2 || '');
    if (tel.includes(chiffres) || tel2.includes(chiffres)) return true;
  }

  const naissance = (client.date_naissance || '').toLowerCase();
  if (naissance) {
    if (naissance.includes(terme)) return true;
    if (dateFr(client.date_naissance).toLowerCase().includes(terme)) return true;
    if (chiffres.length >= 4 && chiffresSeuls(client.date_naissance).includes(chiffres)) {
      return true;
    }
  }

  return false;
}
