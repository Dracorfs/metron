# Running Ranked System — Functional Specification v1

## 1. Product Overview

A competitive, mathematically consistent ranking platform for amateur running events.

The system models race results as statistical competitive distributions and calculates dynamic performance ratings per runner using a distribution-based Elo-like system.

This is NOT a casual dashboard.  
It is a rigorously modeled competitive rating system.

---

# 2. Core Principles

1. Ratings are distance-specific.
2. Rankings are distribution-based (not binary win/lose).
3. Rating adjustments are expectation-driven.
4. The system must be closed and stable (no inflation).
5. Race strength is emergent from participants’ ratings.
6. All formulas are versioned.

---

# 3. Tech Stack

- Next.js (App Router)
- TypeScript
- Neon (Postgres)
- Prisma ORM
- Tremor (charts)
- Tailwind CSS

---

# 4. Domain Model

## 4.1 Entities

### runner
- id
- full_name
- sex
- birth_year
- created_at

### race
- id
- name
- date
- location
- distance_km
- total_participants
- race_strength_index (computed)
- created_at

### result
- id
- runner_id
- race_id
- net_time_seconds
- official_time_seconds
- position_general
- position_category
- position_sex
- category
- age_at_race
- created_at

### rating
(distance specific)

- id
- runner_id
- distance_km
- rating_value
- rating_deviation
- races_count
- provisional (boolean)
- updated_at

### rating_history
- id
- runner_id
- race_id
- distance_km
- rating_before
- rating_after
- delta
- expected_percentile
- actual_percentile
- k_factor
- created_at

---

# 5. Competitive Model (Rating v1)

## 5.1 Separate Ratings per Distance

Each runner has independent ratings:

- 5k
- 10k
- half_marathon
- marathon

No cross-distance mixing.

---

# 6. Percentile Calculation

For each race:

actual_percentile =
1 - (position_general / total_participants)

Range: (0, 1)

---

# 7. Race Strength Index

race_strength_index =
average(rating_value of top 30% finishers)

This is computed after loading all participants' ratings prior to update.

This value influences rating deltas.

---

# 8. Expected Percentile

We model expectation using logistic function:

expected_percentile =
1 / (1 + 10^((race_mean_rating - runner_rating)/400))

Where:
- race_mean_rating = average rating of all participants
- 400 is scaling factor (Elo style)

This creates probabilistic expectation of outperforming field.

---

# 9. Rating Update Formula

delta =
K * (actual_percentile - expected_percentile) * race_strength_multiplier

Where:

race_strength_multiplier =
race_strength_index / global_average_rating

---

# 10. K-Factor Rules

if races_count < 5:
    K = 40
else if races_count < 15:
    K = 30
else:
    K = 20

Higher volatility early, stabilizes later.

---

# 11. Provisional Status

Runner is provisional if:
races_count < 5

Provisional runners:
- Do not appear in global leaderboards
- Still accumulate rating internally

---

# 12. Rating Constraints

- Rating cannot drop below 0
- System must maintain stable global average
- Mean rating target = 1000

Initial rating = 1000

---

# 13. Global Rating

Optional composite:

global_rating =
weighted_average(distance_ratings)

Weights based on race frequency.

Not used for ranking integrity.

---

# 14. Race Processing Flow

1. Insert race
2. Insert results
3. Load all participant ratings
4. Compute:
   - actual_percentile
   - expected_percentile
   - race_strength_index
5. Update ratings
6. Store rating_history
7. Update race_strength_index
8. Increment races_count

All steps must be transactional.

---

# 15. Anti-Exploitation Safeguards

1. Distance-specific ratings
2. Expectation-based adjustment
3. Race strength normalization
4. Provisional filtering
5. Dynamic K factor

---

# 16. Dashboard Requirements

## Runner Profile Page

Display:

- Current rating (distance-specific)
- League tier
- Percentile last race
- Rating delta
- Rating history chart
- Trend indicator

## League Tiers

Mapping:

0–400 Bronze  
400–550 Silver  
550–700 Gold  
700–850 Platinum  
850+ Elite Amateur  

Purely visual layer.

---

# 17. Visualizations (Tremor)

- Rating history line chart
- Percentile bar
- Distribution histogram (runner vs field)
- Rating delta indicator

---

# 18. Metrics Versioning

Create:

rating_model_version

All rating calculations must reference version.

Allows future recalculation.

---

# 19. Non-Goals (v1)

- VO2 estimation
- Shoe performance causality
- Training load modeling
- Physiological modeling
- Social features

---

# 20. Future Extensions

- Cross-race normalization
- Weather-adjusted performance
- Elevation-adjusted difficulty
- Build system (equipment analytics)
- Comparative runner analysis
- Public ranking ladders

---

# 21. Definition of Done (MVP)

System is complete when:

- CSV race import works
- Ratings update correctly
- Provisional logic works
- Race strength computed
- Dashboard displays rating history
- Leaderboard excludes provisional runners
- All calculations unit-tested

---

# 22. Engineering Constraints

- Strict TypeScript typing
- All rating math isolated in domain layer
- No rating logic inside UI
- All updates wrapped in DB transactions
- Unit tests required for rating calculations

---

# 23. Key Philosophy

This system must behave like a competitive ladder, not a stats viewer.

Accuracy > gamification  
Stability > volatility  
Consistency > cosmetic features