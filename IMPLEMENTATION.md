# Metron Application - Implementation Guide

This directory contains a complete implementation of the **Running Ranked System — Functional Specification v1**.

## 📋 Documentation

Start here based on your need:

1. **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup to get running
2. **[SETUP.md](./SETUP.md)** - Complete setup, API, and troubleshooting guide
3. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - What was built and current state
4. **[README.md](./README.md)** - Original specification document

## 🎯 Quick Overview

This is a full-stack Next.js application that implements a competitive rating system for amateur running events.

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Rating Logic** | `/domain/rating.ts` | All Elo-like calculations |
| **Database** | `/prisma/schema.prisma` | 7 entities for runners, races, results, ratings |
| **API** | `/app/api/*` | RESTful endpoints for data |
| **UI** | `/app/*` | Dashboard, leaderboards, runner profiles, import |
| **Services** | `/lib/` | Race processing, CSV import, database queries |

### Key Features

✓ Distance-specific ratings (5K, 10K, Half Marathon, Marathon)  
✓ Expectation-driven rating adjustments  
✓ Race strength normalization  
✓ Dynamic K-factor (volatility stabilizes with experience)  
✓ Provisional status (official after 5 races at distance)  
✓ CSV race import with transactional processing  
✓ Leaderboards (excludes provisional runners)  
✓ Runner search and detailed profiles  
✓ Rating history with audit trail  
✓ League tier visualization  

## 🚀 Getting Started

### Minimal Setup (2 commands)

```bash
npm install
npm run db:push
```

Then edit `.env.local` with your PostgreSQL connection:
```
DATABASE_URL="postgresql://user:password@host/dbname"
```

For Neon (recommended for Vercel):
```
DATABASE_URL="postgresql://user:password@region.neon.tech/db?sslmode=require"
```

### Run the Application

```bash
npm run dev
```

Visit http://localhost:3000

### Import Sample Data

1. Go to http://localhost:3000/import
2. Upload `sample-race.csv`
3. Check leaderboards in http://localhost:3000/leaderboards

## 📊 How the Rating System Works

### When You Import a Race

1. **Race Strength Index** = Average rating of top 30% of finishers
2. **Expected Percentile** = 1 / (1 + 10^((field_average - runner_rating)/400))
3. **Actual Percentile** = 1 - (position / total_participants)
4. **Rating Delta** = K × (actual - expected) × (race_strength / global_average)
5. **New Rating** = old_rating + delta (minimum 0)

### K-Factor (Experience-Based Volatility)

- **K = 40** for runners with < 5 races at distance
- **K = 30** for runners with 5-14 races
- **K = 20** for runners with 15+ races

### Provisional Status

Runners with < 5 races at a distance are **provisional**:
- They still accumulate ratings internally
- But don't appear in official leaderboards
- Once they race 5 times at distance, they become official

## 📁 Project Structure

```
/
├── app/
│   ├── api/                 # API routes
│   │   ├── import/          # CSV import endpoint
│   │   ├── leaderboard/     # Leaderboard queries
│   │   ├── races/           # Race and result endpoints
│   │   └── runners/         # Runner and rating endpoints
│   ├── leaderboards/        # Leaderboard pages
│   ├── races/               # Race detail pages
│   ├── runners/             # Runner profile page
│   ├── import/              # CSV import UI
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Dashboard
│   └── globals.css          # Tailwind + Tremor styles
├── domain/
│   ├── rating.ts            # Calculation logic
│   └── rating.test.ts       # Unit tests
├── lib/
│   ├── prisma.ts            # DB connection
│   ├── race-service.ts      # Race processing & queries
│   └── csv-import.ts        # CSV parsing
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Sample data
├── SETUP.md                 # Full setup guide
├── QUICKSTART.md            # 5-minute start
├── PROJECT_STATUS.md        # Implementation status
├── sample-race.csv          # Example CSV
└── package.json             # Dependencies
```

## 🗄️ Database Schema

### Tables

