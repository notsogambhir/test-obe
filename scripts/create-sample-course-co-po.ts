import { db } from '../src/lib/db';

async function createSampleCourseAndCOs() {
  try {
    console.log('Creating sample course and COs for testing...');

    // Get the first program and batch
    const program = await db.program.findFirst();
    if (!program) {
      console.error('No program found. Please seed the database first.');
      return;
    }

    const batch = await db.batch.findFirst({
      where: { programId: program.id }
    });
    if (!batch) {
      console.error('No batch found for the program.');
      return;
    }

    console.log(`Using program: ${program.name} (${program.code})`);
    console.log(`Using batch: ${batch.name}`);

    // Create a sample course
    const course = await db.course.create({
      data: {
        code: 'CS101',
        name: 'Introduction to Programming',
        batchId: batch.id,
        semester: '1',
        description: 'Fundamental concepts of programming and problem solving',
        status: 'ACTIVE'
      }
    });

    console.log(`Created course: ${course.code} - ${course.name}`);

    // Create sample COs for the course
    const coDescriptions = [
      'Understand fundamental programming concepts and syntax',
      'Apply problem-solving techniques to develop algorithms',
      'Design and implement efficient programs using proper coding practices',
      'Analyze and debug code to identify and fix errors',
      'Evaluate different programming paradigms and their applications'
    ];

    for (let i = 0; i < coDescriptions.length; i++) {
      const co = await db.cO.create({
        data: {
          courseId: course.id,
          code: `CO${i + 1}`,
          description: coDescriptions[i],
          isActive: true
        }
      });
      console.log(`Created CO: ${co.code} - ${co.description.substring(0, 50)}...`);
    }

    // Get existing POs for the program
    const pos = await db.pO.findMany({
      where: { programId: program.id, isActive: true },
      orderBy: { code: 'asc' }
    });

    console.log(`Found ${pos.length} POs for the program`);

    // Create some sample CO-PO mappings
    const mappings = [];
    for (let coIndex = 0; coIndex < 5; coIndex++) {
      for (let poIndex = 0; poIndex < Math.min(3, pos.length); poIndex++) {
        // Create realistic mapping patterns
        let level = 0;
        if (coIndex === 0 && poIndex < 2) level = 3; // CO1 strongly maps to PO1, PO2
        else if (coIndex === 1 && poIndex < 2) level = 2; // CO2 medium maps to PO1, PO2
        else if (coIndex === 2 && poIndex === 1) level = 3; // CO3 strongly maps to PO2
        else if (coIndex === 3 && poIndex === 0) level = 2; // CO4 medium maps to PO1
        else if (coIndex === 4 && poIndex === 1) level = 3; // CO5 strongly maps to PO2

        if (level > 0) {
          mappings.push({
            courseId: course.id,
            coId: `${course.id}-co${coIndex + 1}`, // This will be updated after getting actual CO IDs
            poId: pos[poIndex].id,
            level
          });
        }
      }
    }

    // Get the actual COs we just created
    const cos = await db.cO.findMany({
      where: { courseId: course.id },
      orderBy: { code: 'asc' }
    });

    // Create mappings with actual CO IDs
    for (let i = 0; i < cos.length; i++) {
      const co = cos[i];
      // Create mappings for first 3 POs
      for (let j = 0; j < Math.min(3, pos.length); j++) {
        let level = 0;
        if (i === 0 && j < 2) level = 3;
        else if (i === 1 && j < 2) level = 2;
        else if (i === 2 && j === 1) level = 3;
        else if (i === 3 && j === 0) level = 2;
        else if (i === 4 && j === 1) level = 3;

        if (level > 0) {
          await db.cOPOMapping.create({
            data: {
              courseId: course.id,
              coId: co.id,
              poId: pos[j].id,
              level,
              isActive: true
            }
          });
          console.log(`Created mapping: ${co.code} -> ${pos[j].code} (Level ${level})`);
        }
      }
    }

    console.log('\n✅ Sample course, COs, and CO-PO mappings created successfully!');
    console.log(`Course ID: ${course.id}`);
    console.log('You can now test the CO-PO mapping functionality in the application.');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await db.$disconnect();
  }
}

createSampleCourseAndCOs();