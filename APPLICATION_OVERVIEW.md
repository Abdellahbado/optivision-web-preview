# OptiVision - Vue d'ensemble du projet

## 1. Objet de l'application

OptiVision est une application de gestion pour magasin d'optique. Son objectif
est de réunir dans un seul outil les operations quotidiennes de l'opticien :
gestion des clients, saisie des ordonnances, choix des verres et montures,
suivi des commandes, facturation, encaissements, stock et sauvegardes.

L'application est en francais et utilise le dinar algerien (DA). Elle est
concue pour un petit ou moyen magasin qui doit travailler rapidement au
comptoir, avec des donnees clients fiables et un historique facile a retrouver.

## 2. Produit final vise

Le produit final est une application **Windows de bureau**, installee sur le
poste du magasin. Elle doit pouvoir fonctionner sans connexion Internet pour
les operations courantes.

Le navigateur et le deploiement Vercel servent actuellement a presenter et
tester l'interface avec le client. Ce mode web ne doit pas etre utilise comme
source de donnees de production : les donnees de demonstration sont conservees
dans le navigateur et ne constituent pas une sauvegarde professionnelle.

Dans la version Windows finale :

- les donnees seront stockees localement dans une base SQLite ;
- les utilisateurs se connecteront avec des comptes et des droits adaptes ;
- le magasin pourra sauvegarder et restaurer sa base de donnees ;
- les factures, listes de verres et documents seront imprimables ou exportables
  en PDF ;
- la connexion Internet restera optionnelle pour le fonctionnement quotidien.

## 3. Utilisateurs et droits

Deux profils sont prevus :

| Profil | Utilisation principale |
| --- | --- |
| Vendeur / opticien | Clients, ordonnances, ventes, commandes, factures et stock courant. |
| Administrateur | Toutes les fonctions, y compris parametres, rapports, sauvegardes et informations sensibles. |

Les prix d'achat, marges, suppressions, modifications de paiement, ajustements
de stock et restaurations de sauvegarde doivent rester tracables et reserves
aux personnes autorisees.

## 4. Parcours principal au comptoir

Le parcours central est la page **Vente client**. Il doit permettre de terminer
une vente sans naviguer entre plusieurs ecrans :

1. Rechercher un client par nom, prenom, telephone, code ou date de naissance,
   puis le creer s'il n'existe pas.
2. Selectionner une ordonnance existante ou en creer une nouvelle.
3. Choisir les verres a partir de la correction et du type de verre souhaites.
   L'application verifie le stock et indique si le verre doit etre commande.
4. Ajouter une monture seulement si le client en achete une ; elle reste
   facultative lorsqu'il conserve sa propre monture.
5. Verifier ou ajuster le prix total final, creer la commande et poursuivre
   vers la facture et le paiement.

L'ordonnance contient les corrections OD et OG (sphere, cylindre, axe,
addition, ecart pupillaire et type de vision). La saisie doit accepter les
signes `+` et `-` au clavier. Une ordonnance doit rester modifiable ou
supprimable depuis le dossier du client et depuis le parcours de vente.

## 5. Fonctions de l'application

### Accueil et vente client

- Tableau de bord avec les indicateurs prioritaires : chiffre d'affaires,
  commandes en cours, impayes et alertes de stock.
- Parcours de vente guide pour identifier le client, choisir l'ordonnance,
  verifier les verres et creer la commande.
- Recherche client par nom, prenom, numero de telephone, date de naissance et
  code client.
- Controle de disponibilite des verres selon la correction et le type choisi.
- Passage d'un verre indisponible dans la liste de commande fournisseur.
- Monture facultative et total de vente ajustable si une remise, un arrangement
  commercial ou une prestation doit etre appliquee.

### Clients et ordonnances

- Creation, modification, consultation et suppression de fiches clients.
- Detection de doublons lors de la creation d'un client.
- Historique des ordonnances liees a chaque client.
- Creation, modification et suppression des ordonnances.
- Conservation des informations necessaires au montage et a la preparation des
  verres.

### Stock et catalogue

- Catalogue de montures, verres, lentilles, accessoires et services.
- Ajout, modification et suppression de produits.
- Prix d'achat, prix de vente, quantite en stock et seuil d'alerte.
- Informations propres aux montures et aux verres : type, traitements, plages
  sphere/cylindre, indice et autres caracteristiques utiles.
- Recherche rapide de montures et verres en stock.
- Liste de verres a commander, regroupee pour simplifier les echanges avec le
  fournisseur.

### Commandes, factures et paiements

- Suivi des commandes de la creation a la livraison : nouvelle, commandee,
  recue, en montage, prete, livree ou annulee.
- Dates prevues et reelles de livraison, remarques d'atelier et lien avec le
  client.
- Factures numerotees avec suivi des montants payes, partiels et impayes.
- Modele de facture inspire du format du magasin, avec client, correction,
  codes de verres, prix des verres, monture, total et montant en lettres.
- Apercu et impression de facture ; l'impression systeme permet egalement de
  choisir une imprimante PDF lorsque Windows en propose une.

### Administration

