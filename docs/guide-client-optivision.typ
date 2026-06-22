#set document(title: "Guide client - OptiVision", author: "OptiVision")
#set page(paper: "a4", margin: (x: 18mm, y: 17mm), numbering: "1")
#set text(size: 10.5pt, lang: "fr")
#set par(justify: true, leading: 0.62em)

#let pill(body) = box(
  inset: (x: 6pt, y: 3pt),
  radius: 3pt,
  fill: rgb("#edf7f4"),
  stroke: rgb("#b9ddd3"),
  text(size: 9pt, weight: "semibold")[#body],
)

#let note(body) = block(
  inset: 8pt,
  radius: 4pt,
  fill: rgb("#f7f7f7"),
  stroke: rgb("#d9d9d9"),
  body,
)

#align(center)[
  #text(size: 24pt, weight: "bold")[OptiVision]
  #linebreak()
  #text(size: 15pt, weight: "semibold")[Guide simple d'utilisation]
  #linebreak()
  #text(size: 10pt, fill: rgb("#555555"))[Application de gestion pour magasin d'optique]
]

#v(12pt)

#note[
  Ce document explique simplement le rôle de chaque page de l'application.
  Il sert de guide pour le client du magasin: quoi ouvrir, quand l'utiliser, et quoi vérifier avant de valider une vente ou imprimer une facture.
]

= Connexion

L'application commence par l'écran de connexion.

#table(
  columns: (1fr, 1fr, 1.2fr),
  inset: 6pt,
  stroke: rgb("#cfcfcf"),
  align: (left, left, left),
  table.header(
    [Rôle], [Identifiant], [Utilisation]
  ),
  [Admin], [`admin / admin123`], [Accès complet: rapports, sauvegarde et paramètres.],
  [Vendeur], [`vendeur / vendeur123`], [Accès aux opérations de vente courantes.]
)

#note[
  En production, les mots de passe doivent être changés. Les comptes ci-dessus sont des comptes de démonstration.
]

= Parcours conseillé pour une vente

Voici le parcours le plus simple pendant l'accueil d'un client:

1. Ouvrir #pill[Accueil client].
2. Rechercher le client existant ou créer une nouvelle fiche.
3. Ajouter ou choisir son ordonnance.
4. Choisir les produits vendus: monture, verre, ou verre seul.
5. Créer la commande.
6. Suivre la commande dans #pill[Commandes].
7. Ouvrir #pill[Factures] pour enregistrer le paiement et imprimer la facture.
8. Utiliser #pill[Liste verres] si les verres doivent être commandés au fournisseur.

= Les pages de l'application

