import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function generateAdditionalMockData() {
  try {
    console.log('🌱 Starting additional mock data generation...');
    
    // Get existing data
    const existingColleges = await db.college.findMany();
    const existingPrograms = await db.program.findMany({ include: { college: true, batches: true } });
    const existingUsers = await db.user.findMany({ where: { role: { in: ['TEACHER', 'PROGRAM_COORDINATOR'] } } });
    
    console.log(`Found ${existingColleges.length} colleges, ${existingPrograms.length} programs, ${existingUsers.length} users`);

    // Create additional Teachers for all programs
    console.log('👨‍🏫 Creating additional teachers...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const newTeachers = [];
    const usedEmployeeIds = new Set();
    for (const program of existingPrograms) {
      const teacherCount = 3; // 3 teachers per program
      for (let i = 0; i < teacherCount; i++) {
        let employeeId = `TCH${String(newTeachers.length + i + 1).padStart(3, '0')}`;
        // Ensure uniqueness
        while (usedEmployeeIds.has(employeeId)) {
          employeeId = `TCH${String(Date.now() + i).padStart(3, '0')}`;
        }
        usedEmployeeIds.add(employeeId);
        
        newTeachers.push({
          email: `teacher.${program.code.toLowerCase()}${i + 1}@obeportal.com`,
          name: `${program.name} Teacher ${i + 1}`,
          employeeId,
          password: hashedPassword,
          role: 'TEACHER',
          collegeId: program.collegeId,
          programId: program.id,
          isActive: true
        });
      }
    }

    if (newTeachers.length > 0) {
      await db.user.createMany({ data: newTeachers });
      console.log(`✅ Created ${newTeachers.length} additional teachers`);
    }

    // Create additional Program Coordinators
    console.log('👨‍💼 Creating additional program coordinators...');
    const newCoordinators = [];
    const usedCoordinatorIds = new Set();
    for (const program of existingPrograms) {
      const existingCoordinator = existingUsers.find(u => u.programId === program.id && u.role === 'PROGRAM_COORDINATOR');
      if (!existingCoordinator) {
        let employeeId = `PC${String(newCoordinators.length + 1).padStart(3, '0')}`;
        // Ensure uniqueness
        while (usedCoordinatorIds.has(employeeId)) {
          employeeId = `PC${String(Date.now()).padStart(3, '0')}`;
        }
        usedCoordinatorIds.add(employeeId);
        
        newCoordinators.push({
          email: `pc.${program.code.toLowerCase()}@obeportal.com`,
          name: `${program.name} Program Coordinator`,
          employeeId,
          password: hashedPassword,
          role: 'PROGRAM_COORDINATOR',
          collegeId: program.collegeId,
          programId: program.id,
          isActive: true
        });
      }
    }

    if (newCoordinators.length > 0) {
      await db.user.createMany({ data: newCoordinators });
      console.log(`✅ Created ${newCoordinators.length} additional program coordinators`);
    }

    // Create additional courses for each batch
    console.log('📚 Creating additional courses...');
    const newCourses = [];
    
    for (const program of existingPrograms) {
      const batches = await db.batch.findMany({ where: { programId: program.id } });
      for (const batch of batches) {
        const existingCourses = await db.course.findMany({ where: { batchId: batch.id } });
        
        // Add 2-3 more courses per batch
        const additionalCourses = generateAdditionalCoursesForProgram(program.code, batch.id, existingCourses.length);
        newCourses.push(...additionalCourses);
      }
    }

    if (newCourses.length > 0) {
      await db.course.createMany({ data: newCourses });
      console.log(`✅ Created ${newCourses.length} additional courses`);
    }

    // Create COs for new courses
    console.log('🎯 Creating Course Outcomes for new courses...');
    const newCOs = [];
    for (const course of newCourses) {
      const cos = generateCOsForCourse(course.code);
      newCOs.push(...cos.map(co => ({ ...co, courseId: course.id })));
    }

    if (newCOs.length > 0) {
      await db.cO.createMany({ data: newCOs });
      console.log(`✅ Created ${newCOs.length} additional Course Outcomes`);
    }

    // Create students for new batches
    console.log('👨‍🎓 Creating additional students...');
    const newStudents = [];
    let studentCounter = existingUsers.filter(u => u.role === 'STUDENT').length + 1;
    
    for (const program of existingPrograms) {
      const batches = program.batches || [];
      for (const batch of batches) {
        const batchSize = Math.floor(Math.random() * 20) + 15; // 15-35 students per batch
        for (let i = 0; i < batchSize; i++) {
          newStudents.push({
            email: `student${String(studentCounter++).padStart(3, '0')}@obeportal.com`,
            studentId: `STU${String(studentCounter - 1).padStart(4, '0')}`,
            name: `Student ${studentCounter - 1}`,
            password: hashedPassword,
            role: 'STUDENT',
            collegeId: program.collegeId,
            programId: program.id,
            batchId: batch.id,
            isActive: true
          });
        }
      }
    }

    if (newStudents.length > 0) {
      await db.user.createMany({ data: newStudents });
      console.log(`✅ Created ${newStudents.length} additional students`);
    }

    // Create enrollments for new courses
    console.log('📋 Creating enrollments for new courses...');
    const newEnrollments = [];
    for (const course of newCourses) {
      const courseStudents = newStudents.filter(s => s.batchId === course.batchId);
      newEnrollments.push(...courseStudents.map(student => ({
        courseId: course.id,
        studentId: student.id,
        isActive: true
      })));
    }

    if (newEnrollments.length > 0) {
      await db.enrollment.createMany({ data: newEnrollments });
      console.log(`✅ Created ${newEnrollments.length} additional enrollments`);
    }

    console.log('🎉 Additional mock data generation completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`- ${newTeachers.length} Additional Teachers`);
    console.log(`- ${newCoordinators.length} Additional Program Coordinators`);
    console.log(`- ${newCourses.length} Additional Courses`);
    console.log(`- ${newCOs.length} Additional Course Outcomes`);
    console.log(`- ${newStudents.length} Additional Students`);
    console.log(`- ${newEnrollments.length} Additional Enrollments`);
    
  } catch (error) {
    console.error('❌ Error generating additional mock data:', error);
  } finally {
    await db.$disconnect();
  }
}

function generateAdditionalCoursesForProgram(programCode: string, batchId: string, existingCount: number) {
  const courseTemplates = {
    'BEME': [
      { code: 'ME201', name: 'Advanced Engineering Mathematics', description: 'Advanced calculus and engineering mathematics' },
      { code: 'ME202', name: 'Mechanical Design Lab', description: 'Hands-on mechanical design experience' },
      { code: 'ME203', name: 'Control Systems', description: 'Control theory and automation systems' },
    ],
    'BCSE': [
      { code: 'CS201', name: 'Web Technologies', description: 'Modern web development frameworks and tools' },
      { code: 'CS202', name: 'Artificial Intelligence', description: 'Introduction to AI and machine learning concepts' },
      { code: 'CS203', name: 'Cybersecurity', description: 'Network security and information protection' },
    ],
    'BBA': [
      { code: 'BA201', name: 'Digital Marketing', description: 'Online marketing strategies and analytics' },
      { code: 'BA202', name: 'Business Analytics', description: 'Data analysis for business decision making' },
      { code: 'BA203', name: 'Entrepreneurship', description: 'Starting and managing new business ventures' },
    ],
    'BPHARM': [
      { code: 'PH201', name: 'Clinical Pharmacy', description: 'Patient care and medication management' },
      { code: 'PH202', name: 'Pharmaceutical Biotechnology', description: 'Biotechnology applications in pharmacy' },
      { code: 'PH203', name: 'Drug Regulatory Affairs', description: 'Regulatory requirements for pharmaceuticals' },
    ],
  };

  const templates = courseTemplates[programCode as keyof typeof courseTemplates] || [];
  return templates.map((template, index) => ({
    ...template,
    batchId,
    status: 'FUTURE',
    targetPercentage: 65.0 + Math.random() * 15, // 65-80%
    level1Threshold: 65.0,
    level2Threshold: 75.0,
    level3Threshold: 85.0,
  }));
}

function generateCOsForCourse(courseCode: string) {
  const baseCOs = {
    'ME': [
      { code: 'ME201-CO1', description: 'Apply advanced mathematical methods to solve complex engineering problems' },
      { code: 'ME201-CO2', description: 'Design and analyze control systems for mechanical applications' },
      { code: 'ME202-CO1', description: 'Design mechanical systems using CAD and simulation tools' },
      { code: 'ME202-CO2', description: 'Implement control strategies for mechanical processes' },
    ],
    'CS': [
      { code: 'CS201-CO1', description: 'Develop responsive web applications using modern frameworks' },
      { code: 'CS201-CO2', description: 'Implement AI algorithms for practical problem solving' },
      { code: 'CS202-CO1', description: 'Apply machine learning techniques to real-world datasets' },
      { code: 'CS202-CO2', description: 'Evaluate and compare different AI model performance' },
    ],
    'BA': [
      { code: 'BA201-CO1', description: 'Design and implement digital marketing campaigns' },
      { code: 'BA201-CO2', description: 'Analyze marketing data using business intelligence tools' },
      { code: 'BA202-CO1', description: 'Apply statistical methods to business problems' },
      { code: 'BA202-CO2', description: 'Interpret business analytics results for strategic planning' },
    ],
    'PH': [
      { code: 'PH201-CO1', description: 'Provide patient-centered pharmaceutical care' },
      { code: 'PH201-CO2', description: 'Apply clinical knowledge in patient counseling' },
      { code: 'PH202-CO1', description: 'Use biotechnology tools for drug development' },
      { code: 'PH202-CO2', description: 'Ensure compliance with pharmaceutical regulations' },
    ],
  };

  const prefix = courseCode.substring(0, 2);
  const cos = baseCOs[prefix as keyof typeof baseCOs] || baseCOs['ME'];
  return cos.map(co => ({ ...co, isActive: true }));
}

generateAdditionalMockData().catch(console.error);