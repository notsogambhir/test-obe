// Debug template generation issue
import { db } from './src/lib/db';

async function debugTemplate() {
  try {
    console.log('🔍 Debugging template generation issue...');
    
    // Get assessment details
    const assessmentId = 'cmie7v678001nnak1xfw4eadj';
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        isActive: true
      },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('📋 Assessment found:', {
      id: assessment?.id,
      name: assessment?.name,
      sectionId: assessment?.sectionId,
      sectionName: assessment?.section?.name,
      questionsCount: assessment?.questions?.length
    });
    
    if (!assessment) {
      console.error('❌ Assessment not found');
      return;
    }
    
    // Get enrolled students
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId: 'cmie7t4op000rnak10hb8sv51',
        isActive: true,
        ...(assessment.sectionId && {
          student: {
            sectionId: assessment.sectionId
          }
        })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true
          }
        }
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    });
    
    console.log('👥 Enrolled students found:', enrollments.length);
    enrollments.forEach((enrollment, index) => {
      console.log(`  Student ${index + 1}: ${enrollment.student.name} (${enrollment.student.studentId}) - ${enrollment.student.email || 'No email'}`);
    });
    
    console.log('✅ Template generation debug completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await db.$disconnect();
  }
}

debugTemplate();