#table(
  columns: (1.15fr, 3fr),
  inset: 6pt,
  stroke: rgb("#cfcfcf"),
  align: (left, left),
  table.header(
    [Page],
    [A quoi elle sert]
  ),
  [Tableau de bord],
  [Voir rapidement l'activité du magasin: ventes, commandes en cours, factures non payées, alertes de stock et commandes prêtes. C'est la page de contrôle général.],

  [Recherche stock],
  [Chercher rapidement une monture ou un verre disponible. Cette page sert avant de promettre un produit au client. Elle aide aussi à vérifier si une correction existe en stock.],

  [Accueil client],
  [Page principale pour recevoir un client. Elle guide la création ou la sélection du client, l'ordonnance, le choix des produits et la création de la commande. Elle accepte une vente monture plus verre, verre seul, ou monture seule si le magasin le souhaite.],

  [Clients],
  [Gérer les fiches clients: nom, téléphone, adresse et historique. Avant de créer un nouveau client, il faut chercher son nom ou son téléphone pour éviter les doublons.],

  [Ordonnances],
  [Enregistrer les corrections optiques du client: oeil droit, oeil gauche, sphère, cylindre, axe, addition et autres informations utiles. Il faut toujours vérifier que l'ordonnance sélectionnée est la bonne avant de créer une commande.],

  [Produits],
  [Gérer le stock: montures, verres, accessoires et services. Cette page permet de vérifier les quantités, les prix de vente et les prix d'achat. Elle doit être tenue à jour pour que les factures et les rapports restent corrects.],

  [Commandes],
  [Suivre l'avancement des commandes. Les statuts sont: Nouvelle, Commandée, Reçue, Montage, Prête, Livrée et Annulée. Cette page sert surtout au suivi de l'atelier et des commandes fournisseur.],

  [Liste verres],
  [Préparer la liste des verres à commander. Elle est utile pour regrouper les corrections demandées et éviter les oublis lors de la commande fournisseur.],

  [Factures],
  [Voir les factures, enregistrer les paiements, suivre les restes à payer et imprimer la facture du client. La facture affiche les codes OD/OG, les prix des verres, le prix de la monture si elle existe, le total et le total en lettres.],

  [Rapports],
  [Analyser l'activité du magasin: chiffre d'affaires, factures payées ou non payées, commandes, stock et résultats. Cette page est surtout utile pour le responsable.],

  [Sauvegarde],
  [Exporter ou importer les données de l'application. Il est conseillé de faire une sauvegarde régulière, surtout avant de changer d'ordinateur ou avant une mise à jour. Cette page est réservée à l'administrateur.],

  [Paramètres],
  [Modifier les informations générales du magasin et les réglages de l'application. Cette page est réservée à l'administrateur.]
)

= Facture

La facture reprend le modèle du magasin.

Elle contient:
- le nom du magasin;
- les informations fiscales;
- la date;
- le nom du client;
- les corrections OD et OG;
- le code tarifaire du verre;
- le prix du verre;
- le prix de la monture si une monture est vendue;
- le total en chiffres;
- le total en lettres.

#note[
  Si le client achète seulement les verres, la ligne monture ne doit pas être remplie avec une fausse valeur. La facture doit afficher uniquement les verres et le total correspondant.
]

= Codes des verres

Le magasin utilise des codes tarifaires pour les verres.
Dans l'application, ces codes sont calculés à partir de la correction et de la table fournie par le magasin.

Principe simple:
- la sphère et le cylindre sont lus depuis l'ordonnance;
- l'application utilise les valeurs absolues pour trouver la tranche;
- le code apparaît sur la ligne OD ou OG;
- le prix apparaît dans la colonne prix;
- si la correction sort de la table, il faut vérifier manuellement.

#pagebreak()

Exemples:

#table(
  columns: (1fr, 1fr, 1fr, 1.2fr),
  inset: 6pt,
  stroke: rgb("#cfcfcf"),
  table.header([Sphère], [Cylindre], [Type], [Résultat attendu]),
  [`+1.50`], [`0.00`], [Sphérique], [Code selon tranche 0 à 2.00],
  [`-3.00`], [`-1.00`], [Astigmate], [Code selon sphère 2.25 à 4.00 et cylindre 0.25 à 2.00],
  [`+5.00`], [`-3.00`], [Fort cylindre], [Code selon sphère 4.25 à 6.00 et cylindre 2.25 à 4.00]
)

= Bonnes pratiques

- Vérifier le nom et le téléphone avant de créer un nouveau client.
- Vérifier que l'ordonnance utilisée est la plus récente.
- Vérifier les quantités en stock avant de promettre une livraison.
- Vérifier le prix du verre et de la monture avant d'imprimer la facture.
- Mettre à jour le statut de la commande à chaque étape.
- Enregistrer les paiements dès qu'ils sont reçus.
- Faire une sauvegarde régulière.

= Points à vérifier avant livraison au client

#table(
  columns: (0.35fr, 3fr),
  inset: 6pt,
  stroke: rgb("#cfcfcf"),
  [ ], [Nom du client correct],
  [ ], [Correction OD et OG correcte],
  [ ], [Monture correcte si une monture est vendue],
  [ ], [Prix des verres correct],
  [ ], [Prix de la monture correct],
  [ ], [Total correct],
  [ ], [Paiement enregistré],
  [ ], [Facture imprimée si nécessaire],
  [ ], [Commande marquée comme Livrée après remise au client]
)

= Résumé

Pour une utilisation quotidienne, le vendeur utilise surtout #pill[Accueil client], #pill[Recherche stock], #pill[Commandes], #pill[Liste verres] et #pill[Factures].

Le responsable utilise en plus #pill[Produits], #pill[Rapports], #pill[Sauvegarde] et #pill[Paramètres].

Le plus important est de garder les clients, les ordonnances, les produits et les paiements à jour. Si ces informations sont correctes, les factures, le stock et les rapports seront beaucoup plus fiables.
