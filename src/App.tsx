import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import {
  DashboardPage,
  AccueilClientPage,
  ClientsPage,
  OrdonnancesPage,
  ProduitsPage,
  CommandesPage,
  FacturesPage,
  RapportsPage,
  ParametresPage,
  SauvegardePage,
  ListeVerresPage,
} from "@/pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="accueil-client" element={<AccueilClientPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="ordonnances" element={<OrdonnancesPage />} />
        <Route path="produits" element={<ProduitsPage />} />
        <Route path="commandes" element={<CommandesPage />} />
        <Route path="liste-verres" element={<ListeVerresPage />} />
        <Route path="factures" element={<FacturesPage />} />
        <Route path="rapports" element={<RapportsPage />} />
        <Route path="parametres" element={<ParametresPage />} />
        <Route path="sauvegarde" element={<SauvegardePage />} />
      </Route>
    </Routes>
  );
}

export default App;
