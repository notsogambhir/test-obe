import { db } from '../src/lib/db';

async function fixTeacherBatchAssignments() {
  try {
    console.log('🔧 Fixing teacher and program coordinator batch assignments...');

    // Get all teachers and program coordinators
    const teachersAndPCs = await db.user.findMany({
      where: {
        role: {
          in: ['TEACHER', 'PROGRAM_COORDINATOR']
        }
      },
      include: {
        program: true
      }
    });

    console.log(`Found ${teachersAndPCs.length} teachers and program coordinators`);

    // Get batches for each program
    for (const user of teachersAndPCs) {
      if (user.programId) {
        // Find a batch for this program
        const batch = await db.batch.findFirst({
          where: {
            programId: user.programId
          }
        });

        if (batch && !user.batchId) {
          await db.user.update({
            where: { id: user.id },
            data: { batchId: batch.id }
          });
          console.log(`✅ Updated ${user.email} with batch ${batch.name}`);
        } else if (batch) {
          console.log(`ℹ️ ${user.email} already has batch assignment`);
        } else {
          console.log(`❌ No batch found for program ${user.programId} for user ${user.email}`);
        }
      }
    }

    console.log('✅ Batch assignments fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing batch assignments:', error);
  } finally {
    await db.$disconnect();
  }
}

fixTeacherBatchAssignments();