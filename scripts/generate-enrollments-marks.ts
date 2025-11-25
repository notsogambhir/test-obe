import { db } from '@/lib/db';

async function generateEnrollmentsAndMarks() {
  try {
    console.log('Generating enrollments and student marks...');

    // Get existing data
    const students = await db.user.findMany({ where: { role: 'STUDENT' } });
    const courses = await db.course.findMany();
    const assessments = await db.assessment.findMany();
    const questions = await db.question.findMany();
    const cos = await db.cO.findMany();

    console.log(`Found ${students.length} students, ${courses.length} courses, ${assessments.length} assessments`);

    // Generate enrollments
    console.log('Generating enrollments...');
    let enrollmentCount = 0;
    
    for (const course of courses) {
      const batch = await db.batch.findUnique({ where: { id: course.batchId } });
      const batchStudents = students.filter(s => s.batchId === batch?.id);
      
      // Enroll 60-80% of students from each batch
      const numEnrollments = Math.floor(batchStudents.length * (0.6 + Math.random() * 0.2));
      const selectedStudents = batchStudents.slice(0, numEnrollments);
      
      for (const student of selectedStudents) {
        try {
          await db.enrollment.create({
            data: {
              courseId: course.id,
              studentId: student.id,
              isActive: true
            }
          });
          enrollmentCount++;
        } catch (error) {
          // Skip if enrollment already exists
          continue;
        }
      }
    }

    console.log(`Generated ${enrollmentCount} enrollments`);

    // Generate student marks
    console.log('Generating student marks...');
    let markCount = 0;
    const enrollments = await db.enrollment.findMany();
    
    for (const enrollment of enrollments) {
      const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
      
      for (const assessment of courseAssessments) {
        const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
        
        for (const question of assessmentQuestions) {
          // Generate realistic marks (40% to 95% of max marks)
          const percentage = 0.4 + Math.random() * 0.55;
          const obtainedMarks = Math.floor(question.maxMarks * percentage);
          
          try {
            await db.studentMark.create({
              data: {
                questionId: question.id,
                studentId: enrollment.studentId,
                obtainedMarks,
                maxMarks: question.maxMarks,
                academicYear: '2023-24'
              }
            });
            markCount++;
          } catch (error) {
            // Skip if mark already exists
            continue;
          }
        }
      }
    }

    console.log(`Generated ${markCount} student marks`);

    // Generate CO Attainments
    console.log('Generating CO Attainments...');
    let attainmentCount = 0;
    
    for (const enrollment of enrollments) {
      const courseCos = cos.filter(co => co.courseId === enrollment.courseId);
      
      for (const co of courseCos) {
        // Get CO-Question mappings
        const coQuestionMappings = await db.questionCOMapping.findMany({
          where: { coId: co.id }
        });
        
        if (coQuestionMappings.length === 0) continue;
        
        // Calculate attainment based on student marks
        let totalObtained = 0;
        let totalMax = 0;

        for (const mapping of coQuestionMappings) {
          const studentMark = await db.studentMark.findFirst({
            where: {
              questionId: mapping.questionId,
              studentId: enrollment.studentId
            }
          });

          if (studentMark) {
            totalObtained += studentMark.obtainedMarks;
            totalMax += studentMark.maxMarks;
          }
        }

        if (totalMax > 0) {
          const percentage = (totalObtained / totalMax) * 100;
          const course = await db.course.findUnique({ where: { id: enrollment.courseId } });
          const metTarget = percentage >= (course?.targetPercentage || 50);

          try {
            await db.cOAttainment.create({
              data: {
                courseId: enrollment.courseId,
                coId: co.id,
                studentId: enrollment.studentId,
                percentage: parseFloat(percentage.toFixed(2)),
                metTarget,
                academicYear: '2023-24'
              }
            });
            attainmentCount++;
          } catch (error) {
            // Skip if attainment already exists
            continue;
          }
        }
      }
    }

    console.log(`Generated ${attainmentCount} CO attainments`);

    console.log('\n✅ Mock data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Enrollments: ${enrollmentCount}`);
    console.log(`- Student Marks: ${markCount}`);
    console.log(`- CO Attainments: ${attainmentCount}`);

  } catch (error) {
    console.error('Error generating mock data:', error);
  }
}

generateEnrollmentsAndMarks();