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

// Sample data
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const courseData = {
  'BEME': [
    { code: 'CS101', name: 'Programming for Problem Solving' },
    { code: 'CS201', name: 'Data Structures' },
    { code: 'CS202', name: 'Database Management Systems' },
    { code: 'CS203', name: 'Operating Systems' },
    { code: 'CS204', name: 'Computer Networks' },
    { code: 'CS205', name: 'Software Engineering' }
  ],
  'BEECE': [
    { code: 'EC101', name: 'Electronic Devices' },
    { code: 'EC102', name: 'Digital Logic Design' },
    { code: 'EC103', name: 'Signals and Systems' },
    { code: 'EC104', name: 'Microprocessors' },
    { code: 'EC105', name: 'Analog Communication' },
    { code: 'EC106', name: 'Digital Communication' }
  ],
  'BBA': [
    { code: 'BA101', name: 'Business Mathematics' },
    { code: 'BA102', name: 'Financial Accounting' },
    { code: 'BA103', name: 'Management Principles' },
    { code: 'BA104', name: 'Business Law' },
    { code: 'BA105', name: 'Marketing Management' },
    { code: 'BA106', name: 'Human Resource Management' }
  ]
};

const assessmentTypes = ['Quiz', 'Assignment', 'Mid Term', 'End Term'];

async function generateMockData() {
  try {
    console.log('Starting mock data generation...');

    // Get existing data
    const programs = await db.program.findMany({ where: { isActive: true } });
    const batches = await db.batch.findMany({ where: { isActive: true } });
    const pos = await db.pO.findMany({ where: { isActive: true } });

    // Generate students (50 instead of 200 for faster execution)
    console.log('Generating 50 students...');
    const hashedPassword = await hashPassword('student123');
    
    for (let i = 1; i <= 50; i++) {
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);
      const program = getRandomItem(programs);
      const programBatches = batches.filter(b => b.programId === program.id);
      
      if (programBatches.length === 0) continue;
      const batch = getRandomItem(programBatches);

      await db.user.create({
        data: {
          studentId: `STU${String(i).padStart(6, '0')}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.com`,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          role: 'STUDENT',
          collegeId: program.collegeId,
          departmentId: program.departmentId,
          programId: program.id,
          batchId: batch.id,
          isActive: true
        }
      });
    }

    // Generate courses
    console.log('Generating courses...');
    for (const batch of batches) {
      const program = programs.find(p => p.id === batch.programId);
      if (!program) continue;

      const programCode = program.code;
      const courses = courseData[programCode as keyof typeof courseData] || [];
      
      for (const courseInfo of courses.slice(0, 4)) { // Limit to 4 courses per batch
        await db.course.create({
          data: {
            code: courseInfo.code,
            name: courseInfo.name,
            batchId: batch.id,
            description: `Comprehensive course on ${courseInfo.name.toLowerCase()}.`,
            status: getRandomItem(['FUTURE', 'ACTIVE', 'COMPLETED']),
            targetPercentage: getRandomFloat(45, 65),
            level1Threshold: getRandomFloat(45, 55),
            level2Threshold: getRandomFloat(65, 75),
            level3Threshold: getRandomFloat(75, 85),
            isActive: true
          }
        });
      }
    }

    // Generate Course Outcomes
    console.log('Generating Course Outcomes...');
    const courses = await db.course.findMany();
    for (const course of courses) {
      for (let i = 1; i <= 4; i++) {
        await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i}`,
            description: `Understand and apply concepts related to ${course.name.toLowerCase()} (CO${i}).`,
            isActive: true
          }
        });
      }
    }

    // Generate Assessments
    console.log('Generating Assessments...');
    for (const course of courses) {
      for (let i = 1; i <= 3; i++) {
        await db.assessment.create({
          data: {
            courseId: course.id,
            name: `${getRandomItem(assessmentTypes)} ${i} - ${course.name}`,
            type: getRandomItem(assessmentTypes),
            maxMarks: getRandomNumber(50, 100),
            weightage: getRandomFloat(10, 30),
            isActive: true
          }
        });
      }
    }

    // Generate Questions and CO-PO Mappings
    console.log('Generating Questions and CO-PO Mappings...');
    const assessments = await db.assessment.findMany();
    const cos = await db.cO.findMany();
    
    for (const assessment of assessments) {
      const courseCos = cos.filter(co => co.courseId === assessment.courseId);
      
      for (let i = 1; i <= 5; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Question ${i}: Solve the problem related to ${assessment.courseId}.`,
            maxMarks: getRandomNumber(10, 20),
            isActive: true
          }
        });

        // Map question to COs
        const selectedCOs = courseCos.slice(0, 2);
        for (const co of selectedCOs) {
          await db.questionCOMapping.create({
            data: {
              questionId: question.id,
              coId: co.id,
              isActive: true
            }
          });
        }
      }
    }

    // Generate CO-PO Mappings
    console.log('Generating CO-PO Mappings...');
    for (const course of courses) {
      const courseCos = cos.filter(co => co.courseId === course.id);
      const program = programs.find(p => p.id === course.batch.programId);
      const programPOs = pos.filter(po => po.programId === program?.id);
      
      for (const co of courseCos) {
        for (let i = 0; i < 2 && i < programPOs.length; i++) {
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

    // Generate Enrollments
    console.log('Generating Enrollments...');
    const students = await db.user.findMany({ where: { role: 'STUDENT' } });
    
    for (const course of courses) {
      const batch = await db.batch.findUnique({ where: { id: course.batchId } });
      const batchStudents = students.filter(s => s.batchId === batch?.id);
      const numEnrollments = Math.min(10, batchStudents.length); // Limit enrollments
      
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

    // Generate Student Marks and CO Attainments
    console.log('Generating Student Marks and CO Attainments...');
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
              obtainedMarks: getRandomNumber(Math.floor(question.maxMarks * 0.4), question.maxMarks),
              maxMarks: question.maxMarks,
              academicYear: '2023-24'
            }
          });
        }
      }
    }

    console.log('✅ Mock data generation completed successfully!');
    console.log('\n📊 Generated:');
    console.log('- 50 Students');
    console.log('- Courses with COs');
    console.log('- Assessments and Questions');
    console.log('- CO-PO Mappings');
    console.log('- Enrollments and Marks');
    console.log('\n🔑 Student Login: STU000001 / student123');

  } catch (error) {
    console.error('Error generating mock data:', error);
  }
}

generateMockData();