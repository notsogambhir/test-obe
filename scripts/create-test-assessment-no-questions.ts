import { db } from '@/lib/db';

async function createTestAssessmentWithoutQuestions() {
  try {
    console.log('🔧 Creating test assessment without questions...');
    
    // Get course and section
    const course = await db.course.findFirst();
    const section = await db.section.findFirst();
    
    if (!course || !section) {
      console.log('❌ No course or section found');
      return;
    }
    
    console.log('✅ Course:', course.code, 'ID:', course.id);
    console.log('✅ Section:', section.name, 'ID:', section.id);
    
    // Create a test assessment with no questions
    const assessment = await db.assessment.create({
      data: {
        name: 'TEST ASSESSMENT - NO QUESTIONS',
        type: 'quiz',
        maxMarks: 50,
        weightage: 25,
        courseId: course.id,
        sectionId: section.id,
        isActive: true,
      },
    });
    
    console.log('✅ Created test assessment:', assessment.name, '(ID:', assessment.id, ')');
    
    // Verify it has no questions
    const questionCount = await db.question.count({
      where: { assessmentId: assessment.id }
    });
    console.log('✅ Question count:', questionCount);
    
    console.log('🎯 This assessment can be deleted (no questions)');
    
    return {
      assessmentId: assessment.id,
      courseId: course.id,
      courseName: course.name,
      sectionId: section.id,
      sectionName: section.name,
      assessmentName: assessment.name
    };
    
  } catch (error) {
    console.error('❌ Error creating test assessment:', error);
  } finally {
    await db.$disconnect();
  }
}

createTestAssessmentWithoutQuestions();