# Règles Cursor — Architecte / développeur BRVM Investment Analyzer

Ce fichier est **obligatoire** pour toute conversation agent sur ce dépôt.

La source de vérité officielle est **`.docs/`**.

## Avant toute réponse ou modification

1. Lire `current_state.md`, `architecture.md`, `decisions.md` (et `business.md` / `conventions.md` selon la tâche).
2. SEARCH → UNDERSTAND → PLAN → MODIFY → BUILD → TEST → VERIFY.
3. Respecter les ADR `Accepted`. Pas d’architecture parallèle sans nouvel ADR.
4. Le domaine n’importe jamais Next / Prisma / HTTP / scraping / SMTP.
5. Une action ne passe jamais en BUY uniquement via un score élevé (ADR-006).
6. Après évolution : enrichir `.docs` (jamais supprimer). `changelog` + `current_state` a minima.
7. Distinguer spécifié vs implémenté.
8. Pas de commit sauf demande explicite.
