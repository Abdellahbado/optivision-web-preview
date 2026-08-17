import { useState } from 'react';
import { Tabs } from '@/components/layout/Tabs';
import { useAppDataStore } from '@/stores/appDataStore';
import { CommandesPage } from './CommandesPage';
import { ListeVerresPage } from './ListeVerresPage';

/** Commandes: le suivi du travail, et le bon de commande fournisseur du jour. */
export function AtelierPage() {
  const [onglet, setOnglet] = useState('suivi');
  const commandes = useAppDataStore((state) => state.commandes);
  const listeItems = useAppDataStore((state) => state.listeItems);
  const listesVerres = useAppDataStore((state) => state.listesVerres);

  const enCours = commandes.filter(
    (commande) => !['DLV', 'CAN'].includes(commande.statut)
  ).length;

  const listeDuJour = listesVerres.find(
    (liste) => liste.date === new Date().toISOString().slice(0, 10)
  );
  const aCommander = listeDuJour
    ? listeItems.filter((item) => item.liste_id === listeDuJour.id && !item.en_stock).length
    : 0;

  return (
    <div className="space-y-5">
      <Tabs
        tabs={[
          { id: 'suivi', label: 'Suivi des commandes', badge: enCours },
          { id: 'verres', label: 'Verres à commander', badge: aCommander },
        ]}
        active={onglet}
        onChange={setOnglet}
      />
      {onglet === 'suivi' && <CommandesPage />}
      {onglet === 'verres' && <ListeVerresPage />}
    </div>
  );
}
