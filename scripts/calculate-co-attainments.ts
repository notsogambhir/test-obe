import { db } from '@/lib/db';

async function calculateCOAttainments() {
  try {
    console.log('🎯 Calculating CO Attainments...');
    
    // Get all data
    const students = await db.user.findMany({
      where: { role: 'STUDENT' },
      take: 10 // Limit to first 10 students
    });
    
    const enrollments = await db.enrollment.findMany({
      where: { studentId: { in: students.map(s => s.id) } }
    });
    
    const cos = await db.cO.findMany();
    const courses = await db.course.findMany();
    
    // Get Question-CO mappings and student marks
    const questionCOMappings = await db.questionCOMapping.findMany();
    const studentMarks = await db.studentMark.findMany({
      where: { studentId: { in: students.map(s => s.id) } }
    });
    
    console.log(`Processing ${students.length} students, ${enrollments.length} enrollments`);
    
    // Calculate CO attainments
    for (const student of students) {
      const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
      
      for (const enrollment of studentEnrollments) {
        const courseCOs = cos.filter(co => co.courseId === enrollment.courseId);
        
        for (const co of courseCOs) {
          // Find questions mapped to this CO
          const coQuestions = questionCOMappings
            .filter(qcm => qcm.coId === co.id)
            .map(qcm => qcm.questionId);
          
          // Get student marks for these questions
          const coStudentMarks = studentMarks.filter(sm => 
            coQuestions.includes(sm.questionId) && sm.studentId === student.id
          );
          
          if (coStudentMarks.length > 0) {
            const totalObtained = coStudentMarks.reduce((sum, mark) => sum + mark.obtainedMarks, 0);
            const totalMax = coStudentMarks.reduce((sum, mark) => sum + mark.maxMarks, 0);
            const percentage = (totalObtained / totalMax) * 100;
            
            const course = courses.find(c => c.id === enrollment.courseId);
            const targetPercentage = course?.targetPercentage || 60.0;
            
            // Check if attainment already exists
            const existing = await db.cOAttainment.findFirst({
              where: {
                courseId: enrollment.courseId,
                coId: co.id,
                studentId: student.id,
                academicYear: '2023-24'
              }
            });
            
            if (!existing) {
              await db.cOAttainment.create({
                data: {
                  courseId: enrollment.courseId,
                  coId: co.id,
                  studentId: student.id,
                  percentage,
                  metTarget: percentage >= targetPercentage,
                  academicYear: '2023-24',
                }
              });
            }
          }
        }
      }
    }
    
    const totalAttainments = await db.cOAttainment.count();
    console.log(`✅ Created ${totalAttainments} CO attainments`);
    
  } catch (error) {
    console.error('❌ Error calculating CO attainments:', error);
  } finally {
    await db.$disconnect();
  }
}

calculateCOAttainments();