# Règles métier — BRVM Investment Analyzer

> Dernière mise à jour : 2026-08-27

## Formules

- Dividend Yield = Annual Dividend / Current Price × 100
- Growth = (Current − Previous) / Previous × 100
- CAGR = (Ending / Beginning)^(1/n) − 1
- YOC = Current Dividend / Original Purchase Price × 100
- Total Return = (Current Price + Cumulative Dividends − Purchase Price) / Purchase Price × 100
- EPS = Net Income / Number of Shares
- PER = Current Price / EPS
- Margin of Safety = (IntrinsicValue − CurrentPrice) / IntrinsicValue × 100

## Score /100

| Pilier | Max |
|---|---|
| Business Quality | 20 |
| Growth | 15 |
| Dividend Quality | 15 |
| Valuation | 20 |
| Margin of Safety | 15 |
| Price/Fundamentals | 10 |
| Risk | 5 |

## Recommandations

**BUY** : score ≥ 80, MoS ≥ 15, confiance ≥ 75, data quality ≥ 80, aucune alerte critique, triptyque qualité+valo+MoS.

**ACCUMULATE** : score ≥ 70, MoS ≥ 5, confiance ≥ 70.

**WAIT** : BusinessQuality ≥ 70 et MoS < 0 (bonne entreprise, mauvais prix).

**WATCH** : intéressant sans signal d’achat assez fort.

**AVOID** : collapse dividende/EPS, dette excessive, détérioration, data insuffisante, risque majeur, dividend trap.

**DIVIDEND_TRAP** : yield très élevé + EPS en baisse ou cash-flow insuffisant → pénalité + AVOID.

**DataQuality < 70** : jamais BUY.

## Ruleset par défaut (v1)

- minimumBuyScore: 80
- minimumMarginOfSafety: 15
- minimumConfidence: 75
- minimumDividendScore: 10 (sur 15)
- minimumGrowthScore: 8 (sur 15)
- maximumPER: 18
- minimumROE: 10
- minimumDataQualityBuy: 80
- neverBuyBelowDataQuality: 70
