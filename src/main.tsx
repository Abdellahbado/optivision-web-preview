import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { useAppDataStore } from "./stores/appDataStore";
import "./index.css";

/** Charge la base avant d'afficher l'application. */
function Bootstrap() {
  const hydrated = useAppDataStore((state) => state.hydrated);
  const hydrate = useAppDataStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream">
        <p className="text-text-secondary text-sm">Ouverture du magasin...</p>
      </div>
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Bootstrap />
    </BrowserRouter>
  </React.StrictMode>,
);
