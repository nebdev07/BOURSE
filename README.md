# BRVM Investment Analyzer

Plateforme publique d’analyse quantitative des sociétés cotées à la BRVM.

## Principe

Le système ne cherche pas l’action qui a le plus monté.  
Il cherche le meilleur rapport **qualité / croissance / dividendes / valorisation / prix**.

Un score élevé ne produit jamais un BUY à lui seul.

## Comptes

- Le **marché** (dashboard, actions, signal officiel) est public.
- **Inscription** : n’importe qui peut créer un compte, souscrire à des alertes et programmer ses seuils.
- Le **premier compte** devient administrateur (sources, import CSV).
- Les seuils personnels n’écrasent pas le moteur officiel.

## Démarrage

```bash
npm install --ignore-scripts
npm test
npm run seed
npm run dev
```

Ouvrir http://localhost:3000

Persistance locale : `data/store.json`.

## Architecture

Voir `.docs/architecture.md` et `.docs/decisions.md`.
