import { db } from '../src/lib/db';

async function createSampleCourses() {
  try {
    console.log('📚 Creating sample courses...');

    // Get all batches
    const batches = await db.batch.findMany({
      include: {
        program: {
          include: {
            college: true
          }
        }
      }
    });

    console.log(`Found ${batches.length} batches`);

    for (const batch of batches) {
      // Create 2-3 courses per batch
      const coursesPerBatch = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 1; i <= coursesPerBatch; i++) {
        const courseCode = `${batch.program.code}${i}`;
        const courseName = `Course ${i} - ${batch.program.name}`;
        
        try {
          const course = await db.course.create({
            data: {
              code: courseCode,
              name: courseName,
              batchId: batch.id,
              description: `Course ${i} for ${batch.program.name} covering fundamental concepts and practical applications.`,
              status: 'ACTIVE',
              targetPercentage: 60.0,
              level1Threshold: 60.0,
              level2Threshold: 75.0,
              level3Threshold: 85.0,
            }
          });
          
          console.log(`✅ Created course: ${course.code} - ${course.name} for batch ${batch.name}`);
        } catch (error: any) {
          console.log(`⚠️ Course ${courseCode} already exists or failed to create`);
        }
      }
    }

    console.log('✅ Sample courses created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample courses:', error);
  } finally {
    await db.$disconnect();
  }
}

createSampleCourses();