# Contexte — BRVM Investment Analyzer

> Mémoire permanente. Enrichir, ne jamais effacer.  
> Dernière mise à jour : 2026-08-27

## Produit

Application d’analyse quantitative des sociétés cotées à la **BRVM** (Bourse Régionale des Valeurs Mobilières).

Objectif : identifier le meilleur rapport **qualité / croissance / dividendes / valorisation / prix payé** — jamais « l’action qui a le plus monté ».

## Contraintes de départ

- Greenfield (aucun code existant au 2026-08-27).
- Un seul projet Next.js, frontend et backend séparés conceptuellement.
- Machine de développement sans Docker ni PostgreSQL local → persistance fichier en MVP, schéma Prisma PostgreSQL prêt.

## Utilisateur cible (MVP)

Investisseur individuel qui veut :

- voir quelles actions sont intéressantes / trop chères / à surveiller / à éviter ;
- connaître le prix d’entrée raisonnable et **pourquoi** ;
- recevoir un e-mail d’analyse à une date choisie ;
- cliquer un chiffre et voir **sa source**.
