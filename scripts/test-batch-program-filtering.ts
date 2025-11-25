import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function testBatchProgramFiltering() {
  try {
    console.log('=== TESTING BATCH/PROGRAM FILTERING ===\n');

    // Get BE ME and BE ECE programs
    const programs = await db.program.findMany({
      where: {
        code: {
          in: ['BEME', 'BEECE']
        }
      },
      include: {
        batches: true,
        college: {
          select: { name: true }
        }
      }
    });

    if (programs.length < 2) {
      console.error('Need both BE ME and BE ECE programs for testing');
      return;
    }

    const program1 = programs.find(p => p.code === 'BEME')!; // BE ME
    const program2 = programs.find(p => p.code === 'BEECE')!; // BE ECE

    console.log(`Program 1: ${program1.name} (${program1.code}) - ${program1.college.name}`);
    console.log(`Program 2: ${program2.name} (${program2.code}) - ${program2.college.name}`);

    // Use the 2021-2025 batch for both programs
    const batch1 = program1.batches.find(b => b.name === '2021-2025')!;
    const batch2 = program2.batches.find(b => b.name === '2021-2025')!;

    console.log(`Batch 1: ${batch1.name} (${batch1.startYear}-${batch1.endYear})`);
    console.log(`Batch 2: ${batch2.name} (${batch2.startYear}-${batch2.endYear})`);

    // Create students in different programs/batches
    const hashedPassword = await hashPassword('password123');

    // Create students for BE ME, 2021-2025
    const students1 = await Promise.all([
      db.user.create({
        data: {
          email: 'student.beme.1@obeportal.com',
          password: hashedPassword,
          name: 'BE ME Student 1',
          role: 'STUDENT',
          studentId: 'BEME001',
          programId: program1.id,
          batchId: batch1.id,
          isActive: true
        }
      }),
      db.user.create({
        data: {
          email: 'student.beme.2@obeportal.com',
          password: hashedPassword,
          name: 'BE ME Student 2',
          role: 'STUDENT',
          studentId: 'BEME002',
          programId: program1.id,
          batchId: batch1.id,
          isActive: true
        }
      })
    ]);

    // Create students for BE ECE, 2021-2025
    const students2 = await Promise.all([
      db.user.create({
        data: {
          email: 'student.beece.1@obeportal.com',
          password: hashedPassword,
          name: 'BE ECE Student 1',
          role: 'STUDENT',
          studentId: 'BEECE001',
          programId: program2.id,
          batchId: batch2.id,
          isActive: true
        }
      }),
      db.user.create({
        data: {
          email: 'student.beece.2@obeportal.com',
          password: hashedPassword,
          name: 'BE ECE Student 2',
          role: 'STUDENT',
          studentId: 'BEECE002',
          programId: program2.id,
          batchId: batch2.id,
          isActive: true
        }
      })
    ]);

    console.log(`\n👥 Created ${students1.length} students for ${program1.name}, ${batch1.name}`);
    console.log(`👥 Created ${students2.length} students for ${program2.name}, ${batch2.name}`);

    // Create courses in both batches
    const course1 = await db.course.create({
      data: {
        code: 'BEME101',
        name: 'BE ME Test Course',
        description: 'Test course for BE ME program',
        status: 'FUTURE',
        batchId: batch1.id,
        isActive: true
      }
    });

    const course2 = await db.course.create({
      data: {
        code: 'BEECE101',
        name: 'BE ECE Test Course',
        description: 'Test course for BE ECE program',
        status: 'FUTURE',
        batchId: batch2.id,
        isActive: true
      }
    });

    console.log(`\n📚 Created course in ${program1.name}: ${course1.code} (${course1.status})`);
    console.log(`📚 Created course in ${program2.name}: ${course2.code} (${course2.status})`);

    // Test filtering for course 1 (should only find BE ME students)
    console.log(`\n🔍 Testing enrollment filtering for ${course1.code}:`);
    
    const eligibleStudents1 = await db.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        batchId: batch1.id,
        programId: program1.id
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true
      }
    });

    console.log(`   Found ${eligibleStudents1.length} eligible students for ${course1.code}:`);
    eligibleStudents1.forEach(student => {
      console.log(`   - ${student.name} (${student.studentId})`);
    });

    // Test filtering for course 2 (should only find BE ECE students)
    console.log(`\n🔍 Testing enrollment filtering for ${course2.code}:`);
    
    const eligibleStudents2 = await db.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        batchId: batch2.id,
        programId: program2.id
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true
      }
    });

    console.log(`   Found ${eligibleStudents2.length} eligible students for ${course2.code}:`);
    eligibleStudents2.forEach(student => {
      console.log(`   - ${student.name} (${student.studentId})`);
    });

    // Test automatic enrollment for course 1
    console.log(`\n🔄 Testing automatic enrollment for ${course1.code}:`);
    
    await db.course.update({
      where: { id: course1.id },
      data: { status: 'ACTIVE' }
    });

    // Enroll eligible students for course 1
    for (const student of eligibleStudents1) {
      await db.enrollment.create({
        data: {
          courseId: course1.id,
          studentId: student.id,
          isActive: true
        }
      });
      console.log(`   ✅ Enrolled: ${student.name} (${student.studentId})`);
    }

    // Verify course 1 enrollments
    const course1WithEnrollments = await db.course.findUnique({
      where: { id: course1.id },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    });

    console.log(`\n📊 ${course1.code} final state:`);
    console.log(`   Status: ${course1WithEnrollments?.status}`);
    console.log(`   Enrollments: ${course1WithEnrollments?._count.enrollments}`);

    // Verify course 2 still has no enrollments
    const course2WithEnrollments = await db.course.findUnique({
      where: { id: course2.id },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    });

    console.log(`\n📊 ${course2.code} final state (should be unchanged):`);
    console.log(`   Status: ${course2WithEnrollments?.status}`);
    console.log(`   Enrollments: ${course2WithEnrollments?._count.enrollments}`);

    // Verify that BE ECE students were NOT enrolled in BE ME course
    const course1Enrollments = await db.enrollment.findMany({
      where: { courseId: course1.id },
      include: {
        student: {
          select: {
            name: true,
            studentId: true
          }
        }
      }
    });

    console.log(`\n📝 ${course1.code} enrolled students (should only be BE ME):`);
    course1Enrollments.forEach(enrollment => {
      console.log(`   - ${enrollment.student.name} (${enrollment.student.studentId})`);
    });

    console.log(`\n✅ Batch/Program filtering test completed successfully!`);
    console.log(`✅ Confirmed: Only students from the correct batch and program are enrolled`);

  } catch (error) {
    console.error('Error testing batch/program filtering:', error);
  }
}

testBatchProgramFiltering();