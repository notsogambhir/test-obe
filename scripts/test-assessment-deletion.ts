// Test script to verify assessment deletion functionality
import { db } from '@/lib/db';

async function testAssessmentDeletion() {
  try {
    // 1. Get course and section
    const course = await db.course.findFirst();
    const section = await db.section.findFirst();
    
    if (!course || !section) {
      console.log('❌ No course or section found');
      return;
    }
    
    console.log('✅ Course:', course.code);
    console.log('✅ Section:', section.name);
    
    // 2. Create a test assessment
    const assessment = await db.assessment.create({
      data: {
        name: 'Frontend Test Assessment',
        type: 'quiz',
        maxMarks: 30,
        weightage: 15,
        courseId: course.id,
        sectionId: section.id,
        isActive: true,
      },
    });
    
    console.log('✅ Created assessment:', assessment.name, '(ID:', assessment.id, ')');
    
    // 3. Verify it has no questions
    const questionCount = await db.question.count({
      where: { assessmentId: assessment.id }
    });
    console.log('✅ Question count:', questionCount);
    
    // 4. Test the API endpoint logic (simulate what the backend does)
    const assessmentWithQuestions = await db.assessment.findUnique({
      where: { id: assessment.id },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });
    
    if (!assessmentWithQuestions) {
      console.log('❌ Assessment not found');
      return;
    }
    
    if (assessmentWithQuestions._count.questions > 0) {
      console.log('❌ Assessment has questions - cannot delete');
      // Clean up
      await db.assessment.delete({ where: { id: assessment.id } });
      console.log('🧹 Cleaned up test assessment');
      return;
    }
    
    console.log('✅ Assessment can be deleted (no questions)');
    
    // 5. Delete the assessment (simulate successful API call)
    await db.assessment.delete({ where: { id: assessment.id } });
    console.log('✅ Assessment deleted successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

testAssessmentDeletion();