import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function generateSimpleMockData() {
  try {
    console.log('🌱 Starting simple mock data generation...');
    
    // Get existing programs and their batches
    const programs = await db.program.findMany({ 
      include: { 
        college: true,
        batches: {
          include: {
            courses: {
              select: { code: true }
            }
          }
        }
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 10);
    let userCounter = 1000; // Start from high number to avoid conflicts

    // Create 1-2 teachers per program
    console.log('👨‍🏫 Creating teachers...');
    for (const program of programs) {
      const teacherCount = 2;
      for (let i = 0; i < teacherCount; i++) {
        const employeeId = `TCH${String(userCounter++).padStart(4, '0')}`;
        await db.user.create({
          data: {
            email: `tchr${program.code.toLowerCase()}${i + 1}.${Date.now()}@obeportal.com`,
            name: `${program.name} Teacher ${i + 1}`,
            employeeId,
            password: hashedPassword,
            role: 'TEACHER',
            collegeId: program.collegeId,
            programId: program.id,
            isActive: true
          }
        });
      }
    }

    // Create 1 coordinator per program if not exists
    console.log('👨‍💼 Creating coordinators...');
    for (const program of programs) {
      const existingCoordinator = await db.user.findFirst({
        where: { 
          programId: program.id, 
          role: 'PROGRAM_COORDINATOR' 
        }
      });
      
      if (!existingCoordinator) {
        const employeeId = `PC${String(userCounter++).padStart(4, '0')}`;
        await db.user.create({
          data: {
            email: `pc.${program.code.toLowerCase()}@obeportal.com`,
            name: `${program.name} Program Coordinator`,
            employeeId,
            password: hashedPassword,
            role: 'PROGRAM_COORDINATOR',
            collegeId: program.collegeId,
            programId: program.id,
            isActive: true
          }
        });
      }
    }

    // Create 1-2 additional courses per batch
    console.log('📚 Creating additional courses...');
    for (const program of programs) {
      const batches = program.batches || [];
      for (const batch of batches) {
        const existingCourseCount = batch.courses?.length || 0;
        const additionalCourseCount = Math.min(2, 3 - existingCourseCount); // Max 3 courses per batch
        
        if (additionalCourseCount > 0) {
          const newCourses = generateSimpleCoursesForProgram(program.code, batch.id, additionalCourseCount);
          await db.course.createMany({ data: newCourses });
          console.log(`✅ Created ${newCourses.length} courses for ${batch.name}`);
        }
      }
    }

    // Create students (20-30 per batch)
    console.log('👨‍🎓 Creating students...');
    for (const program of programs) {
      const batches = program.batches || [];
      for (const batch of batches) {
        const batchSize = Math.floor(Math.random() * 15) + 20; // 20-35 students per batch
        
        for (let i = 0; i < batchSize; i++) {
          await db.user.create({
            data: {
              email: `student${String(userCounter++).padStart(4, '0')}@obeportal.com`,
              studentId: `STU${String(userCounter - 1).padStart(4, '0')}`,
              name: `Student ${userCounter - 1}`,
              password: hashedPassword,
              role: 'STUDENT',
              collegeId: program.collegeId,
              programId: program.id,
              batchId: batch.id,
              isActive: true
            }
          });
        }
      }
    }

    console.log('🎉 Simple mock data generation completed!');
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
  } finally {
    await db.$disconnect();
  }
}

function generateSimpleCoursesForProgram(programCode: string, batchId: string, count: number) {
  const courseTemplates = {
    'BEME': [
      { code: 'ME301', name: 'Advanced Thermodynamics', description: 'Advanced heat transfer and energy systems' },
      { code: 'ME302', name: 'Robotics and Automation', description: 'Introduction to robotics and industrial automation' },
    ],
    'BCSE': [
      { code: 'CS301', name: 'Cloud Computing', description: 'Cloud architecture and distributed systems' },
      { code: 'CS302', name: 'Blockchain Technology', description: 'Distributed ledger and cryptocurrency concepts' },
    ],
    'BBA': [
      { code: 'BA301', name: 'International Business', description: 'Global business management and strategies' },
      { code: 'BA302', name: 'Supply Chain Management', description: 'Logistics and supply chain optimization' },
    ],
    'BPHARM': [
      { code: 'PH301', name: 'Advanced Pharmacology', description: 'Advanced drug mechanisms and interactions' },
      { code: 'PH302', name: 'Pharmaceutical Analysis', description: 'Advanced analytical techniques in pharmacy' },
    ],
  };

  const templates = courseTemplates[programCode as keyof typeof courseTemplates] || [];
  return templates.slice(0, count).map((template, index) => ({
    ...template,
    batchId,
    status: 'FUTURE',
    targetPercentage: 70.0,
    level1Threshold: 70.0,
    level2Threshold: 80.0,
    level3Threshold: 90.0,
  }));
}

generateSimpleMockData().catch(console.error);