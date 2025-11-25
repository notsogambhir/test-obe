import { db } from '@/lib/db';

async function testDeleteAPI() {
  try {
    // 1. Get a test assessment
    const course = await db.course.findFirst();
    const section = await db.section.findFirst();
    
    if (!course || !section) {
      console.log('❌ No course or section found');
      return;
    }
    
    console.log('✅ Course:', course.code, 'ID:', course.id);
    console.log('✅ Section:', section.name, 'ID:', section.id);
    
    // 2. Create a test assessment
    const assessment = await db.assessment.create({
      data: {
        name: 'API Test Assessment',
        type: 'quiz',
        maxMarks: 25,
        weightage: 10,
        courseId: course.id,
        sectionId: section.id,
        isActive: true,
      },
    });
    
    console.log('✅ Created assessment:', assessment.name, 'ID:', assessment.id);
    
    // 3. Test the API DELETE call exactly as the frontend does
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
      console.log('✅ Delete response:', responseData);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
    // 4. Clean up
    await db.assessment.delete({
      where: { id: assessment.id }
    });
    console.log('🧹 Cleaned up test assessment');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  } finally {
    await db.$disconnect();
  }
}

testDeleteAPI();