import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Helper function to generate random data
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Sample data arrays
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Cameron', 'Drew', 'Blake', 'Avery', 'Quinn', 'Sage', 'River', 'Skyler', 'Phoenix', 'Reese', 'Emery', 'Kai', 'Lane'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'];

async function generateAdditionalMockData() {
  try {
    console.log('Starting additional mock data generation...');

    // Get existing data
    const colleges = await db.college.findMany({ where: { isActive: true } });
    const departments = await db.department.findMany({ where: { isActive: true } });
    const programs = await db.program.findMany({ where: { isActive: true } });
    const batches = await db.batch.findMany({ where: { isActive: true } });
    const courses = await db.course.findMany({ where: { isActive: true } });
    const cos = await db.cO.findMany({ where: { isActive: true } });
    const assessments = await db.assessment.findMany({ where: { isActive: true } });
    const questions = await db.question.findMany({ where: { isActive: true } });

    console.log(`Found ${colleges.length} colleges, ${departments.length} departments, ${programs.length} programs, ${batches.length} batches`);
    console.log(`Found ${courses.length} courses, ${cos.length} COs, ${assessments.length} assessments, ${questions.length} questions`);

    // Generate additional students
    console.log('Generating additional students...');
    const students = [];
    const hashedPassword = await hashPassword('student123');

    // Find the highest existing student ID
    const existingStudents = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: { studentId: true },
      orderBy: { studentId: 'desc' }
    });
    
    let startId = 201; // Default start
    if (existingStudents.length > 0) {
      const highestId = existingStudents[0].studentId;
      const numericId = parseInt(highestId.replace('STU', ''));
      startId = numericId + 1;
    }
    
    console.log(`Starting student generation from ID: STU${String(startId).padStart(6, '0')}`);

    for (let i = startId; i <= startId + 49; i++) { // Generate 50 more students
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);
      const program = getRandomItem(programs);
      const programBatches = batches.filter(b => b.programId === program.id);
      
      if (programBatches.length === 0) continue;
      
      const batch = getRandomItem(programBatches);

      try {
        const student = await db.user.create({
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
        students.push(student);
      } catch (error) {
        console.log(`Student with ID STU${String(i).padStart(6, '0')} already exists, skipping...`);
      }
    }

    console.log(`Generated ${students.length} additional students`);

    // Get all students including existing ones
    const allStudents = await db.user.findMany({ 
      where: { role: 'STUDENT', isActive: true }
    });
    console.log(`Total students available: ${allStudents.length}`);

    // Generate Enrollments
    console.log('Generating Enrollments...');
    const enrollments = [];
    
    for (const course of courses) {
      const batch = await db.batch.findUnique({ where: { id: course.batchId } });
      const batchStudents = allStudents.filter(s => s.batchId === batch?.id);
      const numEnrollments = getRandomNumber(Math.floor(batchStudents.length * 0.7), batchStudents.length);
      const selectedStudents = getRandomItems(batchStudents, numEnrollments);
      
      for (const student of selectedStudents) {
        try {
          const enrollment = await db.enrollment.create({
            data: {
              courseId: course.id,
              studentId: student.id,
              isActive: true
            }
          });
          enrollments.push(enrollment);
        } catch (error) {
          // Enrollment might already exist
        }
      }
    }

    console.log(`Generated ${enrollments.length} enrollments`);

    // Generate Student Marks
    console.log('Generating Student Marks...');
    const marks = [];
    
    for (const enrollment of enrollments) {
      const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
      
      for (const assessment of courseAssessments) {
        const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
        
        for (const question of assessmentQuestions) {
          try {
            const mark = await db.studentMark.create({
              data: {
                questionId: question.id,
                studentId: enrollment.studentId,
                obtainedMarks: getRandomNumber(Math.floor(question.maxMarks * 0.3), question.maxMarks),
                maxMarks: question.maxMarks,
                academicYear: '2023-24'
              }
            });
            marks.push(mark);
          } catch (error) {
            // Mark might already exist
          }
        }
      }
    }

    console.log(`Generated ${marks.length} student marks`);

    // Generate CO Attainment data
    console.log('Generating CO Attainment data...');
    
    for (const enrollment of enrollments) {
      const courseCos = cos.filter(co => co.courseId === enrollment.courseId);
      
      for (const co of courseCos) {
        // Calculate attainment based on student marks
        const coQuestionMappings = await db.questionCOMapping.findMany({
          where: { coId: co.id }
        });
        
        const coQuestionIds = coQuestionMappings.map(m => m.questionId);
        const coQuestions = questions.filter(q => coQuestionIds.includes(q.id));

        if (coQuestions.length > 0) {
          let totalObtained = 0;
          let totalMax = 0;

          for (const question of coQuestions) {
            const studentMark = await db.studentMark.findFirst({
              where: {
                questionId: question.id,
                studentId: enrollment.studentId
              }
            });

            if (studentMark) {
              totalObtained += studentMark.obtainedMarks;
              totalMax += studentMark.maxMarks;
            }
          }

          const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
          const metTarget = percentage >= 50; // Simple threshold

          try {
            await db.cOAttainment.create({
              data: {
                courseId: enrollment.courseId,
                coId: co.id,
                studentId: enrollment.studentId,
                percentage: percentage,
                metTarget: metTarget,
                academicYear: '2023-24'
              }
            });
          } catch (error) {
            // CO attainment might already exist
          }
        }
      }
    }

    console.log('Generated CO Attainment data');
    console.log('Additional mock data generation completed successfully!');

  } catch (error) {
    console.error('Error generating additional mock data:', error);
  }
}

generateAdditionalMockData();