import { db } from '@/lib/db';

async function createTestAssessmentForDeletion() {
  try {
    console.log('🔧 Creating test assessment for deletion...');
    
    // Get course and section
    const course = await db.course.findFirst();
    const section = await db.section.findFirst();
    
    if (!course || !section) {
      console.log('❌ No course or section found');
      return 'no-course';
    }
    
    // Create a test assessment with no questions
    const assessment = await db.assessment.create({
      data: {
        name: 'DELETE TEST ASSESSMENT',
        type: 'quiz',
        maxMarks: 50,
        weightage: 20,
        courseId: course.id,
        sectionId: section.id,
        isActive: true,
      },
    });
    
    console.log('✅ Created test assessment:', assessment.name, '(ID:', assessment.id, ')');
    console.log('✅ Course ID:', course.id);
    console.log('✅ Section ID:', section.id);
    
    return {
      assessmentId: assessment.id,
      courseId: course.id,
      courseName: course.name,
      sectionId: section.id,
      sectionName: section.name
    };
    
  } catch (error) {
    console.error('❌ Error creating test assessment:', error);
    return 'error';
  } finally {
    await db.$disconnect();
  }
}

createTestAssessmentForDeletion();