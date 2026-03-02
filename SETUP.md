# Metron - Running Ranking System Setup Guide

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (or Neon postgres account)

## Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your database connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/metron"
```

For Neon:
```
DATABASE_URL="postgresql://user:password@region.neon.tech/dbname?sslmode=require"
```

3. **Initialize the database:**

```bash
npm run db:push
```

This will create all tables in your database.

## Running the Application

**Development mode:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production build:**

```bash
npm run build
npm start
```

## Running Tests

```bash
npm test
```

Tests are located in `domain/*.test.ts` files and verify all rating calculations.

## Using the Application

### 1. Import Race Data

Navigate to `/import` and upload a CSV file with the following format:

First row (race metadata):
```
race_name,date,location,distance_km,total_participants
Boston Marathon,2024-04-15,Boston MA,42.195,30000
```

Subsequent rows (results):
```
runner_name,position_general,net_time_seconds,position_category,position_sex,category,official_time_seconds
John Smith,42,15240,12,8,M40-49,15245
Jane Doe,43,15300,13,9,F40-49,15305
```

**Required columns:**
- `runner_name`
- `position_general`
- `net_time_seconds`

**Optional columns:**
- `position_category`
- `position_sex`
- `category`
- `official_time_seconds`

### 2. View Leaderboards

Navigate to `/leaderboards` to view top-rated runners by distance:
- 5K
- 10K
- Half Marathon
- Marathon

Only non-provisional runners (5+ races at distance) appear in leaderboards.

### 3. Search Runners

Use the search bar on the dashboard to find runners and view their:
- Distance-specific ratings
- League tier (Bronze, Silver, Gold, Platinum, Elite Amateur)
- Rating history and trends
- Recent race results

### 4. View Race Details

Navigate to `/races` to browse all imported races, or click on a specific race to see:
- Race metadata and strength index
- Detailed results with runner information
- Position breakdowns (general, category, gender)

## Rating System Overview

### Distance-Specific Ratings

Each runner has independent ratings for:
- 5K
- 10K
- Half Marathon
- Marathon

Starting rating: **1000**

### Rating Updates

When a race is imported:

1. **Race Strength Index** is calculated as the average rating of the top 30% of finishers
2. **Expected Percentile** is calculated using: `1 / (1 + 10^((race_mean_rating - runner_rating) / 400))`
3. **Actual Percentile** is: `1 - (position / total_participants)`
4. **Rating Delta** is: `K * (actual - expected) * (race_strength / global_average)`

Where K-factor depends on experience:
- K=40 for <5 races
- K=30 for 5-14 races  
- K=20 for 15+ races

### Provisional Status

Runners with fewer than 5 races at a distance are **provisional** and:
- Do not appear in official leaderboards
- Still accumulate ratings internally
- Become official once they reach 5 races

### League Tiers

Visual league assignments (no competitive impact):
- **Bronze**: 0-400
- **Silver**: 400-550
- **Gold**: 550-700
- **Platinum**: 700-850
- **Elite Amateur**: 850+

## Database Schema

### Tables

**runners**
- `id`, `fullName`, `sex`, `birthYear`, `createdAt`

**races**
- `id`, `name`, `date`, `location`, `distanceKm`, `totalParticipants`, `raceStrengthIndex`, `createdAt`

**results**
- `id`, `runnerId`, `raceId`, `netTimeSeconds`, `officialTimeSeconds`, `positionGeneral`, `positionCategory`, `positionSex`, `category`, `ageAtRace`, `createdAt`

**ratings** (distance-specific)
- `id`, `runnerId`, `distanceKm`, `ratingValue`, `ratingDeviation`, `racesCount`, `provisional`, `updatedAt`

**rating_histories**
- `id`, `runnerId`, `raceId`, `distanceKm`, `ratingBefore`, `ratingAfter`, `delta`, `expectedPercentile`, `actualPercentile`, `kFactor`, `createdAt`

**rating_model_versions**
- `id`, `version`, `description`, `createdAt`

## API Endpoints

### Runners
- `GET /api/runners/:id` - Get runner profile with all ratings
- `GET /api/runners/search?q=<query>` - Search runners by name
- `GET /api/runners/:id/rating-history?distance=<km>` - Get rating history

### Leaderboards
- `GET /api/leaderboard/<distance_km>` - Get top-rated runners at distance

### Races
- `GET /api/races` - Get all races
- `GET /api/races/:id` - Get race details
- `GET /api/races/:id/results` - Get race results

### Import
- `POST /api/import` - Import race data from CSV file

## Architecture

### Domain Layer (`/domain`)
- Pure rating calculation logic
- `rating.ts` - All Elo-like calculations
- `rating.test.ts` - Unit tests for rating formulas

### Service Layer (`/lib`)
- `prisma.ts` - Database connection
- `race-service.ts` - Race processing and querying
- `csv-import.ts` - CSV parsing and import logic

### API Routes (`/app/api`)
- RESTful endpoints for data access and mutations
- All calculations delegated to domain layer

### UI Components (`/app`)
- Next.js App Router pages
- Client-side interactivity with React
- Tailwind CSS styling
- Tremor charts for visualizations

## Key Design Principles

1. **Ratings are strictly distance-specific** - No cross-distance mixing
2. **All math is in the domain layer** - Business logic separated from UI
3. **Transactional race processing** - All-or-nothing updates
4. **Expectation-driven adjustments** - Performance relative to field strength
5. **Dynamic K-factor** - Higher volatility early, stabilizes with experience
6. **Provisional filtering** - Leaderboards only show established runners

## Troubleshooting

### "DATABASE_URL is missing" error

Ensure `.env.local` file exists with your database connection string.

### Race import fails with "Missing required columns"

Check that your CSV has these exact column names (case-insensitive):
- `race_name`, `date`, `distance_km`, `total_participants` (race metadata line)
- `runner_name`, `position_general`, `net_time_seconds` (on result lines)

### Ratings don't show in leaderboard

Runners need 5 races at a distance to become non-provisional. Check the runner's profile to see if they're still provisional.

## Future Extensions

- Weather-adjusted performance models
- Elevation-adjusted difficulty analysis
- Cross-race normalization
- Equipment performance analytics
- Comparative runner analysis pages
- Public ranking ladders and leagues

## License

(Add your license here)
