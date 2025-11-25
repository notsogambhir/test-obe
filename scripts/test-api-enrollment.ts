import { db } from '../src/lib/db';

async function testAPIEnrollment() {
  try {
    console.log('=== TESTING AUTOMATIC ENROLLMENT VIA API ===\n');

    // Create another FUTURE course for API testing
    const batch = await db.batch.findFirst({
      include: {
        program: true
      }
    });

    if (!batch) {
      console.error('No batch found');
      return;
    }

    // Create a new FUTURE course
    const testCourse = await db.course.create({
      data: {
        code: 'CS103',
        name: 'Algorithms and Complexity',
        description: 'Advanced algorithm design and analysis',
        status: 'FUTURE',
        batchId: batch.id,
        isActive: true
      }
    });

    console.log(`📚 Created test course: ${testCourse.code} - ${testCourse.name} (${testCourse.status})`);

    // Test the API call
    const response = await fetch(`http://127.0.0.1:3000/api/courses/${testCourse.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HTTP-Method-Override': 'PATCH',
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    console.log(`🔄 API Response status: ${response.status}`);

    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ API Response:', responseData);
      
      if (responseData.enrollmentData) {
        console.log(`📊 Enrollment Data:`);
        console.log(`   Total eligible: ${responseData.enrollmentData.totalEligible}`);
        console.log(`   Successfully enrolled: ${responseData.enrollmentData.successfullyEnrolled}`);
        console.log(`   Final enrollment count: ${responseData._count.enrollments}`);
      }
    } else {
      const errorData = await response.text();
      console.error('❌ API Error:', errorData);
    }

    // Verify final state
    const finalCourse = await db.course.findUnique({
      where: { id: testCourse.id },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    console.log(`\n📊 Final course state:`);
    console.log(`   Status: ${finalCourse?.status}`);
    console.log(`   Enrollments: ${finalCourse?._count.enrollments}`);

  } catch (error) {
    console.error('Error testing API enrollment:', error);
  }
}

testAPIEnrollment();