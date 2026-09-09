# Conventions — BRVM Investment Analyzer

> Mémoire permanente. Enrichir, ne jamais effacer.  
> Dernière mise à jour : 2026-08-27

## Gouvernance documentation

1. Source de vérité : `.docs/`.
2. Ne jamais supprimer une information ; archiver / amender / `obsolete`.
3. Après évolution : `current_state.md` + `changelog.md` + fichiers impactés.
4. Distinguer **spécifié** vs **implémenté**.

## Code

- Identifiants : anglais. Docs / UI : français.
- TypeScript strict.
- Domain : zéro import `next`, `react`, `@prisma/client`, `nodemailer`.
- UI : pas d’accès Prisma. Uniquement use cases ou `/api`.
- Secrets : `.env` / `.env.local` — jamais dans le code.
- Montants : nombres canoniques (2606, pas `"2 606 FCFA"`).
- Symboles : uppercase (`SGCI`).
- Devise : `XOF`.
- Pas de commit automatique par l’agent.

## Tests

- Vitest. Parsers : fixtures locales, pas Internet.
- Impératif : formules financières, scoring, BUY…AVOID, normalisation, validation, doublons.

## Git

- Pas de secrets, pas de `data/store.json` de production.
