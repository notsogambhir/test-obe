import { db } from '../src/lib/db';

async function checkProgramsAndBatches() {
  try {
    console.log('=== CHECKING PROGRAMS AND BATCHES ===\n');

    const programs = await db.program.findMany({
      include: {
        batches: true,
        college: {
          select: { name: true }
        }
      }
    });

    console.log(`Found ${programs.length} programs:`);
    programs.forEach(program => {
      console.log(`\n📚 ${program.name} (${program.code}) - ${program.college.name}`);
      console.log(`   Batches: ${program.batches.length}`);
      program.batches.forEach(batch => {
        console.log(`   - ${batch.name} (${batch.startYear}-${batch.endYear})`);
      });
    });

  } catch (error) {
    console.error('Error checking programs and batches:', error);
  }
}

checkProgramsAndBatches();