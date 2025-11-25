import { db } from '@/lib/db';

async function completeMockData() {
  try {
    console.log('🔧 Completing mock data...');

    // Check what's missing
    const questions = await db.question.findMany();
    const enrollments = await db.enrollment.findMany();
    const studentMarks = await db.studentMark.findMany();
    const coPOMappings = await db.cOPOMapping.findMany();
    const coAttainments = await db.cOAttainment.findMany();

    console.log('📊 Current Status:');
    console.log('Questions:', questions.length);
    console.log('Enrollments:', enrollments.length);
    console.log('Student Marks:', studentMarks.length);
    console.log('CO-PO Mappings:', coPOMappings.length);
    console.log('CO Attainments:', coAttainments.length);

    // Generate Questions if missing
    if (questions.length === 0) {
      console.log('❓ Generating Questions...');
      const assessments = await db.assessment.findMany();
      
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
          if (courseCos.length > 0) {
            const randomCo = courseCos[Math.floor(Math.random() * courseCos.length)];
            await db.questionCOMapping.create({
              data: {
                questionId: question.id,
                coId: randomCo.id,
                isActive: true
              }
            });
          }
        }
      }
    }

    // Generate Enrollments if missing
    if (enrollments.length === 0) {
      console.log('📋 Generating Enrollments...');
      const students = await db.user.findMany({ where: { role: 'STUDENT' } });
      const courses = await db.course.findMany();
      
      for (const course of courses) {
        const batch = await db.batch.findUnique({ where: { id: course.batchId } });
        const batchStudents = students.filter(s => s.batchId === batch?.id);
        const numEnrollments = Math.min(15, batchStudents.length);
        
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
    }

    // Generate Student Marks if missing
    if (studentMarks.length === 0) {
      console.log('📊 Generating Student Marks...');
      const allEnrollments = await db.enrollment.findMany();
      const allQuestions = await db.question.findMany();
      const allAssessments = await db.assessment.findMany();
      
      for (const enrollment of allEnrollments) {
        const courseAssessments = allAssessments.filter(a => a.courseId === enrollment.courseId);
        
        for (const assessment of courseAssessments) {
          const assessmentQuestions = allQuestions.filter(q => q.assessmentId === assessment.id);
          
          for (const question of assessmentQuestions) {
            await db.studentMark.create({
              data: {
                questionId: question.id,
                studentId: enrollment.studentId,
                obtainedMarks: Math.floor(Math.random() * (question.maxMarks - 5)) + 5,
                maxMarks: question.maxMarks,
                academicYear: '2023-24'
              }
            });
          }
        }
      }
    }

    // Generate CO-PO Mappings if missing
    if (coPOMappings.length === 0) {
      console.log('🔗 Generating CO-PO Mappings...');
      const courses = await db.course.findMany({ include: { batch: true } });
      const programs = await db.program.findMany();
      const pos = await db.pO.findMany();
      
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
                level: Math.floor(Math.random() * 3) + 1,
                isActive: true
              }
            });
          }
        }
      }
    }

    // Generate CO Attainments if missing
    if (coAttainments.length === 0) {
      console.log('🎯 Generating CO Attainments...');
      const allEnrollments = await db.enrollment.findMany();
      
      for (const enrollment of allEnrollments) {
        const courseCos = await db.cO.findMany({ where: { courseId: enrollment.courseId } });
        
        for (const co of courseCos) {
          // Get CO attainment based on student marks
          const coQuestionMappings = await db.questionCOMapping.findMany({
            where: { coId: co.id }
          });
          
          const coQuestionIds = coQuestionMappings.map(m => m.questionId);
          const coQuestions = await db.question.findMany({
            where: { id: { in: coQuestionIds } }
          });

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
            const course = await db.course.findUnique({ where: { id: enrollment.courseId } });
            const metTarget = percentage >= (course?.targetPercentage || 50);

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
          }
        }
      }
    }

    // Final check
    const finalQuestions = await db.question.findMany();
    const finalEnrollments = await db.enrollment.findMany();
    const finalStudentMarks = await db.studentMark.findMany();
    const finalCoPOMappings = await db.cOPOMapping.findMany();
    const finalCoAttainments = await db.cOAttainment.findMany();

    console.log('\n✅ Mock data completion finished!');
    console.log('\n📊 Final Database Status:');
    console.log('Questions:', finalQuestions.length);
    console.log('Enrollments:', finalEnrollments.length);
    console.log('Student Marks:', finalStudentMarks.length);
    console.log('CO-PO Mappings:', finalCoPOMappings.length);
    console.log('CO Attainments:', finalCoAttainments.length);

  } catch (error) {
    console.error('❌ Error completing mock data:', error);
  }
}

completeMockData();