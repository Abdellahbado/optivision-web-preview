use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: r#"
                -- Clients table
                CREATE TABLE IF NOT EXISTS clients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    prenom TEXT NOT NULL,
                    nom TEXT NOT NULL,
                    telephone TEXT NOT NULL,
                    telephone2 TEXT,
                    email TEXT,
                    adresse TEXT,
                    ville TEXT,
                    date_naissance TEXT,
                    notes TEXT,
                    date_creation TEXT NOT NULL DEFAULT (datetime('now')),
                    date_modification TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- Ordonnances (Prescriptions) table
                CREATE TABLE IF NOT EXISTS ordonnances (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL,
                    date_prescription TEXT NOT NULL,
                    medecin TEXT,
                    od_sphere REAL,
                    od_cylindre REAL,
                    od_axe INTEGER,
                    od_addition REAL,
                    og_sphere REAL,
                    og_cylindre REAL,
                    og_axe INTEGER,
                    og_addition REAL,
                    ecart_pupillaire REAL,
                    ecart_vl REAL,
                    ecart_vp REAL,
                    type_vision TEXT,
                    notes TEXT,
                    date_creation TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                -- Fournisseurs (Suppliers) table
                CREATE TABLE IF NOT EXISTS fournisseurs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom TEXT NOT NULL,
                    contact TEXT,
                    telephone TEXT,
                    email TEXT,
                    adresse TEXT,
                    notes TEXT,
                    date_creation TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- Produits (Products) table
                CREATE TABLE IF NOT EXISTS produits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reference TEXT UNIQUE NOT NULL,
                    nom TEXT NOT NULL,
                    categorie TEXT NOT NULL,
                    marque TEXT,
                    modele TEXT,
                    couleur TEXT,
                    taille TEXT,
                    matiere TEXT,
                    prix_achat REAL,
                    prix_vente REAL NOT NULL,
                    quantite INTEGER NOT NULL DEFAULT 0,
                    stock_minimum INTEGER DEFAULT 5,
                    fournisseur_id INTEGER,
                    emplacement TEXT,
                    type_verre TEXT,
                    indice REAL,
                    traitements TEXT,
                    notes TEXT,
                    actif INTEGER NOT NULL DEFAULT 1,
                    date_creation TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id)
                );

                -- Mouvements de stock table
                CREATE TABLE IF NOT EXISTS mouvements_stock (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    produit_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    quantite INTEGER NOT NULL,
                    quantite_avant INTEGER NOT NULL,
                    quantite_apres INTEGER NOT NULL,
                    raison TEXT,
                    date TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (produit_id) REFERENCES produits(id)
                );

                -- Commandes (Orders) table
                CREATE TABLE IF NOT EXISTS commandes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    client_id INTEGER NOT NULL,
                    ordonnance_id INTEGER,
                    date_commande TEXT NOT NULL,
                    date_livraison_prevue TEXT,
                    date_livraison TEXT,
                    statut TEXT NOT NULL DEFAULT 'NEW',
                    montant_total REAL NOT NULL DEFAULT 0,
                    montant_paye REAL NOT NULL DEFAULT 0,
                    notes TEXT,
                    notes_atelier TEXT,
                    date_creation TEXT NOT NULL DEFAULT (datetime('now')),
                    date_modification TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (client_id) REFERENCES clients(id),
                    FOREIGN KEY (ordonnance_id) REFERENCES ordonnances(id)
                );

                -- Lignes de commande table
                CREATE TABLE IF NOT EXISTS commande_lignes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    commande_id INTEGER NOT NULL,
                    produit_id INTEGER,
                    description TEXT NOT NULL,
                    type TEXT NOT NULL,
                    quantite INTEGER NOT NULL DEFAULT 1,
                    prix_unitaire REAL NOT NULL,
                    remise REAL DEFAULT 0,
                    prix_total REAL NOT NULL,
                    FOREIGN KEY (commande_id) REFERENCES commandes(id),
                    FOREIGN KEY (produit_id) REFERENCES produits(id)
                );

                -- Détails verres commande
                CREATE TABLE IF NOT EXISTS commande_verres (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    commande_id INTEGER NOT NULL,
                    oeil TEXT NOT NULL,
                    type_verre TEXT,
                    indice REAL,
                    traitements TEXT,
                    sphere REAL,
                    cylindre REAL,
                    axe INTEGER,
                    addition REAL,
                    FOREIGN KEY (commande_id) REFERENCES commandes(id)
                );

                -- Factures (Invoices) table
                CREATE TABLE IF NOT EXISTS factures (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    commande_id INTEGER,
                    client_id INTEGER NOT NULL,
                    date_facture TEXT NOT NULL,
                    montant_ht REAL NOT NULL DEFAULT 0,
                    tva REAL DEFAULT 0,
                    montant_ttc REAL NOT NULL DEFAULT 0,
                    remise_globale REAL DEFAULT 0,
                    montant_paye REAL NOT NULL DEFAULT 0,
                    mode_paiement TEXT,
                    notes TEXT,
                    statut TEXT NOT NULL DEFAULT 'BROUILLON',
                    date_creation TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (commande_id) REFERENCES commandes(id),
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                -- Lignes de facture
                CREATE TABLE IF NOT EXISTS facture_lignes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    facture_id INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    quantite INTEGER NOT NULL DEFAULT 1,
                    prix_unitaire REAL NOT NULL,
                    remise REAL DEFAULT 0,
                    prix_total REAL NOT NULL,
                    FOREIGN KEY (facture_id) REFERENCES factures(id)
                );

                -- Paiements table
                CREATE TABLE IF NOT EXISTS paiements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    facture_id INTEGER NOT NULL,
                    date TEXT NOT NULL DEFAULT (datetime('now')),
                    montant REAL NOT NULL,
                    mode TEXT NOT NULL,
                    reference TEXT,
                    notes TEXT,
                    FOREIGN KEY (facture_id) REFERENCES factures(id)
                );

                -- Paramètres (Settings) table
                CREATE TABLE IF NOT EXISTS parametres (
                    cle TEXT PRIMARY KEY,
                    valeur TEXT
                );

                -- Insert default settings
                INSERT OR IGNORE INTO parametres (cle, valeur) VALUES 
                    ('shop_name', 'Ma Boutique Optique'),
                    ('shop_address', ''),
                    ('shop_phone', ''),
                    ('shop_email', ''),
                    ('currency', 'DZD'),
                    ('tva_rate', '0'),
                    ('last_backup', '');

                -- Create indexes for performance
                CREATE INDEX IF NOT EXISTS idx_clients_telephone ON clients(telephone);
                CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
                CREATE INDEX IF NOT EXISTS idx_ordonnances_client ON ordonnances(client_id);
                CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);
                CREATE INDEX IF NOT EXISTS idx_produits_reference ON produits(reference);
                CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id);
                CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
                CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_stock_tracking_and_daily_orders",
            sql: r#"
                -- Add new columns to mouvements_stock for sales and loss tracking
                ALTER TABLE mouvements_stock ADD COLUMN commande_id INTEGER REFERENCES commandes(id);
                ALTER TABLE mouvements_stock ADD COLUMN prix_achat REAL;

                -- Add purchase price tracking to order lines
                ALTER TABLE commande_lignes ADD COLUMN prix_achat_unitaire REAL;
                ALTER TABLE commande_lignes ADD COLUMN cout_total REAL;

                -- Add category_data JSON field to produits
                ALTER TABLE produits ADD COLUMN category_data TEXT;

                -- Casses (breakage/loss) table for detailed loss tracking
                CREATE TABLE IF NOT EXISTS casses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    produit_id INTEGER NOT NULL,
                    mouvement_id INTEGER NOT NULL,
                    quantite INTEGER NOT NULL,
                    prix_achat_unitaire REAL NOT NULL DEFAULT 0,
                    montant_perte REAL NOT NULL DEFAULT 0,
                    raison TEXT NOT NULL,
                    notes TEXT,
                    date TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (produit_id) REFERENCES produits(id),
                    FOREIGN KEY (mouvement_id) REFERENCES mouvements_stock(id)
                );

                -- Daily lens orders (Liste des verres à commander)
                CREATE TABLE IF NOT EXISTS listes_verres (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    statut TEXT NOT NULL DEFAULT 'BROUILLON',
                    notes TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- Daily lens order items
                CREATE TABLE IF NOT EXISTS liste_verre_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    liste_id INTEGER NOT NULL,
                    commande_id INTEGER,
                    commande_verre_id INTEGER,
                    client_nom TEXT,
                    oeil TEXT NOT NULL,
                    type_verre TEXT,
                    indice REAL,
                    sphere REAL,
                    cylindre REAL,
                    axe INTEGER,
                    addition REAL,
                    traitements TEXT,
                    en_stock INTEGER NOT NULL DEFAULT 0,
                    notes TEXT,
                    FOREIGN KEY (liste_id) REFERENCES listes_verres(id),
                    FOREIGN KEY (commande_id) REFERENCES commandes(id),
                    FOREIGN KEY (commande_verre_id) REFERENCES commande_verres(id)
                );

                -- Indexes for new tables
                CREATE INDEX IF NOT EXISTS idx_casses_produit ON casses(produit_id);
                CREATE INDEX IF NOT EXISTS idx_casses_date ON casses(date);
                CREATE INDEX IF NOT EXISTS idx_listes_verres_date ON listes_verres(date);
                CREATE INDEX IF NOT EXISTS idx_liste_items_liste ON liste_verre_items(liste_id);
            "#,
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:optivision.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
