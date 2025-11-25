#!/usr/bin/env tsx

import { db } from '../src/lib/db';

async function testCourseActivation() {
  try {
    console.log('🧪 Testing Course Activation Flow...\n');

    // Get the FUTURE course BEECE101
    const futureCourse = await db.course.findFirst({
      where: { code: 'BEECE101' },
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
      console.error('❌ BEECE101 course not found');
      return;
    }

    console.log('📚 Course to activate:');
    console.log({
      id: futureCourse.id,
      code: futureCourse.code,
      name: futureCourse.name,
      status: futureCourse.status,
      batchName: futureCourse.batch.name,
      programName: futureCourse.batch.program.name,
      currentEnrollments: futureCourse._count.enrollments
    });

    // Find eligible students for this course
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
        email: true,
        isActive: true
      }
    });

    console.log('\n👥 Eligible students for automatic enrollment:');
    console.table(eligibleStudents);

    console.log(`\n📊 Found ${eligibleStudents.length} eligible students`);

    // Check if these students are already enrolled
    const existingEnrollments = await db.enrollment.findMany({
      where: {
        courseId: futureCourse.id,
        studentId: {
          in: eligibleStudents.map(s => s.id)
        }
      }
    });

    console.log(`\n📝 Existing enrollments: ${existingEnrollments.length}`);
    if (existingEnrollments.length > 0) {
      console.table(existingEnrollments.map(e => ({
        studentId: e.studentId,
        enrollmentId: e.id,
        isActive: e.isActive
      })));
    }

    // Simulate the activation process
    console.log('\n🔄 Simulating course activation from FUTURE to ACTIVE...');
    
    // Update course status
    const updatedCourse = await db.course.update({
      where: { id: futureCourse.id },
      data: { 
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Course status updated to: ${updatedCourse.status}`);

    // Create enrollments for eligible students
    let enrollmentCount = 0;
    for (const student of eligibleStudents) {
      try {
        // Check if already enrolled
        const existingEnrollment = await db.enrollment.findUnique({
          where: {
            courseId_studentId: {
              courseId: futureCourse.id,
              studentId: student.id
            }
          }
        });

        if (!existingEnrollment) {
          const enrollment = await db.enrollment.create({
            data: {
              courseId: futureCourse.id,
              studentId: student.id,
              isActive: true
            }
          });
          console.log(`✅ Enrolled: ${student.name} (${student.studentId})`);
          enrollmentCount++;
        } else {
          console.log(`⚠️  Already enrolled: ${student.name} (${student.studentId})`);
        }
      } catch (error) {
        console.error(`❌ Error enrolling ${student.name}:`, error);
      }
    }

    console.log(`\n🎉 Successfully enrolled ${enrollmentCount} new students`);

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

    console.log('\n📊 Final course state:');
    console.log({
      status: finalCourse?.status,
      totalEnrollments: finalCourse?._count.enrollments
    });

  } catch (error) {
    console.error('❌ Error testing course activation:', error);
  } finally {
    await db.$disconnect();
  }
}

testCourseActivation();