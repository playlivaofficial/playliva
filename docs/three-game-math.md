# Three-game mathematical verification

Local virtual-credit models, not certified real-money games.

## Liva Samba Drop

Each of n independent fair left/right bits picks one path. Bucket k has probability C(n,k)/2ⁿ. Original weights exp(a·z²), with a = 0.14/0.32/0.50 and z = (k−n/2)/√(n/4), are normalized to 0.97 and floored at 0.0001×. Returns then floor at 0.01 credit. Hit frequency is 100% (all buckets return some credits); the table reports the probability of returning more than the stake.

| Rows | Risk | Expected return before credit rounding | Profit frequency | Maximum |
|---|---|---:|---:|---:|
| 8 | low | 96.995781% | 28.9063% | 2.5336× |
| 8 | medium | 96.994219% | 28.9063% | 8.0097× |
| 8 | high | 96.998828% | 28.9063% | 21.6221× |
| 12 | low | 96.995327% | 14.5996% | 4.4294× |
| 12 | medium | 96.995103% | 14.5996% | 28.3596× |
| 12 | high | 96.996382% | 14.5996% | 146.38× |
| 16 | low | 96.996724% | 21.0114% | 7.7489× |
| 16 | medium | 96.991901% | 21.0114% | 101.0691× |
| 16 | high | 96.995427% | 21.0114% | 1015.0312× |

Multiplier tables, left to right; exact bucket probabilities are exposed in the local game table.

- **8 / low**: 2.5336×, 1.5521×, 1.0937×, 0.8866×, 0.8266×, 0.8866×, 1.0937×, 1.5521×, 2.5336×
- **8 / medium**: 8.0097×, 2.6134×, 1.1742×, 0.7266×, 0.6191×, 0.7266×, 1.1742×, 2.6134×, 8.0097×
- **8 / high**: 21.6221×, 3.7573×, 1.0765×, 0.5085×, 0.3960×, 0.5085×, 1.0765×, 3.7573×, 21.6221×
- **12 / low**: 4.4294×, 2.6509×, 1.7418×, 1.2564×, 0.9949×, 0.8649×, 0.8255×, 0.8649×, 0.9949×, 1.2564×, 1.7418×, 2.6509×, 4.4294×
- **12 / medium**: 28.3596×, 8.7725×, 3.3589×, 1.5919×, 0.9339×, 0.6781×, 0.6095×, 0.6781×, 0.9339×, 1.5919×, 3.3589×, 8.7725×, 28.3596×
- **12 / high**: 146.3800×, 23.4031×, 5.2219×, 1.6261×, 0.7067×, 0.4286×, 0.3628×, 0.4286×, 0.7067×, 1.6261×, 5.2219×, 23.4031×, 146.3800×
- **16 / low**: 7.7489×, 4.5839×, 2.9082×, 1.9789×, 1.4441×, 1.1303×, 0.9489×, 0.8543×, 0.8249×, 0.8543×, 0.9489×, 1.1303×, 1.4441×, 1.9789×, 2.9082×, 4.5839×, 7.7489×
- **16 / medium**: 101.0691×, 30.4414×, 10.7596×, 4.4629×, 2.1723×, 1.2408×, 0.8317×, 0.6542×, 0.6039×, 0.6542×, 0.8317×, 1.2408×, 2.1723×, 4.4629×, 10.7596×, 30.4414×, 101.0691×
- **16 / high**: 1015.0312×, 155.6600×, 30.6512×, 7.7498×, 2.5160×, 1.0488×, 0.5613×, 0.3858×, 0.3405×, 0.3858×, 0.5613×, 1.0488×, 2.5160×, 7.7498×, 30.6512×, 155.6600×, 1015.0312×

## Skuptu Levanta

Draw floor(97/(1−u)), clamped to 100…10,000 hundredths, with a secure uniform uint32 u. The familiar demo survival curve is approximately 0.97/m. Multiplier grows as exp(t/7000), capped at 100×. Cashout must occur strictly before the private failure deadline; equality loses. Rounding, the immediate-failure mass and finite cap mean this is not a blanket 97% return claim for every strategy.

## Liva Carnaval Gold

Independent 5×3, 20-fixed-line configuration, nine paying symbols, Wild on reels 2–5, Scatter Masks and bonus-only Samba Notes. A line pays only its longest contiguous left-to-right match. One total stake buys all 20 lines. 3/4/5+ Masks award 8/12/20 spins. Every Note increments the persistent meter before that spin pays (cap ×5). Each bonus Mask adds one spin, with 32 total free spins maximum. 500× cap per individual spin, maximum theoretical paid-series bound 16,500× across 33 capped spins; this bound is not a claimed achievable result.

Simulation: 1,000,000 paid spins, xorshift seed 20260927, stake 1.00 credit. Runtime uses secure rejection sampling, never this test PRNG.

```json
{
  "paidSpins": 1000000,
  "seed": 20260927,
  "estimatedRtp": 0.96856432,
  "baseRtp": 0.72318351,
  "bonusRtp": 0.24538081,
  "hitRate": 0.321143,
  "bonuses": 8805,
  "bonusFrequency": 0.008805,
  "triggers": {
    "three": 8064,
    "four": 692,
    "fivePlus": 49
  },
  "bonusSpins": 87986,
  "averageBonusLength": 9.992731402612153,
  "retriggerSpins": 14190,
  "averageFinalStreak": 4.235434412265758,
  "maxStreakBonuses": 5148,
  "wildSpinRate": 0.445339,
  "maxObservedWinMultiple": 489.47,
  "cappedSpins": 0,
  "exactBaseBeforeRounding": 0.7272770102565919,
  "triggerOdds": {
    "three": 0.008004136081927259,
    "four": 0.0007245509574781005,
    "fivePlus": 0.000050611664583380414,
    "any": 0.00877929870398874
  },
  "winCapPerSpin": 500,
  "maxFreeSpins": 32
}
```

Average final meter is measured at bonus completion, not averaged across every bonus spin. Normal/Turbo share identical draws and settlements and differ only in deadlines.
