#!/usr/bin/env tsx

import { db } from '../src/lib/db';

async function testCourseCreation() {
  try {
    console.log('🧪 Testing Course Creation...\n');

    // Get a batch to test with
    const batch = await db.batch.findFirst({
      include: {
        program: true
      }
    });

    if (!batch) {
      console.error('❌ No batch found to test with');
      return;
    }

    console.log(`📅 Using batch: ${batch.name} (${batch.program.name})`);

    // Create a test course
    const testCourse = await db.course.create({
      data: {
        code: 'TEST101',
        name: 'Test Course for Batch',
        batchId: batch.id,
        semester: '1st',
        description: 'This is a test course to verify batch-specific course creation',
      },
      include: {
        batch: {
          include: {
            program: true
          }
        },
        _count: {
          select: {
            courseOutcomes: true,
            assessments: true,
            enrollments: true,
          },
        },
      },
    });

    console.log('\n✅ Course created successfully:');
    console.log(`   Code: ${testCourse.code}`);
    console.log(`   Name: ${testCourse.name}`);
    console.log(`   Batch: ${testCourse.batch.name} (${testCourse.batch.program.name})`);
    console.log(`   Semester: ${testCourse.semester}`);
    console.log(`   COs: ${testCourse._count.courseOutcomes}`);
    console.log(`   Assessments: ${testCourse._count.assessments}`);
    console.log(`   Enrollments: ${testCourse._count.enrollments}`);

    // Query all courses for this batch
    const batchCourses = await db.course.findMany({
      where: { batchId: batch.id },
      include: {
        batch: {
          include: {
            program: true
          }
        },
        _count: {
          select: {
            courseOutcomes: true,
            assessments: true,
            enrollments: true,
          },
        },
      },
    });

    console.log(`\n📚 Total courses in batch ${batch.name}: ${batchCourses.length}`);
    batchCourses.forEach(course => {
      console.log(`   - ${course.code}: ${course.name}`);
    });

    // Clean up - delete the test course
    await db.course.delete({
      where: { id: testCourse.id }
    });

    console.log('\n🧹 Test course cleaned up');
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testCourseCreation();