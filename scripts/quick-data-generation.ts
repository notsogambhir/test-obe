import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Helper function to generate random data
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function quickDataGeneration() {
  try {
    console.log('Starting quick data generation...');

    // Get existing data
    const programs = await db.program.findMany({ where: { isActive: true } });
    const batches = await db.batch.findMany({ where: { isActive: true } });
    const courses = await db.course.findMany({ where: { isActive: true } });
    const assessments = await db.assessment.findMany({ where: { isActive: true } });
    const questions = await db.question.findMany({ where: { isActive: true } });
    const cos = await db.cO.findMany({ where: { isActive: true } });

    console.log(`Found ${programs.length} programs, ${batches.length} batches, ${courses.length} courses`);
    console.log(`Found ${assessments.length} assessments, ${questions.length} questions, ${cos.length} COs`);

    // Get all students
    const allStudents = await db.user.findMany({ 
      where: { role: 'STUDENT', isActive: true }
    });
    console.log(`Found ${allStudents.length} students`);

    // Generate Enrollments - limit to first 20 courses to speed up
    console.log('Generating Enrollments...');
    const enrollments = [];
    const limitedCourses = courses.slice(0, 20);
    
    for (const course of limitedCourses) {
      const batch = await db.batch.findUnique({ where: { id: course.batchId } });
      const batchStudents = allStudents.filter(s => s.batchId === batch?.id);
      const numEnrollments = Math.min(10, batchStudents.length); // Limit to 10 per course
      const selectedStudents = batchStudents.slice(0, numEnrollments);
      
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

    // Generate Student Marks - limit to first 100 enrollments
    console.log('Generating Student Marks...');
    const limitedEnrollments = enrollments.slice(0, 100);
    
    for (const enrollment of limitedEnrollments) {
      const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
      const limitedAssessments = courseAssessments.slice(0, 2); // Limit to 2 assessments per enrollment
      
      for (const assessment of limitedAssessments) {
        const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
        const limitedQuestions = assessmentQuestions.slice(0, 3); // Limit to 3 questions per assessment
        
        for (const question of limitedQuestions) {
          try {
            await db.studentMark.create({
              data: {
                questionId: question.id,
                studentId: enrollment.studentId,
                obtainedMarks: getRandomNumber(Math.floor(question.maxMarks * 0.5), question.maxMarks),
                maxMarks: question.maxMarks,
                academicYear: '2023-24'
              }
            });
          } catch (error) {
            // Mark might already exist
          }
        }
      }
    }

    console.log('Generated student marks');

    // Generate CO Attainment data - limit to first 50 enrollments
    console.log('Generating CO Attainment data...');
    const limitedEnrollmentsForCO = enrollments.slice(0, 50);
    
    for (const enrollment of limitedEnrollmentsForCO) {
      const courseCos = cos.filter(co => co.courseId === enrollment.courseId);
      const limitedCOs = courseCos.slice(0, 3); // Limit to 3 COs per enrollment
      
      for (const co of limitedCOs) {
        try {
          await db.cOAttainment.create({
            data: {
              courseId: enrollment.courseId,
              coId: co.id,
              studentId: enrollment.studentId,
              percentage: getRandomNumber(45, 95),
              metTarget: true,
              academicYear: '2023-24'
            }
          });
        } catch (error) {
          // CO attainment might already exist
        }
      }
    }

    console.log('Generated CO Attainment data');
    console.log('Quick data generation completed successfully!');

  } catch (error) {
    console.error('Error in quick data generation:', error);
  }
}

quickDataGeneration();