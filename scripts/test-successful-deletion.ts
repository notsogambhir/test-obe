import { db } from '@/lib/db';

async function testSuccessfulDeletion() {
  try {
    console.log('🎯 Testing successful deletion...');
    
    // Get the test assessment we just created
    const course = await db.course.findFirst();
    const section = await db.section.findFirst();
    
    if (!course || !section) {
      console.log('❌ No course or section found');
      return 'no-course';
    }
    
    console.log('✅ Course:', course.code, 'ID:', course.id);
    console.log('✅ Section:', section.name, 'ID:', section.id);
    
    // Find the test assessment
    const assessment = await db.assessment.findFirst({
      where: { name: 'TEST ASSESSMENT - NO QUESTIONS' }
    });
    
    if (!assessment) {
      console.log('❌ Test assessment not found');
      return 'not-found';
    }
    
    console.log('✅ Found test assessment:', assessment.name, '(ID:', assessment.id, ')');
    
    // Verify it has no questions
    const questionCount = await db.question.count({
      where: { assessmentId: assessment.id }
    });
    console.log('✅ Question count:', questionCount);
    
    // Test the API DELETE
    const deleteUrl = `/api/courses/${course.id}/assessments/${assessment.id}`;
    console.log('🔄 Testing DELETE URL:', deleteUrl);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ Delete successful:', responseData);
      
      // Verify it's actually deleted
      const deletedAssessment = await db.assessment.findFirst({
        where: { name: 'TEST ASSESSMENT - NO QUESTIONS' }
      });
      
      if (!deletedAssessment) {
        console.log('❌ Assessment still exists - deletion failed');
        return 'delete-failed';
      }
      
      console.log('✅ Assessment successfully deleted from database');
      return 'success';
    } else {
      const errorText = await response.text();
      console.log('❌ Delete failed:', errorText);
      return 'delete-failed';
    }
    
  } catch (error) {
    console.error('❌ Exception during test:', error);
    return 'exception';
  } finally {
    await db.$disconnect();
  }
}

testSuccessfulDeletion();