- Rapports de base : ventes, impayes, stock et commandes.
- Parametres de l'identite du magasin, de la langue et de la devise.
- Export et import de sauvegarde pour le mode de demonstration.
- Gestion des acces selon le role utilisateur.

## 6. Technologies utilisees

| Couche | Technologie | Role |
| --- | --- | --- |
| Interface | React 19 et TypeScript | Ecrans, formulaires et logique de l'interface. |
| Outil de developpement web | Vite | Lancement rapide de l'interface pour les tests. |
| Design | Tailwind CSS et Lucide | Mise en page, styles et icones coherents. |
| Etat temporaire | Zustand avec stockage navigateur | Donnees de demonstration dans le mode web actuel. |
| Application Windows | Tauri v2 et Rust | Creation de l'application de bureau legere. |
| Base de donnees cible | SQLite via le plugin Tauri SQL | Stockage local durable pour la version Windows. |
| Outils | Bun | Installation des dependances et commandes de developpement. |

## 7. Architecture cible

```text
Opticien
    |
    v
Application Windows OptiVision (React + Tauri)
    |
    +-- Base SQLite locale : clients, ordonnances, produits, commandes,
    |   factures, paiements et mouvements de stock
    |
    +-- Documents : factures PDF, listes de verres, recus et sauvegardes
    |
    +-- Utilisateurs et journal d'audit
    |
    +-- Option ulterieure : synchronisation / sauvegarde distante
```

Le principe est de garder l'outil local, rapide et utilisable hors ligne. Les
fonctions en ligne, comme une sauvegarde distante, une connexion fournisseur
ou plusieurs magasins, seront ajoutees uniquement si elles apportent une valeur
claire au magasin.

## 8. Etat actuel et limites du mode de demonstration

L'interface web permet deja de valider le parcours metier, les ecrans et les
documents. Elle inclut les principaux domaines de travail : clients,
ordonnances, stock, commandes, factures, rapports et sauvegarde.

Cependant, avant de mettre l'application en service avec de vraies donnees, il
reste indispensable de terminer les points suivants :

- connecter tous les ecrans actifs a SQLite au lieu du stockage navigateur ;
- mettre en place les migrations de base de donnees et la sauvegarde complete ;
- remplacer les comptes de demonstration par une authentification securisee ;
- enregistrer les mouvements de stock pour chaque entree, vente, casse,
  annulation ou correction ;
- securiser les numerotations de factures et commandes ;
- enregistrer un journal des actions sensibles ;
- finaliser l'export PDF et verifier l'impression sur les formats utilises par
  le magasin (A4, A5 ou A6) ;
- verifier les obligations fiscales, mentions legales et regles de protection
  des donnees applicables au magasin.

## 9. Priorites de livraison

### Priorite 1 - Base fiable pour le magasin

1. Version Windows Tauri avec base SQLite active.
2. Comptes securises, droits administrateur et journal d'audit.
3. Sauvegarde et restauration de la base complete.
4. Factures et documents PDF fiables, avec numerotation verifiee.

### Priorite 2 - Workflow complet de l'opticien

1. Fiche client avec historique unique : ordonnances, commandes, factures,
   paiements et notes.
2. Vraies entrees et sorties de stock, avec alertes de seuil.
3. Commandes fournisseur, reception des verres et passage au montage.
4. Acomptes, paiements partiels, solde restant et impayes.

### Priorite 3 - Operations et croissance

1. Rappels client : ordonnance a renouveler, commande prete ou impaye.
2. Lecture de codes-barres pour les montures et accessoires.
3. Inventaire physique avec ecarts et motifs.
4. Retours, annulations, avoirs et remboursements.
5. Eventuellement : plusieurs magasins, sauvegarde distante, synchronisation
   et integration avec des fournisseurs.

## 10. Criteres de recette de la version Windows

La version Windows pourra etre consideree prete pour un premier magasin pilote
lorsque les scenarios suivants fonctionneront sans perte de donnees :

1. Creer un client, retrouver sa fiche, creer et modifier son ordonnance.
2. Creer une vente avec ou sans monture, avec un verre en stock ou a commander.
3. Faire passer la commande jusqu'a la livraison et retrouver son historique.
4. Produire une facture correcte, l'imprimer ou l'enregistrer en PDF, puis
   enregistrer un paiement complet ou partiel.
5. Constater les mouvements de stock associes a la vente et a la reception.
6. Redemarrer l'application et retrouver toutes les donnees identiques.
7. Creer une sauvegarde, la restaurer sur une copie de test et verifier les
   donnees restaurees.
8. Verifier que les fonctions sensibles sont protegees par le role utilisateur.

## 11. Utilisation pendant la phase de test

Pour les tests d'interface, l'application peut etre lancee en mode web avec :

```bash
bun install
bun run dev
```

Pour lancer la version de bureau en developpement :

```bash
bun run tauri dev
```

Le deploiement Vercel est un apercu partageable. La livraison au magasin devra
etre faite sous la forme d'un installateur Windows apres validation de la base
SQLite, des sauvegardes et de l'impression.