**runners**: id, fullName, sex, birthYear, createdAt

**races**: id, name, date, location, distanceKm, totalParticipants, raceStrengthIndex, createdAt

**results**: id, runnerId, raceId, netTimeSeconds, officialTimeSeconds, positionGeneral, positionCategory, positionSex, category, ageAtRace, createdAt

**ratings** (distance-specific): id, runnerId, distanceKm, ratingValue, ratingDeviation, racesCount, provisional, updatedAt

**rating_histories**: id, runnerId, raceId, distanceKm, ratingBefore, ratingAfter, delta, expectedPercentile, actualPercentile, kFactor, createdAt

**rating_model_versions**: id, version, description, createdAt

## 🧪 Testing

```bash
npm test
```

Tests verify:
- K-factor calculation
- Percentile calculations (expected & actual)
- Race strength index
- Rating delta formulas
- Provisional status logic
- League tier assignments

## 🔌 API Endpoints

### Runners
- `GET /api/runners/:id` - Runner profile with all ratings
- `GET /api/runners/search?q=<name>` - Search by name
- `GET /api/runners/:id/rating-history?distance=<km>` - Rating history

### Leaderboards
- `GET /api/leaderboard/<distance_km>` - Top 100 non-provisional runners

### Races
- `GET /api/races` - All races
- `GET /api/races/:id` - Race details
- `GET /api/races/:id/results` - Race results

### Import
- `POST /api/import` - Upload CSV race data

## 📋 CSV Import Format

**First line** (race metadata):
```
race_name,date,location,distance_km,total_participants
```

**Subsequent lines** (results):
```
runner_name,position_general,net_time_seconds,[optional fields...]
```

**Required fields:**
- race_name, date, distance_km, total_participants
- runner_name, position_general, net_time_seconds

**Optional fields:**
- location (on race line)
- position_category, position_sex, category, official_time_seconds (on result lines)

See `sample-race.csv` for a complete example.

## 🔒 Design Principles

1. **Strict distance separation** - No cross-distance mixing
2. **Math-first approach** - All logic isolated in domain layer
3. **Transactional integrity** - All-or-nothing race processing
4. **Expectation-driven** - Performance vs. field strength
5. **Closed system** - 1000 starting rating, stable global average
6. **Audit trail** - Complete rating history for all changes

## 🚀 Deployment

### To Vercel

```bash
git push
```

Vercel will auto-deploy. Ensure:
- Environment variable `DATABASE_URL` is set
- Database is PostgreSQL (Neon recommended)

### To Other Platforms

```bash
npm run build
npm start
```

Requires Node.js 18+, PostgreSQL, and `DATABASE_URL` environment variable.

## 📚 Learning the Codebase

1. **Start with domain logic**: `/domain/rating.ts` - understand all formulas
2. **Review database schema**: `/prisma/schema.prisma` - see entity relationships
3. **Explore race processing**: `/lib/race-service.ts` - transactional workflow
4. **Check API routes**: `/app/api/` - how endpoints access data
5. **Review UI pages**: `/app/` - how data is presented

## 🐛 Troubleshooting

**"DATABASE_URL is not set"**
→ Create `.env.local` with `DATABASE_URL=...`

**"Rates don't update"**
→ Ensure you're importing races with valid CSV format

**"Runner not in leaderboard"**
→ Runner needs 5 races at distance to become non-provisional

**Tests fail**
→ Make sure you've run `npm install` and `npm run db:push`

## 📖 See Also

- **Specification**: [README.md](./README.md) - Full product specification
- **Setup Guide**: [SETUP.md](./SETUP.md) - Detailed configuration
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup
- **Status**: [PROJECT_STATUS.md](./PROJECT_STATUS.md) - What's implemented

---

**Ready to use?** → Start with [QUICKSTART.md](./QUICKSTART.md)  
**Need help?** → Check [SETUP.md](./SETUP.md)  
**Want details?** → Read [PROJECT_STATUS.md](./PROJECT_STATUS.md)
