# Roadmap — BRVM Investment Analyzer

> Dernière mise à jour : 2026-09-10  
> Distinguer **fait** vs **à venir**. Une seule direction produit à la fois.

## Fait (MVP + extensions livrées)

| Phase | Contenu | Statut |
|---|---|---|
| 0 | Gouvernance `.docs` + règles Cursor | done |
| 1 | Foundation Next.js, TS, ports, normalisation, persistance | done |
| 2 | Company | done |
| 3 | Data ingestion (CSV, validation, raw, révisions, scraping fallback) | done |
| 4 | Market (cours, variations, drawdown) | done |
| 5 | Dividend (yield, croissance, CAGR) | done |
| 6 | Financial (EPS, ROE, dette, CF) | done |
| 7 | Analysis (PER, intrinsic, MoS, alignment) | done |
| 8 | Scoring + confiance + data quality + dividend trap | done |
| 9 | Recommendation + snapshots | done |
| 10 | Dashboard / stocks / reco / settings / guide | done |
| 11 | Alertes personnelles | done |
| 12 | Email planifié | done |
| 13 | Performance +30/90/180/365 vs BRVM-C | done |
| 14 | Comptes publics multi-utilisateurs + session | done |
| 15 | Admin restreint (premier compte / `ADMIN_EMAIL`) + support alertes | done |
| 16 | Univers 47 actions BRVM + sync listing | done |
| 17 | Persistance PGlite / schéma PostgreSQL | done |
| 18 | Rafraîchissement marché horaire | done |
| 19 | Portefeuille : historique ops BUY/SELL, FIFO, lots, P&L, import Excel/CSV **vierge** | done |
| 20 | Landing respectueuse de la session | done |

## Règles d’évolution

1. Mettre à jour `changelog.md` + `current_state.md` dans le même chantier.
2. Mettre à jour ce `roadmap.md` quand une phase bascule done / une nouvelle phase est ouverte.
3. Mettre à jour le **guide utilisateur** (`/guide`) pour toute capacité visible.
4. Le portefeuille personnel **ne nourrit pas** le moteur d’analyse marché (signal BUY = fondamentaux + MoS + data).
5. Le modèle d’import public reste **vierge** (pas d’historique d’un utilisateur).

## Suite priorisée (prochaines phases)

| Priorité | Sujet | Notes |
|---|---|---|
| P1 | Prisma / PostgreSQL natif (quand le service Windows le permet) | PGlite suffit en local |
| P2 | YOC / rendement réel sur lots d’achat du portefeuille | Enrichit la vue perso, pas le signal officiel |
| P3 | Backtest (ports déjà prévus) | |
| P4 | Provider « source fiable » documenté par ADR | Scraping reste fallback |
| P5 | Export PDF / rapport mensuel enrichi | |

## Hors scope pour l’instant

- Conseils de vente automatisés (hors cession déjà saisie dans l’historique).
- Trading / passage d’ordres.
- Données hors BRVM.
