import { db } from '@/lib/db';

async function createTestAssessment() {
  try {
    // Get a course and section
    const course = await db.course.findFirst();
    const section = await db.section.findFirst();
    
    if (!course || !section) {
      console.log('No course or section found');
      return;
    }
    
    // Create an assessment without questions
    const assessment = await db.assessment.create({
      data: {
        name: 'Test Assessment for Deletion',
        type: 'quiz',
        maxMarks: 50,
        weightage: 10,
        courseId: course.id,
        sectionId: section.id,
        isActive: true,
      },
    });
    
    console.log('Created test assessment:', assessment);
    console.log('Course ID:', course.id);
    console.log('Section ID:', section.id);
    console.log('Assessment ID:', assessment.id);
    
  } catch (error) {
    console.error('Error creating test assessment:', error);
  } finally {
    await db.$disconnect();
  }
}

createTestAssessment();