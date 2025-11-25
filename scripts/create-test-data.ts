import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function createTestData() {
  try {
    console.log('=== CREATING TEST DATA FOR ENROLLMENT TESTING ===\n');

    // Get existing data
    const batch = await db.batch.findFirst({
      include: {
        program: true
      }
    });

    if (!batch) {
      console.error('No batch found');
      return;
    }

    console.log(`Using batch: ${batch.name} (${batch.program.name})`);

    // Create sample students
    const hashedPassword = await hashPassword('password123');
    const students = await Promise.all([
      db.user.create({
        data: {
          email: 'student1@obeportal.com',
          password: hashedPassword,
          name: 'Alice Johnson',
          role: 'STUDENT',
          studentId: '2021001',
          programId: batch.programId,
          batchId: batch.id,
          isActive: true
        }
      }),
      db.user.create({
        data: {
          email: 'student2@obeportal.com',
          password: hashedPassword,
          name: 'Bob Smith',
          role: 'STUDENT',
          studentId: '2021002',
          programId: batch.programId,
          batchId: batch.id,
          isActive: true
        }
      }),
      db.user.create({
        data: {
          email: 'student3@obeportal.com',
          password: hashedPassword,
          name: 'Charlie Brown',
          role: 'STUDENT',
          studentId: '2021003',
          programId: batch.programId,
          batchId: batch.id,
          isActive: true
        }
      })
    ]);

    console.log(`Created ${students.length} students`);

    // Create a FUTURE course
    const futureCourse = await db.course.create({
      data: {
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Fundamental concepts of programming',
        status: 'FUTURE',
        batchId: batch.id,
        isActive: true
      }
    });

    console.log(`Created FUTURE course: ${futureCourse.code} - ${futureCourse.name}`);

    // Create an ACTIVE course (for comparison)
    const activeCourse = await db.course.create({
      data: {
        code: 'CS102',
        name: 'Data Structures',
        description: 'Advanced programming concepts',
        status: 'ACTIVE',
        batchId: batch.id,
        isActive: true
      }
    });

    console.log(`Created ACTIVE course: ${activeCourse.code} - ${activeCourse.name}`);

    // Manually enroll students in the ACTIVE course (for comparison)
    for (const student of students) {
      await db.enrollment.create({
        data: {
          courseId: activeCourse.id,
          studentId: student.id,
          isActive: true
        }
      });
    }

    console.log(`Enrolled ${students.length} students in ACTIVE course`);

    console.log('\n=== TEST DATA CREATED ===');
    console.log('📚 FUTURE Course (no enrollments):', futureCourse.code);
    console.log('📚 ACTIVE Course (with enrollments):', activeCourse.code);
    console.log('👥 Students created:', students.length);
    console.log('\nReady to test enrollment inheritance!');

    return {
      futureCourse,
      activeCourse,
      students,
      batch
    };

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestData();