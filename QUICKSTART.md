# Quick Start (5 minutes)

## 1. Install & Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local: Add your DATABASE_URL (Neon Postgres recommended)
npm run db:push
```

## 2. Run
```bash
npm run dev
```

Then open **http://localhost:3000**

## 3. Import Sample Race
1. Go to `/import`
2. Upload `sample-race.csv` (included in project)
3. See results on leaderboards and runner profiles

## 4. Explore
- **Dashboard** (`/`) - Search for runners
- **Leaderboards** (`/leaderboards`) - Top runners by distance  
- **Races** (`/races`) - Browse all races
- **Runner Profile** - Click any runner to see rating history

## CSV Format

Your own race CSV needs:
```
race_name,date,location,distance_km,total_participants
Marathon Race,2024-03-15,Boston MA,42.195,5000
John Doe,1,15240,1,1,M,15250
Jane Smith,2,15350,2,2,F,15360
...
```

**Required columns on results lines**: 
- `runner_name`, `position_general`, `net_time_seconds`

## Tests
```bash
npm test
```

Tests verify all rating calculations match the specification.

---

**Full setup guide**: See `SETUP.md`  
**Project status**: See `PROJECT_STATUS.md`
