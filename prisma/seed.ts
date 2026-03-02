import prisma from '@/lib/prisma';
import { processRace } from '@/lib/race-service';

async function main() {
  console.log('Seeding database with sample data...');

  // Create sample runners
  const runners = await Promise.all([
    prisma.runner.create({
      data: {
        fullName: 'Alice Johnson',
        sex: 'F',
        birthYear: 1990,
      },
    }),
    prisma.runner.create({
      data: {
        fullName: 'Bob Smith',
        sex: 'M',
        birthYear: 1988,
      },
    }),
    prisma.runner.create({
      data: {
        fullName: 'Carol Davis',
        sex: 'F',
        birthYear: 1995,
      },
    }),
    prisma.runner.create({
      data: {
        fullName: 'David Lee',
        sex: 'M',
        birthYear: 1992,
      },
    }),
  ]);

  // Create sample race
  const race = await prisma.race.create({
    data: {
      name: 'Local 5K Championship',
      date: new Date('2024-03-15'),
      location: 'Central Park, NYC',
      distanceKm: 5,
      totalParticipants: 4,
    },
  });

  // Create results
  await prisma.result.create({
    data: {
      runnerId: runners[0].id,
      raceId: race.id,
      netTimeSeconds: 1234.5,
      positionGeneral: 1,
      positionSex: 1,
      category: 'Women',
    },
  });

  await prisma.result.create({
    data: {
      runnerId: runners[1].id,
      raceId: race.id,
      netTimeSeconds: 1456.2,
      positionGeneral: 2,
      positionSex: 1,
      category: 'Men',
    },
  });

  await prisma.result.create({
    data: {
      runnerId: runners[2].id,
      raceId: race.id,
      netTimeSeconds: 1567.8,
      positionGeneral: 3,
      positionSex: 2,
      category: 'Women',
    },
  });

  await prisma.result.create({
    data: {
      runnerId: runners[3].id,
      raceId: race.id,
      netTimeSeconds: 1678.9,
      positionGeneral: 4,
      positionSex: 2,
      category: 'Men',
    },
  });

  // Process race to update ratings
  await processRace(race.id);

  console.log('✓ Database seeded successfully!');
  console.log(`Created ${runners.length} runners and 1 race with results.`);
  console.log('Ratings have been calculated and stored.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
