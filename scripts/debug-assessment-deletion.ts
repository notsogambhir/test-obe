import { db } from '@/lib/db';

async function debugAssessmentDeletion() {
  try {
    // 1. Get all assessments with their IDs
    const assessments = await db.assessment.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { questions: true }
        }
      }
    });
    
    console.log('📋 All assessments:');
    assessments.forEach(a => {
      console.log(`  - ${a.name} (ID: ${a.id}) - Questions: ${a._count.questions}`);
    });
    
    // 2. Find one with no questions
    const deletableAssessment = assessments.find(a => a._count.questions === 0);
    
    if (deletableAssessment) {
      console.log('✅ Found deletable assessment:', deletableAssessment.name, deletableAssessment.id);
      
      // 3. Test the exact API call
      const deleteUrl = `/api/courses/${deletableAssessment.courseId}/assessments/${deletableAssessment.id}`;
      console.log('🔄 Testing DELETE URL:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      console.log('📊 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      } else {
        const responseData = await response.json();
        console.log('✅ Success response:', responseData);
      }
      
    } else {
      console.log('❌ No deletable assessments found');
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  } finally {
    await db.$disconnect();
  }
}

debugAssessmentDeletion();