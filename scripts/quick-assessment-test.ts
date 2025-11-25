import { db } from '@/lib/db';

async function quickTest() {
  try {
    console.log('🧪 Quick Assessment Interface Test');
    
    const course = await db.course.findFirst({
      where: { isActive: true },
      include: {
        assessments: {
          include: {
            questions: {
              include: {
                coMappings: {
                  include: {
                    co: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (course) {
      console.log(`✅ Course: ${course.name}`);
      console.log(`📝 Assessments: ${course.assessments.length}`);
      
      course.assessments.slice(0, 2).forEach((assessment, i) => {
        console.log(`  ${i+1}. ${assessment.name} - ${assessment.questions.length} questions`);
      });
    }
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();