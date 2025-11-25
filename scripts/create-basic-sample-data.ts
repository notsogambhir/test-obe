import { db } from '../src/lib/db';

async function createBasicSampleData() {
  try {
    console.log('Creating basic sample data...');

    // Get the sample course
    const course = await db.course.findFirst({
      where: { code: 'CS101' }
    });

    if (!course) {
      console.error('Course not found');
      return;
    }

    console.log(`Found course: ${course.code}`);

    // Get COs
    const cos = await db.cO.findMany({
      where: { courseId: course.id }
    });

    console.log(`Found ${cos.length} COs`);

    // Create one simple assessment
    const assessment = await db.assessment.create({
      data: {
        courseId: course.id,
        name: 'Mid Term Exam',
        type: 'exam',
        maxMarks: 100,
        weightage: 30,
        isActive: true
      }
    });

    console.log('Created assessment');

    // Create questions for each CO
    for (const co of cos) {
      await db.question.create({
        data: {
          assessmentId: assessment.id,
          question: `Question for ${co.code}`,
          maxMarks: 20,
          isActive: true,
          coMappings: {
            create: {
              coId: co.id,
              isActive: true
            }
          }
        }
      });
    }

    console.log('Created questions');

    // Get students
    const enrollments = await db.enrollment.findMany({
      where: { courseId: course.id },
      include: { student: true }
    });

    console.log(`Found ${enrollments.length} students`);

    // Create sample marks
    for (const enrollment of enrollments) {
      const questions = await db.question.findMany({
        where: { assessmentId: assessment.id }
      });

      for (const question of questions) {
        const marks = Math.floor(Math.random() * 15) + 5; // 5-20 marks
        await db.studentMark.create({
          data: {
            questionId: question.id,
            studentId: enrollment.student.id,
            obtainedMarks: marks,
            maxMarks: question.maxMarks,
            academicYear: '2024-2025',
            semester: '1'
          }
        });
      }
    }

    console.log('Created student marks');
    console.log('✅ Basic sample data created successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

createBasicSampleData();