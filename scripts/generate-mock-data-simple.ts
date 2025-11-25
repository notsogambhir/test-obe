import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Helper functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

async function generateMockData() {
  try {
    console.log('🚀 Starting mock data generation...');

    // Get existing data
    const colleges = await db.college.findMany({ where: { isActive: true } });
    const programs = await db.program.findMany({ where: { isActive: true } });
    const batches = await db.batch.findMany({ where: { isActive: true } });
    const pos = await db.pO.findMany({ where: { isActive: true } });

    console.log(`Found ${colleges.length} colleges, ${programs.length} programs, ${batches.length} batches`);

    // 1. Generate 50 students
    console.log('👥 Generating 50 students...');
    const hashedPassword = await hashPassword('student123');
    
    for (let i = 1; i <= 50; i++) {
      const program = getRandomItem(programs);
      const programBatches = batches.filter(b => b.programId === program.id);
      
      if (programBatches.length === 0) continue;
      const batch = getRandomItem(programBatches);

      await db.user.create({
        data: {
          studentId: `STU${String(i).padStart(6, '0')}`,
          email: `student${i}@college.com`,
          password: hashedPassword,
          name: `Student ${i}`,
          role: 'STUDENT',
          collegeId: program.collegeId,
          departmentId: program.departmentId,
          programId: program.id,
          batchId: batch.id,
          isActive: true
        }
      });
    }

    // 2. Generate courses for each batch
    console.log('📚 Generating courses...');
    const courseTemplates = [
      { code: 'CS101', name: 'Computer Fundamentals', type: 'BEME' },
      { code: 'CS201', name: 'Data Structures', type: 'BEME' },
      { code: 'CS301', name: 'Database Systems', type: 'BEME' },
      { code: 'EC101', name: 'Electronic Circuits', type: 'BEECE' },
      { code: 'EC201', name: 'Digital Logic', type: 'BEECE' },
      { code: 'BA101', name: 'Business Principles', type: 'BBA' },
      { code: 'BA201', name: 'Marketing Management', type: 'BBA' },
      { code: 'PH101', name: 'Pharmaceutical Chemistry', type: 'BPHARMA' },
      { code: 'PH201', name: 'Pharmacology', type: 'BPHARMA' }
    ];

    const courses = [];
    for (const batch of batches) {
      const program = programs.find(p => p.id === batch.programId);
      const programCode = program?.code;
      
      const relevantCourses = courseTemplates.filter(c => c.type === programCode);
      const numCourses = Math.min(3, relevantCourses.length);
      
      for (let i = 0; i < numCourses; i++) {
        const template = relevantCourses[i];
        const course = await db.course.create({
          data: {
            code: template.code,
            name: template.name,
            batchId: batch.id,
            description: `Course covering ${template.name.toLowerCase()}`,
            status: getRandomItem(['FUTURE', 'ACTIVE', 'COMPLETED']),
            targetPercentage: 50.0,
            level1Threshold: 50.0,
            level2Threshold: 70.0,
            level3Threshold: 80.0,
            isActive: true
          }
        });
        courses.push(course);
      }
    }

    // 3. Generate Course Outcomes
    console.log('🎯 Generating Course Outcomes...');
    for (const course of courses) {
      for (let i = 1; i <= 4; i++) {
        await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i}`,
            description: `Course Outcome ${i} for ${course.name}`,
            isActive: true
          }
        });
      }
    }

    // 4. Generate Assessments
    console.log('📝 Generating Assessments...');
    const assessments = [];
    for (const course of courses) {
      for (let i = 1; i <= 3; i++) {
        const assessment = await db.assessment.create({
          data: {
            courseId: course.id,
            name: `Assessment ${i} - ${course.name}`,
            type: i === 1 ? 'Quiz' : i === 2 ? 'Mid Term' : 'End Term',
            maxMarks: 100,
            weightage: 25.0,
            isActive: true
          }
        });
        assessments.push(assessment);
      }
    }

    // 5. Generate Questions
    console.log('❓ Generating Questions...');
    for (const assessment of assessments) {
      const courseCos = await db.cO.findMany({ where: { courseId: assessment.courseId } });
      
      for (let i = 1; i <= 5; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Question ${i} for ${assessment.name}`,
            maxMarks: 20,
            isActive: true
          }
        });

        // Map question to random CO
        const randomCo = getRandomItem(courseCos);
        await db.questionCOMapping.create({
          data: {
            questionId: question.id,
            coId: randomCo.id,
            isActive: true
          }
        });
      }
    }

    // 6. Generate Enrollments
    console.log('📋 Generating Enrollments...');
    const students = await db.user.findMany({ where: { role: 'STUDENT' } });
    
    for (const course of courses) {
      const batch = await db.batch.findUnique({ where: { id: course.batchId } });
      const batchStudents = students.filter(s => s.batchId === batch?.id);
      const numEnrollments = Math.min(10, batchStudents.length);
      
      for (let i = 0; i < numEnrollments; i++) {
        await db.enrollment.create({
          data: {
            courseId: course.id,
            studentId: batchStudents[i].id,
            isActive: true
          }
        });
      }
    }

    // 7. Generate Student Marks
    console.log('📊 Generating Student Marks...');
    const enrollments = await db.enrollment.findMany();
    const questions = await db.question.findMany();
    
    for (const enrollment of enrollments) {
      const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
      
      for (const assessment of courseAssessments) {
        const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
        
        for (const question of assessmentQuestions) {
          await db.studentMark.create({
            data: {
              questionId: question.id,
              studentId: enrollment.studentId,
              obtainedMarks: getRandomNumber(10, question.maxMarks),
              maxMarks: question.maxMarks,
              academicYear: '2023-24'
            }
          });
        }
      }
    }

    // 8. Generate CO-PO Mappings
    console.log('🔗 Generating CO-PO Mappings...');
    for (const course of courses) {
      const courseCos = await db.cO.findMany({ where: { courseId: course.id } });
      const program = programs.find(p => p.id === course.batch?.programId);
      const programPOs = pos.filter(po => po.programId === program?.id);
      
      for (const co of courseCos) {
        for (let i = 0; i < Math.min(2, programPOs.length); i++) {
          await db.cOPOMapping.create({
            data: {
              coId: co.id,
              poId: programPOs[i].id,
              courseId: course.id,
              level: getRandomNumber(1, 3),
              isActive: true
            }
          });
        }
      }
    }

    console.log('\n✅ Mock data generation completed successfully!');
    console.log('\n📊 Generated:');
    console.log('- 50 Students');
    console.log(`- ${courses.length} Courses`);
    console.log(`- ${assessments.length} Assessments`);
    console.log('- Enrollments, Marks, and CO-PO Mappings');
    
    console.log('\n🔑 Login Credentials:');
    console.log('Student: STU000001 / student123');
    console.log('Student: STU000002 / student123');
    console.log('... (STU000001 to STU000050)');

  } catch (error) {
    console.error('❌ Error generating mock data:', error);
  }
}

generateMockData();