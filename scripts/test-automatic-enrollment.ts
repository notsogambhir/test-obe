import { db } from '../src/lib/db';

async function testAutomaticEnrollment() {
  try {
    console.log('=== TESTING AUTOMATIC ENROLLMENT FUNCTIONALITY ===\n');

    // Get the FUTURE course (CS101)
    const futureCourse = await db.course.findFirst({
      where: { status: 'FUTURE' },
      include: {
        batch: {
          include: {
            program: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!futureCourse) {
      console.error('No FUTURE course found for testing');
      return;
    }

    console.log(`📚 Found FUTURE course: ${futureCourse.code} - ${futureCourse.name}`);
    console.log(`   Status: ${futureCourse.status}`);
    console.log(`   Current enrollments: ${futureCourse._count.enrollments}`);
    console.log(`   Batch: ${futureCourse.batch.name} (${futureCourse.batch.program.name})`);

    // Check eligible students
    const eligibleStudents = await db.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        batchId: futureCourse.batchId,
        programId: futureCourse.batch.programId
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true
      }
    });

    console.log(`\n👥 Found ${eligibleStudents.length} eligible students:`);
    eligibleStudents.forEach(student => {
      console.log(`   - ${student.name} (${student.studentId})`);
    });

    // Simulate the API call to update course status
    console.log(`\n🔄 Changing course status from FUTURE to ACTIVE...`);
    
    const updatedCourse = await db.course.update({
      where: { id: futureCourse.id },
      data: { 
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Course status updated to: ${updatedCourse.status}`);

    // Find eligible students again (same logic as in the API)
    const studentsToEnroll = await db.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        batchId: futureCourse.batchId,
        programId: futureCourse.batch.programId
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true
      }
    });

    // Enroll students (same logic as in the API)
    let enrolledCount = 0;
    for (const student of studentsToEnroll) {
      try {
        const existingEnrollment = await db.enrollment.findUnique({
          where: {
            courseId_studentId: {
              courseId: futureCourse.id,
              studentId: student.id
            }
          }
        });

        if (!existingEnrollment) {
          await db.enrollment.create({
            data: {
              courseId: futureCourse.id,
              studentId: student.id,
              isActive: true
            }
          });
          console.log(`   ✅ Enrolled: ${student.name} (${student.studentId})`);
          enrolledCount++;
        } else {
          console.log(`   ⚠️  Already enrolled: ${student.name} (${student.studentId})`);
        }
      } catch (error) {
        console.error(`   ❌ Error enrolling ${student.name}:`, error);
      }
    }

    // Check final state
    const finalCourse = await db.course.findUnique({
      where: { id: futureCourse.id },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    const finalEnrollments = await db.enrollment.findMany({
      where: { courseId: futureCourse.id },
      include: {
        student: {
          select: {
            name: true,
            studentId: true
          }
        }
      }
    });

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`   Course status: ${finalCourse?.status}`);
    console.log(`   Total enrollments: ${finalCourse?._count.enrollments}`);
    console.log(`   Students successfully enrolled: ${enrolledCount}`);
    
    console.log(`\n📝 Enrolled students:`);
    finalEnrollments.forEach(enrollment => {
      console.log(`   - ${enrollment.student.name} (${enrollment.student.studentId})`);
    });

    console.log(`\n✅ Automatic enrollment test completed successfully!`);

  } catch (error) {
    console.error('Error testing automatic enrollment:', error);
  }
}

testAutomaticEnrollment();