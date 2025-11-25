import { db } from '../src/lib/db';

async function quickTest() {
  try {
    console.log('🧪 Quick CO Attainment Test...\n');

    // Get the course
    const course = await db.course.findFirst({
      where: { code: 'CS101' },
      select: { id: true, code: true, name: true }
    });

    if (!course) {
      console.error('❌ Course CS101 not found.');
      return;
    }

    console.log(`✅ Found course: ${course.code} - ${course.name}`);
    console.log(`   Course ID: ${course.id}`);

    // Get COs
    const cos = await db.cO.findMany({
      where: { courseId: course.id, isActive: true },
      select: { id: true, code: true, description: true }
    });

    console.log(`✅ Found ${cos.length} COs:`);
    cos.forEach(co => {
      console.log(`   ${co.code}: ${co.description.substring(0, 50)}...`);
    });

    // Get questions
    const questions = await db.question.findMany({
      where: {
        assessment: { courseId: course.id },
        isActive: true
      },
      include: {
        co: {
          select: { code: true }
        }
      }
    });

    console.log(`✅ Found ${questions.length} questions mapped to COs`);

    // Get enrollments
    const enrollments = await db.enrollment.findMany({
      where: { courseId: course.id, isActive: true },
      include: {
        student: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`✅ Found ${enrollments.length} enrolled students`);

    // Check mock data file
    const fs = require('fs');
    const path = require('path');
    const mockDataPath = path.join(__dirname, 'mock-student-marks.json');
    
    if (fs.existsSync(mockDataPath)) {
      const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
      console.log(`✅ Found ${mockData.length} student mark records in mock data`);
      
      // Show sample of mock data
      console.log('\n📊 Sample student marks:');
      const sample = mockData.slice(0, 3);
      sample.forEach((mark: any) => {
        console.log(`   ${mark.studentName}: ${mark.obtainedMarks}/${mark.maxMarks} marks`);
      });
    } else {
      console.log('❌ Mock student marks file not found');
    }

    console.log('\n🎉 Quick test completed successfully!');
    console.log('📋 Data is ready for CO attainment calculations');

  } catch (error) {
    console.error('❌ Error in quick test:', error);
  } finally {
    await db.$disconnect();
  }
}

quickTest();