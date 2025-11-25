import { db } from './src/lib/db';

async function recreateComputerScienceProgram() {
  try {
    console.log('🔍 Looking for Computer Science program...');
    
    // Check if Computer Science program already exists
    const existingProgram = await db.program.findFirst({
      where: {
        code: 'BCSE'
      }
    });
    
    if (existingProgram) {
      console.log('✅ Computer Science program already exists:', existingProgram);
      return;
    }
    
    console.log('❌ Computer Science program not found, recreating...');
    
    // Get the first college
    const college = await db.college.findFirst();
    if (!college) {
      console.error('❌ No college found to create program');
      return;
    }
    
    console.log('🏫 Using college:', college.name);
    
    // Create Computer Science program
    const csProgram = await db.program.create({
      data: {
        name: 'Bachelor of Computer Science',
        code: 'BCSE',
        collegeId: college.id,
        duration: 4,
        description: '4-year undergraduate computer science program',
        isActive: true
      }
    });
    
    console.log('✅ Computer Science program created:', csProgram);
    
    // Create batches for CS program
    const currentYear = new Date().getFullYear();
    const batch1 = await db.batch.create({
      data: {
        name: 'CS Batch 2021-2025',
        code: 'CS2021',
        programId: csProgram.id,
        startYear: 2021,
        endYear: 2025,
        isActive: true
      }
    });
    
    const batch2 = await db.batch.create({
      data: {
        name: 'CS Batch 2022-2026',
        code: 'CS2022',
        programId: csProgram.id,
        startYear: 2022,
        endYear: 2026,
        isActive: true
      }
    });
    
    console.log('✅ Created CS batches:', batch1.name, batch2.name);
    
    // Create course for CS program
    const course = await db.course.create({
      data: {
        code: 'BCSE',
        name: 'Bachelor of Computer Science',
        batchId: batch1.id,
        description: '4-year undergraduate computer science program',
        status: 'ACTIVE',
        targetPercentage: 60,
        level1Threshold: 60,
        level2Threshold: 75,
        level3Threshold: 85,
        isActive: true
      }
    });
    
    console.log('✅ Created CS course:', course.name);
    
    console.log('🎉 Computer Science program successfully recreated!');
    
  } catch (error) {
    console.error('❌ Error recreating Computer Science program:', error);
  }
}

// Run the function
recreateComputerScienceProgram();